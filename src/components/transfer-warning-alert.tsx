import { type CurrencyCode, getTransferWarning } from "@p2pdotme/sdk/country";
import { AlertTriangle } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { cn } from "@/lib/utils";

/** Renders nothing unless `getTransferWarning(currency)` returns an i18n key. */
export function TransferWarningAlert({
  currency,
  className,
  density = "default",
}: {
  currency: CurrencyCode | string | null | undefined;
  className?: string;
  /** `compact` for tight layouts (numpad / amount screens). Same copy and rules. */
  density?: "default" | "compact";
}) {
  const { t } = useTranslation();
  const warningKey = getTransferWarning(
    currency as CurrencyCode | null | undefined,
  );
  if (!warningKey) return null;

  const compact = density === "compact";

  return (
    <Alert
      variant="warning"
      className={cn(
        "w-full",
        compact && "gap-y-0 px-3 py-2 [&>svg]:size-3.5 [&>svg]:translate-y-0",
        className,
      )}>
      <AlertTriangle className={compact ? "size-3.5" : "size-4"} />
      <AlertDescription
        className={cn("text-xs", compact && "[&_p]:leading-snug")}>
        <p className="text-foreground">{t(warningKey)}</p>
      </AlertDescription>
    </Alert>
  );
}
