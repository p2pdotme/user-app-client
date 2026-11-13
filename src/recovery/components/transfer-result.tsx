import { CheckCircle2, Clock, ExternalLink } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { truncateAddress } from "@/lib/utils";
import {
  getExplorerTxUrl,
  type RecoveryNetworkKey,
  type UserOpResult,
} from "@/recovery/core";
import { CopyButton } from "./copy-button";

/** What was sent, kept so the receipt survives the form being cleared. */
export interface TransferReceipt {
  result: UserOpResult;
  amount: string;
  symbol: string;
  recipient: string;
}

interface TransferResultProps {
  network: RecoveryNetworkKey;
  receipt: TransferReceipt;
  onSendAnother: () => void;
}

/** Outcome of a transfer: confirmed on-chain, or submitted but not yet seen. */
export function TransferResult({
  network,
  receipt,
  onSendAnother,
}: TransferResultProps) {
  const { t } = useTranslation();
  const { result, amount, symbol, recipient } = receipt;
  const isConfirmed = result.status === "confirmed";
  const txHash = result.status === "confirmed" ? result.txHash : undefined;
  const explorerUrl = txHash ? getExplorerTxUrl(network, txHash) : null;
  const summary = { amount, symbol, recipient: truncateAddress(recipient) };

  return (
    <section
      role="status"
      aria-live="polite"
      className="flex flex-col gap-4 rounded-xl bg-primary/10 p-4">
      <div className="flex flex-col items-center gap-2 text-center">
        {isConfirmed ? (
          <CheckCircle2 className="size-10 text-success" />
        ) : (
          <Clock className="size-10 text-warning" />
        )}
        <p className="font-semibold text-lg">
          {t(
            isConfirmed
              ? "RECOVERY_RESULT_CONFIRMED_TITLE"
              : "RECOVERY_RESULT_PENDING_TITLE",
          )}
        </p>
        <p className="text-muted-foreground text-sm">
          {t(
            isConfirmed
              ? "RECOVERY_RESULT_CONFIRMED_DESCRIPTION"
              : "RECOVERY_RESULT_PENDING_DESCRIPTION",
            summary,
          )}
        </p>
      </div>

      {txHash && (
        <div className="flex flex-col gap-1.5">
          <p className="text-muted-foreground text-xs">
            {t("TRANSACTION_HASH")}
          </p>
          <CopyButton
            value={txHash}
            copiedMessage={t("RECOVERY_HASH_COPIED")}
            ariaLabel={t("RECOVERY_COPY_HASH")}
            className="bg-background/60 hover:bg-background/80"
          />
        </div>
      )}

      {!txHash && result.userOpHash && (
        <div className="flex flex-col gap-1.5">
          <p className="text-muted-foreground text-xs">
            {t("RECOVERY_USER_OP_HASH")}
          </p>
          <CopyButton
            value={result.userOpHash}
            copiedMessage={t("RECOVERY_HASH_COPIED")}
            ariaLabel={t("RECOVERY_COPY_HASH")}
            className="bg-background/60 hover:bg-background/80"
          />
        </div>
      )}

      <div className="flex flex-col gap-2">
        {explorerUrl && (
          <Button asChild className="h-12 w-full">
            <a href={explorerUrl} target="_blank" rel="noopener noreferrer">
              {t("RECOVERY_VIEW_ON_EXPLORER")}
              <ExternalLink />
            </a>
          </Button>
        )}
        <Button
          variant={explorerUrl ? "outline" : "default"}
          className="h-12 w-full"
          onClick={onSendAnother}>
          {t(isConfirmed ? "RECOVERY_SEND_ANOTHER" : "DONE")}
        </Button>
      </div>
    </section>
  );
}
