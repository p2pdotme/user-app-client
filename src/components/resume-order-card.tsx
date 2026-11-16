import { ArrowRight, Loader2, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import { Button } from "@/components/ui/button";
import { useSettings } from "@/contexts/settings";
import { usePriceConfig } from "@/hooks/use-price-config";
import { useTxLimits } from "@/hooks/use-tx-limits";
import { analytics, EVENTS } from "@/lib/analytics";
import {
  clearLimitReturn,
  getLimitReturnTarget,
  type LimitReturn,
  readLimitReturn,
} from "@/lib/limit-increase";
import { cn, formatFiatAmount } from "@/lib/utils";

/**
 * Shown on /limits and the verification screens when the user came here from
 * an order (Buy/Sell/Pay "Verify to raise", fraud check). Shows their current
 * per-order limit live, says whether the order now fits, and takes them back
 * with the amount still filled in.
 */
export function ResumeOrderCard({ className }: { className?: string }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [entry, setEntry] = useState<LimitReturn | null>(() =>
    readLimitReturn(),
  );
  const { txLimit, isTxLimitLoading, isTxLimitFetching } = useTxLimits();
  const { priceConfig } = usePriceConfig();
  const {
    settings: { currency },
  } = useSettings();

  useEffect(() => {
    if (entry) {
      analytics.track(EVENTS.VERIFICATION, {
        status: "resume_order_shown",
        flow: entry.flow,
      });
    }
  }, [entry]);

  if (!entry) return null;

  const limit = entry.flow === "buy" ? txLimit?.buyLimit : txLimit?.sellLimit;
  // Pay amounts are entered in local currency; compare in USDC.
  const orderUsdc =
    entry.cryptoAmount ??
    (entry.fiatAmount && priceConfig?.sellPrice
      ? entry.fiatAmount / priceConfig.sellPrice
      : undefined);
  const fits =
    limit !== undefined && orderUsdc !== undefined ? orderUsdc <= limit : null;

  const flowLabel = t(
    entry.flow === "buy"
      ? "LIMR_FLOW_BUY"
      : entry.flow === "sell"
        ? "LIMR_FLOW_SELL"
        : "LIMR_FLOW_PAY",
  );
  const amountLabel = entry.cryptoAmount
    ? `${entry.cryptoAmount} USDC`
    : entry.fiatAmount
      ? formatFiatAmount(entry.fiatAmount, currency.currency)
      : null;

  const handleContinue = () => {
    const target = getLimitReturnTarget(entry);
    analytics.track(EVENTS.VERIFICATION, {
      status: "resume_order_clicked",
      flow: entry.flow,
      fits,
    });
    clearLimitReturn();
    navigate(target.to, { state: target.state });
  };

  const handleDismiss = () => {
    analytics.track(EVENTS.VERIFICATION, {
      status: "resume_order_dismissed",
      flow: entry.flow,
    });
    clearLimitReturn();
    setEntry(null);
  };

  return (
    <section
      className={cn(
        "relative flex w-full flex-col gap-3 rounded-2xl border border-primary/30 bg-primary/5 p-4",
        className,
      )}
      aria-live="polite">
      <button
        type="button"
        onClick={handleDismiss}
        aria-label={t("LIMR_DISMISS")}
        className="absolute top-3 right-3 text-muted-foreground">
        <X className="size-4" />
      </button>
      <div className="flex flex-col gap-1 pr-6">
        <p className="font-semibold text-sm">
          {amountLabel
            ? t("LIMR_TITLE_WITH_AMOUNT", {
                flow: flowLabel,
                amount: amountLabel,
              })
            : t("LIMR_TITLE", { flow: flowLabel })}
        </p>
        <p className="flex items-center gap-1.5 text-muted-foreground text-sm">
          {isTxLimitLoading || isTxLimitFetching ? (
            <>
              <Loader2 className="size-3.5 animate-spin" />
              {t("LIMR_UPDATING_LIMIT")}
            </>
          ) : limit !== undefined ? (
            t("LIMR_CURRENT_LIMIT", { limit: Math.floor(limit) })
          ) : null}
        </p>
        {fits !== null && !isTxLimitFetching && (
          <p
            className={cn(
              "text-sm",
              fits ? "text-success" : "text-muted-foreground",
            )}>
            {fits ? t("LIMR_ORDER_FITS") : t("LIMR_ORDER_STILL_ABOVE")}
          </p>
        )}
      </div>
      <Button onClick={handleContinue} className="w-full">
        {t("LIMR_CONTINUE", { flow: flowLabel })}
        <ArrowRight className="size-4" />
      </Button>
    </section>
  );
}
