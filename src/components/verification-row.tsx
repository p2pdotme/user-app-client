import { Check } from "lucide-react";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

/** Compact pill sizing shared by every action button inside a verification row. */
export const ROW_BTN = "h-9 w-auto shrink-0 rounded-full px-4";

/** "Verified" pill shown in place of the action once a method is complete. */
export function VerifiedButton() {
  const { t } = useTranslation();
  return (
    <Button
      className={`${ROW_BTN} bg-muted text-foreground hover:bg-muted`}
      onClick={() => toast.success(t("ALREADY_VERIFIED"))}>
      <Check className="size-3.5" />
      {t("VERIFIED")}
    </Button>
  );
}

interface VerificationRowProps {
  /** Leading icon, already sized by the caller. */
  icon: ReactNode;
  title: string;
  /** Per-transaction USDC the method unlocks once verified. */
  limit: number;
  /** Optional short description rendered under the unlock line. */
  description?: string;
  /** Trailing action slot (button, pill, retry…). */
  action: ReactNode;
}

/**
 * Presentational row used by every "increase limits" method: a bordered card
 * with an icon circle, the method name, the limit it unlocks and an action.
 * Mirrors the coins.me verification row; logic lives in the caller.
 */
export function VerificationRow({
  icon,
  title,
  limit,
  description,
  action,
}: VerificationRowProps) {
  const { t } = useTranslation();

  return (
    <div className="flex w-full items-center justify-between gap-3 rounded-2xl border border-border bg-card p-4">
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
          {icon}
        </div>
        <div className="flex min-w-0 flex-col">
          <p className="truncate font-bold text-foreground text-sm leading-[19px]">
            {title}
          </p>
          <p className="text-muted-foreground text-sm leading-[19px]">
            <span className="font-bold text-foreground">
              {t("VERIFY_ROW_UNLOCKS_AMOUNT", {
                amount: Math.floor(limit).toLocaleString(),
              })}
            </span>{" "}
            {t("VERIFY_ROW_USDC_FOR_ALL")}
          </p>
          {description && (
            <p className="text-muted-foreground text-xs leading-4">
              {description}
            </p>
          )}
        </div>
      </div>
      {action}
    </div>
  );
}
