import { CURRENCY } from "@p2pdotme/sdk/country";
import {
  AlertTriangle,
  ChevronRight,
  Code,
  DollarSign,
  Globe,
  Loader2,
  Palette,
  RotateCcw,
  Vibrate,
  Volume2,
  VolumeX,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { NonHomeHeader } from "@/components";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { useSettings } from "@/contexts";
import type { SettingsError } from "@/core/client/settings";
import { useAnalytics, useHaptics, useSounds } from "@/hooks";
import { EVENTS } from "@/lib/analytics";
import { cn } from "@/lib/utils";
import { CurrencyDrawer } from "./currency-drawer";
import { DevModeDrawer } from "./dev-mode-drawer";
import { HapticsDrawer } from "./haptics-drawer";
import { LanguageDrawer } from "./language-drawer";
import { ResetConfirmationDrawer } from "./reset-confirmation-drawer";
import { ThemeDrawer } from "./theme-drawer";

export function Settings() {
  const { t } = useTranslation();
  const { settings, isLoading, setSounds } = useSettings();
  const { supportInfo } = useHaptics();
  const sounds = useSounds();
  const { track } = useAnalytics();

  // Handle sounds toggle
  const handleSoundsToggle = async () => {
    try {
      const newSoundsValue = !settings.sounds;
      await setSounds(newSoundsValue);

      // Track settings change
      track(EVENTS.SETTINGS, {
        status: "changed",
        setting: "sounds",
        value: newSoundsValue ? "enabled" : "disabled",
      });

      // Provide audio feedback when successfully toggling sounds
      if (newSoundsValue) {
        // If we just enabled sounds, play success sound
        sounds.triggerSuccessSound(); // Using generic success sound
      }
    } catch (error) {
      const settingsError = error as SettingsError;
      toast.error(t(settingsError.code), {
        description: t(settingsError.message),
      });
    }
  };

  const settingsItems = [
    {
      key: "currency",
      title: t("CURRENCY"),
      icon: DollarSign,
      value:
        settings.currency.currency === CURRENCY.USD ||
        settings.currency.currency === CURRENCY.EUR
          ? `${settings.currency.country}`
          : settings.currency.currency,
      component: CurrencyDrawer,
    },
    {
      key: "language",
      title: t("LANGUAGE"),
      icon: Globe,
      value: settings.language.nameNative,
      component: LanguageDrawer,
    },
    {
      key: "theme",
      title: t("THEME"),
      icon: Palette,
      value: t(`THEME_${settings.theme.toUpperCase()}`),
      component: ThemeDrawer,
    },
    {
      key: "haptics",
      title: t("HAPTICS"),
      icon: Vibrate,
      value: t(`HAPTICS_${settings.haptics.toUpperCase()}`),
      component: HapticsDrawer,
      warning: !supportInfo.isAPIAvailable,
    },
    // Add dev mode setting only when dev mode is enabled
    ...(settings.devMode
      ? [
          {
            key: "devMode",
            title: "Developer Mode",
            icon: Code,
            value: "Enabled",
            component: DevModeDrawer,
          },
        ]
      : []),
  ];

  return (
    <>
      <NonHomeHeader title={t("SETTINGS")} showHelp={false} />
      <main className="no-scrollbar container-narrow flex h-full w-full flex-col gap-6 overflow-y-auto py-8">
        {/* Settings List */}
        <div className="flex w-full flex-col gap-2">
          {settingsItems.map(
            ({
              key,
              title,
              icon: Icon,
              value,
              component: DrawerComponent,
              warning,
            }) => (
              <DrawerComponent key={key}>
                <div className="m-0 h-full w-full p-0">
                  <Button
                    variant="ghost"
                    className={cn(
                      "h-auto w-full justify-between p-0 py-4 hover:bg-transparent",
                      isLoading && "opacity-50",
                    )}
                    disabled={isLoading}
                    onClick={() => {
                      track(EVENTS.SETTINGS, {
                        status: "changed",
                        setting: key,
                        value: value,
                      });
                    }}>
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        <Icon className="size-5 text-foreground" />
                        {warning && (
                          <AlertTriangle className="-top-1 -right-1 absolute h-3 w-3 text-amber-500" />
                        )}
                      </div>
                      <div className="flex flex-col items-start">
                        <span className="font-medium">{title}</span>
                        {warning && (
                          <span className="text-amber-600 text-xs dark:text-amber-400">
                            {t("NOT_SUPPORTED")}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <p
                        className={cn(
                          "text-sm capitalize",
                          warning
                            ? "text-amber-600 dark:text-amber-400"
                            : "text-primary",
                        )}>
                        {value}
                      </p>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </Button>
                  <Separator />
                </div>
              </DrawerComponent>
            ),
          )}

          {/* Sounds Toggle */}
          <div className="m-0 h-full w-full p-0">
            <div className="flex items-center justify-between py-4">
              <div className="flex items-center gap-4">
                <div className="relative">
                  {settings.sounds ? (
                    <Volume2 className="size-5 text-foreground" />
                  ) : (
                    <VolumeX className="size-5 text-foreground" />
                  )}
                  {!sounds.supportInfo.isAPIAvailable && (
                    <AlertTriangle className="-top-1 -right-1 absolute h-3 w-3 text-amber-500" />
                  )}
                </div>
                <div className="flex flex-col items-start">
                  <span className="font-medium">{t("SOUNDS")}</span>
                  {!sounds.supportInfo.isAPIAvailable && (
                    <span className="text-amber-600 text-xs dark:text-amber-400">
                      {t("NOT_SUPPORTED")}
                    </span>
                  )}
                </div>
              </div>
              <Switch
                checked={settings.sounds}
                onCheckedChange={handleSoundsToggle}
                disabled={isLoading}
                className={cn(
                  "mr-3 scale-150",
                  !sounds.supportInfo.isAPIAvailable && "opacity-50",
                )}
              />
            </div>
            <Separator />
          </div>

          {/* Reset to defaults */}
          <ResetConfirmationDrawer>
            <div className="m-0 h-full w-full p-0">
              <Button
                variant="ghost"
                className={cn(
                  "h-auto w-full cursor-pointer justify-between p-0 py-4 hover:bg-transparent",
                  isLoading && "opacity-50",
                )}
                disabled={isLoading}>
                <div className="flex items-center gap-4">
                  <RotateCcw className="size-5 text-foreground" />
                  <div className="flex flex-col items-start">
                    <span className="font-medium">
                      {t("RESET_TO_DEFAULTS")}
                    </span>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </Button>
              <Separator />
            </div>
          </ResetConfirmationDrawer>
        </div>

        {/* Loading State */}
        {isLoading ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/50">
            <div className="flex items-center gap-3 rounded-lg bg-card p-6 shadow-lg">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span className="font-medium text-sm">
                {t("UPDATING_SETTINGS")}
              </span>
            </div>
          </div>
        ) : null}
      </main>
    </>
  );
}
