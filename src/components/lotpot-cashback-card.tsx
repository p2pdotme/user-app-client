import { ExternalLink, Gift } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { CurrencyType } from "@/lib/constants";

const LOTPOT_FALLBACK_URL = "https://lotpot.fun";
const LOTPOT_UTM_QUERY = "?utm_source=p2p-cashback";

/**
 * LotPot cashback rate (in percent) promised on BUY/SELL completion.
 * Defaults to 2%, with per-currency overrides for markets where the
 * backend issues a reduced credit (Argentina and Mexico at 1%) or none
 * at all (India, Venezuela and Bolivia at 0%). Keep this in sync with the
 * server-side issuance logic — the credit is issued server-side, so this
 * is a display-only mirror of that rule.
 */
const DEFAULT_CASHBACK_PERCENT = 2;
const CASHBACK_PERCENT_BY_CURRENCY: Partial<Record<CurrencyType, number>> = {
  ARS: 1,
  MEX: 1,
  INR: 0,
  VEN: 0,
  BOB: 0,
};

export function getLotpotCashbackPercent(currency?: CurrencyType): number {
  if (!currency) {
    return DEFAULT_CASHBACK_PERCENT;
  }
  return CASHBACK_PERCENT_BY_CURRENCY[currency] ?? DEFAULT_CASHBACK_PERCENT;
}

/**
 * "{percentage}% in LotPot cashback credit" card shown on the BUY/SELL
 * order completion screens. Pure presentational — no contract reads, no
 * hooks beyond i18n. The cashback is issued server-side (out of band of
 * any Diamond/Integrator hook), so the UI can promise the credit without
 * waiting for an on-chain signal that won't arrive.
 *
 * The displayed rate is per currency (see getLotpotCashbackPercent): 2% by
 * default, 1% for Argentina (ARS) and Mexico (MEX), 0% for India (INR),
 * Venezuela (VEN) and Bolivia (BOB). Pass the order's currency so the card mirrors what the
 * backend actually credits.
 *
 * Markets on a 0% rate get no cashback, so the card is hidden entirely there.
 * Other gating happens at the call site (BUY/SELL completion only).
 */
export function LotpotCashbackCard({ currency }: { currency?: CurrencyType }) {
  const { t } = useTranslation();
  const percentage = getLotpotCashbackPercent(currency);

  // No cashback issued for this market — hide the card entirely.
  if (percentage <= 0) {
    return null;
  }

  const handleOpenLotpot = () => {
    const base = import.meta.env.VITE_LOTPOT_URL ?? LOTPOT_FALLBACK_URL;
    window.open(`${base}${LOTPOT_UTM_QUERY}`, "_blank", "noopener,noreferrer");
  };

  return (
    <Card className="w-full shadow-none">
      <CardContent className="pt-1">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-1 flex-col gap-3">
            <div className="flex items-center gap-3">
              <Gift className="size-5 text-primary" />
              <p className="font-semibold text-primary text-xs uppercase tracking-[0.3em]">
                {t("LOTPOT_CASHBACK_TITLE")}
              </p>
            </div>
            <p className="text-muted-foreground text-sm leading-relaxed">
              {t("LOTPOT_CASHBACK_DESCRIPTION", {
                percentage: String(percentage),
              })}
            </p>
          </div>
          <div className="flex flex-col items-start gap-4 sm:items-end">
            <Button
              variant="default"
              size="lg"
              className="gap-2 rounded-full px-6"
              onClick={handleOpenLotpot}>
              <ExternalLink className="size-4" />
              {t("OPEN_LOTPOT")}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
