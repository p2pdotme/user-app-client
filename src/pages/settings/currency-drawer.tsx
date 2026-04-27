import { Check } from "lucide-react";
import type React from "react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { useSettings } from "@/contexts";
import type { Currency, SettingsError } from "@/core/client/settings";
import { useAnalytics } from "@/hooks";
import { EVENTS } from "@/lib/analytics";
import { COUNTRY_OPTIONS, CURRENCY } from "@/lib/constants";
import { cn } from "@/lib/utils";

interface CurrencyDrawerProps {
  children: React.ReactNode;
}

export function CurrencyDrawer({ children }: CurrencyDrawerProps) {
  const { t } = useTranslation();
  const { track } = useAnalytics();
  const { settings, setCurrency, isLoading } = useSettings();
  const [isOpen, setIsOpen] = useState(false);

  const handleCurrencySelect = async (
    currency: (typeof COUNTRY_OPTIONS)[number],
  ) => {
    try {
      track(EVENTS.SETTINGS, {
        status: "drawer_interaction",
        drawerType: "currency",
        action: "select",
        previousValue: settings.currency.currency,
        newValue: currency.currency,
      });
      await setCurrency(currency as unknown as Currency);
      setIsOpen(false);
    } catch (error) {
      const settingsError = error as SettingsError;
      toast.error(t(settingsError.code), {
        description: t(settingsError.message),
      });
    }
  };

  return (
    <Drawer
      open={isOpen}
      onOpenChange={(open) => {
        setIsOpen(open);
        if (open) {
          track(EVENTS.SETTINGS, {
            status: "drawer_interaction",
            drawerType: "currency",
            action: "open",
          });
        }
      }}>
      <DrawerTrigger asChild>{children}</DrawerTrigger>
      <DrawerContent autoFocus>
        <DrawerHeader className="text-center">
          <DrawerTitle>{t("SELECT_CURRENCY")}</DrawerTitle>
          <DrawerDescription>
            {t("SELECT_CURRENCY_DESCRIPTION")}
          </DrawerDescription>
        </DrawerHeader>

        <div className="max-h-[60dvh] overflow-y-auto p-4">
          <div className="flex flex-col gap-2">
            {COUNTRY_OPTIONS.map((currency) => (
              <Button
                key={currency.currency}
                variant="ghost"
                className={cn(
                  "h-16 justify-between p-4",
                  settings?.currency.currency === currency.currency &&
                    "bg-primary/10",
                )}
                onClick={() => handleCurrencySelect(currency)}
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
                        {currency.currency === CURRENCY.USD ||
                        currency.currency === CURRENCY.EUR
                          ? `${currency.country}`
                          : currency.currency}
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
