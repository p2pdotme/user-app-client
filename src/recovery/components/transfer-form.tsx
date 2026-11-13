import { Clipboard, Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { isAddress } from "viem";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import {
  isNativeToken,
  RECOVERY_NETWORKS,
  type RecoveryNetworkKey,
  type RecoveryToken,
} from "@/recovery/core";
import { formatBalanceForDisplay } from "@/recovery/lib/format";

export type RecipientMode = "custom" | "owner";

/** i18n keys of the per-field problems, or null when the field is fine. */
export interface TransferFormErrors {
  recipient: string | null;
  amount: string | null;
}

interface TransferFormProps {
  network: RecoveryNetworkKey;
  token: RecoveryToken;
  /** The EOA that owns the account; enables "send to my wallet owner". */
  owner: string | undefined;
  recipientMode: RecipientMode;
  recipient: string;
  amount: string;
  errors: TransferFormErrors;
  canSubmit: boolean;
  isSending: boolean;
  onRecipientModeChange: (mode: RecipientMode) => void;
  onRecipientChange: (value: string) => void;
  onAmountChange: (value: string) => void;
  onSubmit: () => void;
}

const PILL_TAB =
  "cursor-pointer rounded-full border border-border px-4 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground";

export function TransferForm({
  network,
  token,
  owner,
  recipientMode,
  recipient,
  amount,
  errors,
  canSubmit,
  isSending,
  onRecipientModeChange,
  onRecipientChange,
  onAmountChange,
  onSubmit,
}: TransferFormProps) {
  const { t } = useTranslation();
  const { label } = RECOVERY_NETWORKS[network];
  const { symbol } = token;

  const handlePaste = async () => {
    try {
      const text = (await navigator.clipboard.readText()).trim();
      if (!isAddress(text)) {
        toast.warning(t("INVALID_ADDRESS_FORMAT"));
        return;
      }
      onRecipientChange(text);
      toast.success(t("ADDRESS_PASTED"));
    } catch {
      toast.error(t("FAILED_TO_READ_CLIPBOARD"));
    }
  };

  return (
    <form
      className="flex flex-col gap-4"
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        if (canSubmit) onSubmit();
      }}>
      <h2 className="font-medium text-lg">
        {t("RECOVERY_SEND_TOKEN", { symbol })}
      </h2>

      <div className="flex flex-col gap-2">
        <p className="text-muted-foreground text-sm">
          {t("RECOVERY_RECIPIENT_LABEL")}
        </p>
        {owner && (
          <Tabs
            value={recipientMode}
            onValueChange={(value) =>
              onRecipientModeChange(value === "owner" ? "owner" : "custom")
            }>
            <TabsList className="h-auto flex-wrap justify-start gap-2 bg-transparent p-0">
              <TabsTrigger
                value="custom"
                disabled={isSending}
                className={PILL_TAB}>
                {t("RECOVERY_RECIPIENT_CUSTOM")}
              </TabsTrigger>
              <TabsTrigger
                value="owner"
                disabled={isSending}
                className={PILL_TAB}>
                {t("RECOVERY_RECIPIENT_OWNER")}
              </TabsTrigger>
            </TabsList>
          </Tabs>
        )}
        {recipientMode === "owner" && owner ? (
          <div className="flex flex-col gap-1.5 rounded-lg bg-muted px-3 py-2">
            <code className="break-all font-mono text-sm">{owner}</code>
            <p className="text-muted-foreground text-xs leading-relaxed">
              {t("RECOVERY_RECIPIENT_OWNER_NOTE", { network: label })}
            </p>
          </div>
        ) : (
          <div className="relative w-full">
            <Input
              type="text"
              aria-label={t("RECOVERY_RECIPIENT_LABEL")}
              aria-invalid={errors.recipient !== null}
              className="h-12 pr-12 font-mono text-sm"
              placeholder="0x0000...0000"
              value={recipient}
              onChange={(e) => onRecipientChange(e.target.value)}
              autoComplete="off"
              autoCapitalize="off"
              spellCheck={false}
              disabled={isSending}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label={t("RECOVERY_PASTE_ADDRESS")}
              className="-translate-y-1/2 absolute top-1/2 right-1 size-9"
              onClick={handlePaste}
              disabled={isSending}>
              <Clipboard className="size-4 text-primary" />
            </Button>
          </div>
        )}
        {errors.recipient && (
          <p role="alert" className="text-destructive text-xs">
            {t(errors.recipient)}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between gap-2">
          <p className="min-w-0 truncate text-muted-foreground text-sm">
            {t("RECOVERY_AMOUNT_AVAILABLE", {
              amount: formatBalanceForDisplay(token.formatted),
              symbol,
            })}
          </p>
          <Button
            type="button"
            variant="outline"
            className="h-7 border-none bg-muted text-xs shadow-none"
            // Exact balance string, so Max never rounds above what is held
            onClick={() => onAmountChange(token.formatted)}
            disabled={isSending}>
            {t("MAX")}
          </Button>
        </div>
        <Input
          type="text"
          inputMode="decimal"
          aria-label={t("ENTER_AMOUNT")}
          aria-invalid={errors.amount !== null}
          className="h-12"
          placeholder="0.00"
          value={amount}
          onChange={(e) => onAmountChange(e.target.value.replace(",", "."))}
          autoComplete="off"
          disabled={isSending}
        />
        {errors.amount && (
          <p role="alert" className="text-destructive text-xs">
            {t(errors.amount)}
          </p>
        )}
        {isNativeToken(token) && (
          <p className="text-muted-foreground text-xs leading-relaxed">
            {t("RECOVERY_NATIVE_FEE_HINT", { symbol })}
          </p>
        )}
      </div>

      <p className="text-muted-foreground text-xs leading-relaxed">
        {t("RECOVERY_IRREVERSIBLE_NOTE", { symbol, network: label })}
      </p>

      <Button type="submit" className="h-12 w-full" disabled={!canSubmit}>
        {isSending ? (
          <>
            <Loader2 className="animate-spin" />
            {t("SENDING")}...
          </>
        ) : (
          t("RECOVERY_SEND_TOKEN", { symbol })
        )}
      </Button>
      <p
        aria-live="polite"
        className={cn(
          "text-center text-muted-foreground text-xs",
          !isSending && "hidden",
        )}>
        {t("RECOVERY_SENDING_NOTE")}
      </p>
    </form>
  );
}
