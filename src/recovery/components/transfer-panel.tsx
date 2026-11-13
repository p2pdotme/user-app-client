import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { type Address, isAddress, isAddressEqual } from "viem";
import {
  type RecoveryNetworkKey,
  type RecoveryToken,
  toRecoveryError,
} from "@/recovery/core";
import {
  parseTokenAmount,
  useRecoveryOwner,
  useRecoveryTokens,
  useRecoveryTransfer,
  validateTransfer,
} from "@/recovery/hooks";
import { toErrorDetail } from "@/recovery/lib/format";
import { FundingDrawer } from "./funding-drawer";
import { TokenList } from "./token-list";
import {
  type RecipientMode,
  TransferForm,
  type TransferFormErrors,
} from "./transfer-form";
import { type TransferReceipt, TransferResult } from "./transfer-result";

interface TransferPanelProps {
  network: RecoveryNetworkKey;
  smartAccount: Address;
  /** Lets the page lock network switching while a transfer is in flight. */
  onBusyChange: (busy: boolean) => void;
}

function getRecipientError(
  recipient: string,
  smartAccount: Address,
): string | null {
  const value = recipient.trim();
  if (!value) return null;
  if (!isAddress(value)) return "INVALID_ADDRESS";
  // Sending to the account itself would move nothing
  if (isAddressEqual(value, smartAccount)) return "RECOVERY_ERROR_SAME_ADDRESS";
  return null;
}

function getAmountError(amount: string, token: RecoveryToken): string | null {
  if (!amount.trim()) return null;
  const units = parseTokenAmount(amount, token.decimals);
  if (units === null || units <= 0n) return "INVALID_AMOUNT";
  if (units > token.balance) return "RECOVERY_ERROR_INSUFFICIENT";
  return null;
}

/**
 * Balances, the send form and its outcome for one account on one network.
 * Mounted with a key of network + account, so switching either starts clean.
 */
export function TransferPanel({
  network,
  smartAccount,
  onBusyChange,
}: TransferPanelProps) {
  const { t } = useTranslation();
  const owner = useRecoveryOwner();
  const tokensQuery = useRecoveryTokens(network, smartAccount);
  const transfer = useRecoveryTransfer(network);

  const [selectedAddress, setSelectedAddress] = useState<Address>();
  const [recipientMode, setRecipientMode] = useState<RecipientMode>("custom");
  const [customRecipient, setCustomRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const [receipt, setReceipt] = useState<TransferReceipt | null>(null);
  const [fundingAddress, setFundingAddress] = useState<string | null>(null);

  const isSending = transfer.isPending;
  useEffect(() => {
    onBusyChange(isSending);
    return () => onBusyChange(false);
  }, [isSending, onBusyChange]);

  const tokens = tokensQuery.data;
  // Defaults to the first token that actually holds something
  const token =
    tokens?.find(
      (item) => item.address === selectedAddress && item.balance > 0n,
    ) ?? tokens?.find((item) => item.balance > 0n);

  const recipient =
    recipientMode === "owner" && owner ? owner : customRecipient;
  const errors: TransferFormErrors = {
    recipient: getRecipientError(recipient, smartAccount),
    amount: token ? getAmountError(amount, token) : null,
  };
  const canSubmit =
    !!token &&
    !isSending &&
    errors.recipient === null &&
    validateTransfer({ token, recipient, amount }).ok;

  const handleSubmit = () => {
    if (!token || !canSubmit) return;
    const sent = { amount: amount.trim(), symbol: token.symbol, recipient };
    transfer.mutate(
      { smartAccount, token, recipient, amount },
      {
        onSuccess: (result) => {
          setReceipt({ ...sent, result });
          setAmount("");
        },
        onError: (raw) => {
          const error = toRecoveryError(raw);
          if (error.code === "InsufficientGas") {
            setFundingAddress(error.fundingAddress ?? smartAccount);
            return;
          }
          if (error.code === "ExecutionFailed") {
            toast.error(t("RECOVERY_TRANSFER_REVERTED"));
            return;
          }
          toast.error(t("RECOVERY_TRANSFER_FAILED"), {
            description: toErrorDetail(error.message),
          });
        },
      },
    );
  };

  return (
    <>
      <TokenList
        network={network}
        tokens={tokens}
        isLoading={tokensQuery.isPending}
        isError={tokensQuery.isError}
        isRefreshing={tokensQuery.isFetching}
        selectedAddress={receipt ? undefined : token?.address}
        disabled={isSending}
        onSelect={(next) => {
          setSelectedAddress(next.address);
          setAmount("");
          setReceipt(null);
        }}
        onRefresh={() => tokensQuery.refetch()}
      />

      {receipt ? (
        <TransferResult
          network={network}
          receipt={receipt}
          onSendAnother={() => setReceipt(null)}
        />
      ) : (
        token && (
          <TransferForm
            network={network}
            token={token}
            owner={owner}
            recipientMode={recipientMode}
            recipient={customRecipient}
            amount={amount}
            errors={errors}
            canSubmit={canSubmit}
            isSending={isSending}
            onRecipientModeChange={setRecipientMode}
            onRecipientChange={setCustomRecipient}
            onAmountChange={setAmount}
            onSubmit={handleSubmit}
          />
        )
      )}

      <FundingDrawer
        network={network}
        fundingAddress={fundingAddress}
        onClose={() => setFundingAddress(null)}
        onRetry={handleSubmit}
      />
    </>
  );
}
