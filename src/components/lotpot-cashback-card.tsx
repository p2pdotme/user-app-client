import { ExternalLink, Gift } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const LOTPOT_FALLBACK_URL = "https://lotpot.fun";
const LOTPOT_UTM_QUERY = "?utm_source=p2p-cashback";

/**
 * Hardcoded "2% in LotPot cashback credit" card shown on the BUY-order
 * completion screen. Pure presentational — no contract reads, no hooks
 * beyond i18n. The cashback is issued server-side (out of band of any
 * Diamond/Integrator hook), so the UI can promise the credit without
 * waiting for an on-chain signal that won't arrive.
 *
 * Renders unconditionally for any caller — the gating happens at the
 * call site (BUY completion only).
 */
export function LotpotCashbackCard() {
  const { t } = useTranslation();

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
              {t("LOTPOT_CASHBACK_DESCRIPTION", { percentage: "2" })}
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
