import { toast } from "sonner";
import { isAddress, sendAndConfirmTransaction } from "thirdweb";
import { base } from "thirdweb/chains";
import type { Account } from "thirdweb/wallets";
import {
  estimatedPrepareTransaction,
  thirdwebClient,
} from "@/core/adapters/thirdweb/client";
import type { useSounds } from "@/hooks";
import { analytics, EVENTS } from "@/lib/analytics";
import { captureError, withSentrySpan } from "@/lib/sentry";
import type { WithdrawState } from "@/pages/withdraw/shared";
import { type RangoSwapResponse, RangoTxType } from "../types";
import { trackSwapStatus, waitForApproval } from "./utils";

export const handleWithdraw = async (
  swapRes: RangoSwapResponse,
  account: Account | undefined,
  setWithdrawData: React.Dispatch<React.SetStateAction<WithdrawState>>,
  sounds: ReturnType<typeof useSounds>,
) => {
  console.log(
    "[WithdrawHandler] Processing withdraw with swap response:",
    swapRes,
  );
  console.log("[WithdrawHandler] Account:", account);
  console.log("[WithdrawHandler] Account address:", account?.address);
  console.log("[WithdrawHandler] Transaction data:", swapRes.tx);

  // Track withdraw transaction started
  analytics.track(EVENTS.TRANSACTION, {
    transaction_type: "withdraw",
    status: "started",
    amount: swapRes.route?.outputAmount || "0",
    wallet_type: "thirdweb",
    source_chain: swapRes.route?.from?.blockchain || "BASE",
    destination_chain: swapRes.route?.to?.blockchain || "unknown",
  });

  return withSentrySpan(
    "bridge.withdraw",
    "Handle Withdraw Transaction",
    async () => {
      try {
        if (account?.address && isAddress(account.address) && swapRes.tx) {
          if (swapRes.tx.type === RangoTxType.EVM) {
            const tx = swapRes.tx;
            console.log("[WithdrawHandler] EVM transaction details:", tx);

            // Handle approval if required
            if (tx.approveData && tx.approveTo) {
              console.log(
                "[WithdrawHandler] Approval required, sending approve transaction",
              );
              setWithdrawData((prev) => ({ ...prev, status: "approval" }));

              const approveTransaction = await estimatedPrepareTransaction({
                from: account.address,
                to: tx.approveTo as `0x${string}`,
                chain: base,
                client: thirdwebClient,
                data: tx.approveData as `0x${string}`,
              });
              console.log(
                "[WithdrawHandler] Approve transaction details:",
                approveTransaction,
              );

              if (approveTransaction.isErr()) {
                setWithdrawData((prev) => ({ ...prev, status: "failed" }));
                sounds.triggerFailureSound(); // Sound feedback for approve transaction failure

                // Track approve transaction failure
                analytics.track(EVENTS.TRANSACTION, {
                  transaction_type: "withdraw",
                  status: "failed",
                  amount: swapRes.route?.outputAmount || "0",
                  error_code: "approve_transaction_failed",
                  wallet_type: "thirdweb",
                  source_chain: swapRes.route?.from?.blockchain || "BASE",
                  destination_chain: swapRes.route?.to?.blockchain || "unknown",
                });

                const error = new Error(
                  "Approve transaction preparation failed",
                );
                captureError(error, {
                  operation: "withdraw_approve_preparation",
                  component: "handleWithdraw",
                  userId: account.address,
                  extra: {
                    requestId: swapRes.requestId,
                    approveError: approveTransaction.error,
                    approveTo: tx.approveTo,
                    amount: swapRes.route?.outputAmount,
                    sourceChain: swapRes.route?.from?.blockchain,
                    destinationChain: swapRes.route?.to?.blockchain,
                  },
                });

                toast.error("Approve transaction failed");
                throw error;
              }

              const { transactionHash: approveHash } =
                await sendAndConfirmTransaction({
                  account,
                  transaction: approveTransaction.value,
                });
              console.log("[WithdrawHandler] Approve transaction sent", {
                approveHash,
              });

              console.log(
                "[WithdrawHandler] Waiting for approval confirmation",
              );
              await waitForApproval(
                swapRes.requestId,
                approveHash,
                setWithdrawData,
              );
            }

            // Handle main swap transaction
            console.log("[WithdrawHandler] Sending main swap transaction");
            setWithdrawData((prev) => ({ ...prev, status: "swapping" }));

            const mainTransaction = await estimatedPrepareTransaction({
              from: account.address,
              to: tx.txTo as `0x${string}`,
              chain: base,
              client: thirdwebClient,
              data: tx.txData as `0x${string}`,
            });
            console.log(
              "[WithdrawHandler] Main transaction details:",
              mainTransaction,
            );

            if (mainTransaction.isErr()) {
              setWithdrawData((prev) => ({ ...prev, status: "failed" }));
              sounds.triggerFailureSound(); // Sound feedback for main transaction failure

              // Track main transaction failure
              analytics.track(EVENTS.TRANSACTION, {
                transaction_type: "withdraw",
                status: "failed",
                amount: swapRes.route?.outputAmount || "0",
                error_code: "main_transaction_failed",
                wallet_type: "thirdweb",
                source_chain: swapRes.route?.from?.blockchain || "BASE",
                destination_chain: swapRes.route?.to?.blockchain || "unknown",
              });

              const error = new Error("Main transaction preparation failed");
              captureError(error, {
                operation: "withdraw_main_preparation",
                component: "handleWithdraw",
                userId: account.address,
                extra: {
                  requestId: swapRes.requestId,
                  mainError: mainTransaction.error,
                  txTo: tx.txTo,
                  amount: swapRes.route?.outputAmount,
                  sourceChain: swapRes.route?.from?.blockchain,
                  destinationChain: swapRes.route?.to?.blockchain,
                },
              });

              toast.error("Main transaction failed");
              throw error;
            }

            const { transactionHash: mainTxHash } =
              await sendAndConfirmTransaction({
                account,
                transaction: mainTransaction.value,
              });
            console.log("[WithdrawHandler] Main transaction sent", {
              mainTxHash,
            });

            console.log("[WithdrawHandler] Tracking swap status");
            const success = await trackSwapStatus(
              swapRes.requestId,
              mainTxHash,
              setWithdrawData,
              false,
            );

            if (success) {
              toast.success("Withdrawal completed successfully");
              sounds.triggerSuccessSound(); // Sound feedback for successful withdrawal
              console.log(
                "[WithdrawHandler] EVM withdraw completed successfully",
              );

              // Track withdraw success
              analytics.track(EVENTS.TRANSACTION, {
                transaction_type: "withdraw",
                status: "completed",
                amount: swapRes.route?.outputAmount || "0",
                wallet_type: "thirdweb",
                source_chain: swapRes.route?.from?.blockchain || "BASE",
                destination_chain: swapRes.route?.to?.blockchain || "unknown",
              });

              // Note: Not setting status to "completed" here - handled by trackSwapStatus or calling code
            } else {
              setWithdrawData((prev) => ({ ...prev, status: "failed" }));
              sounds.triggerFailureSound(); // Sound feedback for failed withdrawal

              // Track withdraw failure
              analytics.track(EVENTS.TRANSACTION, {
                transaction_type: "withdraw",
                status: "failed",
                amount: swapRes.route?.outputAmount || "0",
                error_code: "swap_failed",
                wallet_type: "thirdweb",
                source_chain: swapRes.route?.from?.blockchain || "BASE",
                destination_chain: swapRes.route?.to?.blockchain || "unknown",
              });

              const error = new Error("Withdrawal failed");
              captureError(error, {
                operation: "withdraw_swap_tracking",
                component: "handleWithdraw",
                userId: account.address,
                extra: {
                  requestId: swapRes.requestId,
                  txHash: mainTxHash,
                  amount: swapRes.route?.outputAmount,
                  sourceChain: swapRes.route?.from?.blockchain,
                  destinationChain: swapRes.route?.to?.blockchain,
                },
              });

              throw error;
            }
          } else {
            setWithdrawData((prev) => ({ ...prev, status: "failed" }));
            sounds.triggerFailureSound(); // Sound feedback for unsupported transaction type

            // Track unsupported transaction type failure
            analytics.track(EVENTS.TRANSACTION, {
              transaction_type: "withdraw",
              status: "failed",
              amount: swapRes.route?.outputAmount || "0",
              error_code: "unsupported_transaction_type",
              wallet_type: "thirdweb",
              source_chain: swapRes.route?.from?.blockchain || "BASE",
              destination_chain: swapRes.route?.to?.blockchain || "unknown",
            });

            const error = new Error("Unsupported transaction type");
            captureError(error, {
              operation: "withdraw_validation",
              component: "handleWithdraw",
              userId: account.address,
              extra: {
                requestId: swapRes.requestId,
                txType: swapRes.tx?.type,
                amount: swapRes.route?.outputAmount,
                sourceChain: swapRes.route?.from?.blockchain,
                destinationChain: swapRes.route?.to?.blockchain,
              },
            });

            throw error;
          }
        } else {
          setWithdrawData((prev) => ({ ...prev, status: "failed" }));
          sounds.triggerFailureSound(); // Sound feedback for withdraw validation errors

          // Determine specific error code
          let errorCode = "unknown_validation_error";
          if (!account?.address) {
            errorCode = "wallet_account_not_found";
          } else if (!isAddress(account.address)) {
            errorCode = "invalid_wallet_address";
          } else if (!swapRes.tx) {
            errorCode = "transaction_data_missing";
          }

          // Track withdraw validation failure
          analytics.track(EVENTS.TRANSACTION, {
            transaction_type: "withdraw",
            status: "failed",
            amount: swapRes.route?.outputAmount || "0",
            error_code: errorCode,
            wallet_type: "thirdweb",
            source_chain: swapRes.route?.from?.blockchain || "BASE",
            destination_chain: swapRes.route?.to?.blockchain || "unknown",
          });

          let error: Error;
          // Provide more specific error messages
          if (!account?.address) {
            error = new Error("Wallet account not found or not connected");
          } else if (!isAddress(account.address)) {
            error = new Error(`Invalid wallet address: ${account.address}`);
          } else if (!swapRes.tx) {
            error = new Error("Transaction data missing from swap response");
          } else {
            error = new Error("Unknown validation error in withdraw handler");
          }

          captureError(error, {
            operation: "withdraw_validation",
            component: "handleWithdraw",
            userId: account?.address,
            extra: {
              requestId: swapRes.requestId,
              hasAccount: !!account,
              hasAddress: !!account?.address,
              isValidAddress: account?.address
                ? isAddress(account.address)
                : false,
              hasTx: !!swapRes.tx,
              txType: swapRes.tx?.type,
              amount: swapRes.route?.outputAmount,
              sourceChain: swapRes.route?.from?.blockchain,
              destinationChain: swapRes.route?.to?.blockchain,
            },
          });

          throw error;
        }
      } catch (error) {
        // Capture any unexpected errors
        captureError(error, {
          operation: "withdraw_handler",
          component: "handleWithdraw",
          userId: account?.address,
          extra: {
            requestId: swapRes.requestId,
            hasAccount: !!account,
            hasAddress: !!account?.address,
            amount: swapRes.route?.outputAmount,
            sourceChain: swapRes.route?.from?.blockchain,
            destinationChain: swapRes.route?.to?.blockchain,
          },
        });

        throw error;
      }
    },
  );
};
