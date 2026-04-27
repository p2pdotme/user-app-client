import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import ASSETS from "@/assets";
import { Button } from "@/components/ui/button";
import { useSettings } from "@/contexts";
import { useAnalytics } from "@/hooks";
import { EVENTS } from "@/lib/analytics";
import { INTERNAL_HREFS, PAY_DISABLED_CURRENCIES } from "@/lib/constants";

export function Footer() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { track } = useAnalytics();
  const {
    settings: { currency },
  } = useSettings();

  const isPayEnabled = !PAY_DISABLED_CURRENCIES.includes(
    currency.currency as (typeof PAY_DISABLED_CURRENCIES)[number],
  );

  return (
    <footer className="sticky bottom-0 z-50 flex w-full items-center justify-center rounded-t-xl bg-background p-4 shadow-[0_0_12px_var(--primary-shadow)]">
      <div className="flex w-full max-w-xl items-center justify-between gap-2">
        <Button
          onClick={() => {
            track(EVENTS.NAVIGATION, {
              status: "nav_clicked",
              location: "footer",
              action: "buy",
            });
            navigate(INTERNAL_HREFS.BUY);
          }}
          className="z-50 rounded-lg p-5">
          <ASSETS.ICONS.Buy className="size-4 text-primary-foreground" />
          <p className="text-md text-primary-foreground">{t("BUY_USDC")}</p>
        </Button>

        <div className="-top-9.5 -translate-x-1/2 absolute right-1/2 left-1/2 z-40 size-21 rounded-full bg-muted" />
        <div className="-top-8 absolute right-0 left-0 z-40">
          <div className="flex flex-col items-center gap-2">
            <Button
              onClick={() => {
                if (!isPayEnabled) return;
                track(EVENTS.NAVIGATION, {
                  status: "nav_clicked",
                  location: "footer",
                  action: "pay",
                });
                navigate(INTERNAL_HREFS.PAY);
              }}
              disabled={!isPayEnabled}
              className="size-18 rounded-full bg-background text-primary shadow-[0_0_32px_var(--primary-shadow)]"
              variant="ghost">
              <ASSETS.ICONS.Pay className="size-10 text-primary" />
            </Button>
            <p className="font-medium text-muted-foreground text-xs">
              {t("SCAN_PAY")}
            </p>
          </div>
        </div>

        <Button
          onClick={() => {
            track(EVENTS.NAVIGATION, {
              status: "nav_clicked",
              location: "footer",
              action: "sell",
            });
            navigate(INTERNAL_HREFS.SELL);
          }}
          variant="secondary"
          className="z-50 rounded-lg p-5">
          <ASSETS.ICONS.Sell className="size-4 text-background" />
          <p className="text-md">{t("SELL_USDC")}</p>
        </Button>
      </div>
    </footer>
  );
}
