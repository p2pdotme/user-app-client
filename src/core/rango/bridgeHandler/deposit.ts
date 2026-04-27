import { isEthereumWallet } from "@dynamic-labs/ethereum";
import type { Wallet } from "@dynamic-labs/sdk-react-core";
import { isSolanaWallet } from "@dynamic-labs/solana";
import { VersionedTransaction } from "@solana/web3.js";
import { toast } from "sonner";
import type { useSounds } from "@/hooks";
import { analytics, EVENTS } from "@/lib/analytics";
import { captureError, withSentrySpan } from "@/lib/sentry";
import type { DepositState } from "@/pages/deposit/shared";
import { type RangoSwapResponse, RangoTxType } from "../types";
import { trackSwapStatus, waitForApproval } from "./utils";

export const handleDeposit = async (
  swapRes: RangoSwapResponse,
  primaryWallet: Wallet | null,
  setDepositData: React.Dispatch<React.SetStateAction<DepositState>>,
  sounds: ReturnType<typeof useSounds>,
) => {
  console.log(
    "[DepositHandler] Processing deposit with swap response:",
    swapRes,
  );

  // Track deposit transaction started
  analytics.track(EVENTS.TRANSACTION, {
    transaction_type: "deposit",
    status: "started",
    amount: swapRes.route?.outputAmount || "0",
    wallet_type: primaryWallet?.connector?.name || "unknown",
    source_chain: swapRes.route?.from?.blockchain || "unknown",
    destination_chain: swapRes.route?.to?.blockchain || "unknown",
  });

  return withSentrySpan(
    "bridge.deposit",
    "Handle Deposit Transaction",
    async () => {
      try {
        if (primaryWallet && isEthereumWallet(primaryWallet)) {
          const walletClient = await primaryWallet.getWalletClient();

          if (swapRes.tx && swapRes.tx.type === RangoTxType.EVM) {
            const tx = swapRes.tx;
            console.log("[DepositHandler] EVM transaction details:", tx);

            // Handle approval if required
            if (tx.approveData && tx.approveTo) {
              console.log(
                "[DepositHandler] Approval required, sending approve transaction",
              );
              setDepositData((prev) => ({ ...prev, status: "approval" }));

              const approveTransaction = {
                from: tx.from as `0x${string}`,
                to: tx.approveTo as `0x${string}`,
                data: tx.approveData as `0x${string}`,
                gasPrice: tx.gasPrice ? BigInt(tx.gasPrice) : undefined,
              };
              console.log(
                "[DepositHandler] Approve transaction details:",
                approveTransaction,
              );

              const approveHash =
                await walletClient.sendTransaction(approveTransaction);
              console.log("[DepositHandler] Approve transaction sent", {
                approveHash,
              });

              console.log("[DepositHandler] Waiting for approval confirmation");
              await waitForApproval(
                swapRes.requestId,
                approveHash,
                setDepositData,
              );
            }

            // Handle main swap transaction
            console.log("[DepositHandler] Sending main swap transaction");
            setDepositData((prev) => ({ ...prev, status: "swapping" }));

            const mainTransaction = {
              from: tx.from as `0x${string}`,
              to: tx.txTo as `0x${string}`,
              data: tx.txData as `0x${string}`,
              value: BigInt(tx.value ? tx.value : "0"),
              gasLimit: tx.gasLimit,
            };
            console.log(
              "[DepositHandler] Main transaction details:",
              mainTransaction,
            );

            const mainTxHash =
              await walletClient.sendTransaction(mainTransaction);
            console.log("[DepositHandler] Main transaction sent", {
              mainTxHash,
            });

            console.log("[DepositHandler] Tracking swap status");
            const success = await trackSwapStatus(
              swapRes.requestId,
              mainTxHash,
              setDepositData,
              true,
            );

            if (success) {
              toast.success("Deposit completed successfully");
              sounds.triggerSuccessSound(); // Sound feedback for successful deposit
              console.log(
                "[DepositHandler] EVM deposit completed successfully",
              );

              // Track deposit success
              analytics.track(EVENTS.TRANSACTION, {
                transaction_type: "deposit",
                status: "completed",
                amount: swapRes.route?.outputAmount || "0",
                wallet_type: primaryWallet?.connector?.name || "unknown",
                source_chain: swapRes.route?.from?.blockchain || "unknown",
                destination_chain: swapRes.route?.to?.blockchain || "unknown",
              });

              // Note: Not setting status to "completed" here - handled by trackSwapStatus or calling code
            } else {
              setDepositData((prev) => ({ ...prev, status: "failed" }));
              sounds.triggerFailureSound(); // Sound feedback for failed deposit

              // Track deposit failure
              analytics.track(EVENTS.TRANSACTION, {
                transaction_type: "deposit",
                status: "failed",
                amount: swapRes.route?.outputAmount || "0",
                error_code: "swap_failed",
                wallet_type: primaryWallet?.connector?.name || "unknown",
                source_chain: swapRes.route?.from?.blockchain || "unknown",
                destination_chain: swapRes.route?.to?.blockchain || "unknown",
              });

              const error = new Error("Deposit failed");
              captureError(error, {
                operation: "deposit_swap_tracking",
                component: "handleDeposit",
                userId: primaryWallet?.address,
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
          }
        } else if (
          primaryWallet &&
          isSolanaWallet(primaryWallet) &&
          swapRes.tx?.type === RangoTxType.SOLANA
        ) {
          const tx = swapRes.tx;
          console.log("[DepositHandler] Solana transaction details:", tx);

          const signer = await primaryWallet.getSigner();
          console.log("[DepositHandler] Signer retrieved from primary wallet");

          if (tx.serializedMessage) {
            console.log(
              "[DepositHandler] Deserializing serialized transaction message",
            );
            const versionedTransaction = VersionedTransaction.deserialize(
              Buffer.from(tx.serializedMessage),
            );
            console.log(
              "[DepositHandler] Serialized transaction deserialized successfully",
            );

            // Set swapping status for Solana (no approval needed)
            setDepositData((prev) => ({ ...prev, status: "swapping" }));

            console.log("[DepositHandler] Signing and sending transaction");
            const { signature } =
              await signer.signAndSendTransaction(versionedTransaction);
            console.log(
              "[DepositHandler] Transaction signed and sent, signature:",
              signature,
            );

            console.log(
              "[DepositHandler] Tracking swap status for Solana transaction",
            );
            const success = await trackSwapStatus(
              swapRes.requestId,
              signature,
              setDepositData,
              true,
            );

            if (success) {
              toast.success("Deposit completed successfully");
              sounds.triggerSuccessSound(); // Sound feedback for successful Solana deposit
              console.log(
                "[DepositHandler] Solana deposit completed successfully",
              );

              // Track Solana deposit success
              analytics.track(EVENTS.TRANSACTION, {
                transaction_type: "deposit",
                status: "completed",
                amount: swapRes.route?.outputAmount || "0",
                wallet_type: "solana",
                source_chain: swapRes.route?.from?.blockchain || "SOLANA",
                destination_chain: swapRes.route?.to?.blockchain || "unknown",
              });

              // Note: Not setting status to "completed" here - handled by trackSwapStatus or calling code
            } else {
              setDepositData((prev) => ({ ...prev, status: "failed" }));
              sounds.triggerFailureSound(); // Sound feedback for failed Solana deposit

              // Track Solana deposit failure
              analytics.track(EVENTS.TRANSACTION, {
                transaction_type: "deposit",
                status: "failed",
                amount: swapRes.route?.outputAmount || "0",
                error_code: "swap_failed",
                wallet_type: "solana",
                source_chain: swapRes.route?.from?.blockchain || "SOLANA",
                destination_chain: swapRes.route?.to?.blockchain || "unknown",
              });

              const error = new Error("Deposit failed");
              captureError(error, {
                operation: "deposit_solana_tracking",
                component: "handleDeposit",
                userId: primaryWallet?.address,
                extra: {
                  requestId: swapRes.requestId,
                  signature,
                  amount: swapRes.route?.outputAmount,
                  sourceChain: swapRes.route?.from?.blockchain,
                  destinationChain: swapRes.route?.to?.blockchain,
                },
              });

              throw error;
            }
          } else {
            setDepositData((prev) => ({ ...prev, status: "failed" }));
            sounds.triggerFailureSound(); // Sound feedback for missing serialized message

            // Track Solana serialization failure
            analytics.track(EVENTS.TRANSACTION, {
              transaction_type: "deposit",
              status: "failed",
              amount: swapRes.route?.outputAmount || "0",
              error_code: "solana_serialization_failed",
              wallet_type: "solana",
              source_chain: swapRes.route?.from?.blockchain || "SOLANA",
              destination_chain: swapRes.route?.to?.blockchain || "unknown",
            });

            const error = new Error(
              "Serialized message is missing in Solana transaction",
            );
            captureError(error, {
              operation: "deposit_solana_validation",
              component: "handleDeposit",
              userId: primaryWallet?.address,
              extra: {
                requestId: swapRes.requestId,
                amount: swapRes.route?.outputAmount,
                sourceChain: swapRes.route?.from?.blockchain,
                destinationChain: swapRes.route?.to?.blockchain,
              },
            });

            throw error;
          }
        } else {
          setDepositData((prev) => ({ ...prev, status: "failed" }));
          sounds.triggerFailureSound(); // Sound feedback for unsupported wallet/missing data

          // Track unsupported wallet/missing data failure
          analytics.track(EVENTS.TRANSACTION, {
            transaction_type: "deposit",
            status: "failed",
            amount: swapRes.route?.outputAmount || "0",
            error_code: "unsupported_wallet_or_missing_data",
            wallet_type: primaryWallet?.connector?.name || "unknown",
            source_chain: swapRes.route?.from?.blockchain || "unknown",
            destination_chain: swapRes.route?.to?.blockchain || "unknown",
          });

          const error = new Error(
            "Unsupported wallet type or missing transaction data",
          );
          captureError(error, {
            operation: "deposit_validation",
            component: "handleDeposit",
            userId: primaryWallet?.address,
            extra: {
              walletType: primaryWallet?.connector?.name,
              hasWallet: !!primaryWallet,
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
          operation: "deposit_handler",
          component: "handleDeposit",
          userId: primaryWallet?.address,
          extra: {
            requestId: swapRes.requestId,
            walletType: primaryWallet?.connector?.name,
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
