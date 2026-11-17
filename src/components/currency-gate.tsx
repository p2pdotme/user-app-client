// no React import needed for jsx runtime

import { Check } from "lucide-react";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { useSettings } from "@/contexts/settings";
import type { Currency } from "@/core/client/settings";
import { useAnalytics, useThirdweb } from "@/hooks";
import { EVENTS } from "@/lib/analytics";
import { COUNTRY_OPTIONS, getCurrencyLabel } from "@/lib/constants";
import { cn } from "@/lib/utils";

/**
 * CurrencyGate
 *
 * A global, first-run gate that forces users to consciously select their currency
 * when no prior selection exists. It opens a modal drawer automatically and
 * cannot be dismissed until a currency is chosen.
 */
/**
 * Whether the (non-dismissable) CurrencyGate is currently showing. Other
 * first-run overlays (invite / campaign / gift drawers) wait for this to be
 * false so they never stack on top of the gate.
 */
export function useIsCurrencyGateOpen(): boolean {
  const { settings } = useSettings();
  const { connectionStatus, account } = useThirdweb();
  const isConnected = !!account?.address && connectionStatus === "connected";
  return isConnected && !settings.isCurrencyConfirmed;
}

export function CurrencyGate() {
  const { t } = useTranslation();
  const { settings, setCurrency, isLoading } = useSettings();
  const { track } = useAnalytics();

  const handleSelect = async (currency: Currency) => {
    track(EVENTS.SETTINGS, {
      status: "currency_gate_selected",
      currency: currency.currency,
    });
    await setCurrency(currency);
    // setCurrency will also mark isCurrencyConfirmed = true via SettingsProvider
  };

  // Keep the drawer open until user confirms
  const open = useIsCurrencyGateOpen();

  useEffect(() => {
    if (open) {
      track(EVENTS.SETTINGS, { status: "currency_gate_shown" });
    }
  }, [open, track]);

  return (
    <Drawer open={open} onOpenChange={() => {}}>
      <DrawerContent autoFocus>
        <DrawerHeader className="text-center">
          <DrawerTitle>{t("SELECT_CURRENCY")}</DrawerTitle>
          <DrawerDescription>
            {t("SELECT_CURRENCY_DESCRIPTION")}
          </DrawerDescription>
        </DrawerHeader>

        <div className="max-h-[60dvh] overflow-y-auto px-4 pb-4">
          <div className="flex flex-col gap-2">
            {COUNTRY_OPTIONS.map((currency) => (
              <Button
                key={currency.currency}
                variant="ghost"
                className={cn(
                  "h-16 shrink-0 justify-between p-4",
                  settings?.currency.currency === currency.currency &&
                    "bg-primary/10",
                )}
                onClick={() => handleSelect(currency as Currency)}
                disabled={isLoading}>
                <div className="flex items-center gap-4">
                  <div className="flex size-10 items-center justify-center rounded-full bg-primary/10 p-2">
                    <span className="font-semibold text-lg text-primary">
                      {currency.symbolNative}
                    </span>
                  </div>
                  <div className="flex flex-col items-start">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">
                        {getCurrencyLabel(currency.currency, currency.country)}
                      </span>
                      {currency.isAlpha && (
                        <span className="rounded-full bg-primary/10 px-2 py-0.5 font-medium text-primary text-xs">
                          Alpha
                        </span>
                      )}
                    </div>
                    <span className="text-muted-foreground text-sm">
                      {currency.flag ? `${currency.flag} • ` : ""}
                      {currency.country}
                    </span>
                  </div>
                </div>
                {settings?.currency.currency === currency.currency && (
                  <Check className="h-5 w-5 text-primary" />
                )}
              </Button>
            ))}
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
