import { ExternalLink, Gift } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CURRENCY, type CurrencyType } from "@/lib/constants";

const LOTPOT_FALLBACK_URL = "https://lotpot.fun";
const LOTPOT_UTM_QUERY = "?utm_source=p2p-cashback";

/**
 * LotPot cashback rate (in percent) promised on BUY/SELL completion.
 * Defaults to 2%, with a per-currency fallback to 1% for markets where
 * the backend issues a reduced credit (currently Argentina and Mexico).
 * Keep this in sync with the server-side issuance logic — the credit is
 * issued server-side, so this is a display-only mirror of that rule.
 */
const DEFAULT_CASHBACK_PERCENT = 2;
const REDUCED_CASHBACK_PERCENT = 1;
const REDUCED_CASHBACK_CURRENCIES: CurrencyType[] = ["ARS", "MEX"];

export function getLotpotCashbackPercent(currency?: CurrencyType): number {
  if (currency && REDUCED_CASHBACK_CURRENCIES.includes(currency)) {
    return REDUCED_CASHBACK_PERCENT;
  }
  return DEFAULT_CASHBACK_PERCENT;
}

/**
 * "{percentage}% in LotPot cashback credit" card shown on the BUY/SELL
 * order completion screens. Pure presentational — no contract reads, no
 * hooks beyond i18n. The cashback is issued server-side (out of band of
 * any Diamond/Integrator hook), so the UI can promise the credit without
 * waiting for an on-chain signal that won't arrive.
 *
 * The displayed rate falls back per currency (see getLotpotCashbackPercent):
 * 2% by default, 1% for Argentina (ARS) and Mexico (MEX). Pass the order's
 * currency so the card mirrors what the backend actually credits.
 *
 * Renders for any caller except INR markets, where LotPot cashback is not
 * offered — there the card is hidden entirely. Other gating happens at the
 * call site (BUY/SELL completion only).
 */
export function LotpotCashbackCard({ currency }: { currency?: CurrencyType }) {
  const { t } = useTranslation();
  const percentage = getLotpotCashbackPercent(currency);

  // LotPot cashback is not available for INR — hide the card entirely.
  if (currency === CURRENCY.INR) {
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
