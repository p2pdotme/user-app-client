// no React import needed for jsx runtime

import { Check } from "lucide-react";
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
import { useThirdweb } from "@/hooks";
import { COUNTRY_OPTIONS } from "@/lib/constants";
import { cn } from "@/lib/utils";

/**
 * CurrencyGate
 *
 * A global, first-run gate that forces users to consciously select their currency
 * when no prior selection exists. It opens a modal drawer automatically and
 * cannot be dismissed until a currency is chosen.
 */
export function CurrencyGate() {
  const { t } = useTranslation();
  const { settings, setCurrency, isLoading } = useSettings();
  const { connectionStatus, account } = useThirdweb();

  const isConfirmed = settings.isCurrencyConfirmed;
  const isConnected = !!account?.address && connectionStatus === "connected";

  const handleSelect = async (currency: Currency) => {
    await setCurrency(currency);
    // setCurrency will also mark isCurrencyConfirmed = true via SettingsProvider
  };

  // Keep the drawer open until user confirms
  const open = isConnected && !isConfirmed;

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
                      <span className="font-medium">{currency.currency}</span>
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
