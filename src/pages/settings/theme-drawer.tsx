import { Check, Moon, Palette, Sun, SunMoon } from "lucide-react";
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
import {
  AVAILABLE_THEMES,
  type SettingsError,
  type Theme,
} from "@/core/client/settings";
import { useAnalytics, useHapticInteractions } from "@/hooks";
import { EVENTS } from "@/lib/analytics";
import { cn } from "@/lib/utils";

interface ThemeDrawerProps {
  children: React.ReactNode;
}

// Theme configuration - easily extensible
const THEME_CONFIG: Record<
  Theme,
  {
    label: string;
    description: string;
    icon: React.ComponentType<{ className?: string }>;
  }
> = {
  light: {
    label: "Light",
    description: "THEME_LIGHT_DESC",
    icon: Sun,
  },
  dark: {
    label: "Dark",
    description: "THEME_DARK_DESC",
    icon: Moon,
  },
  system: {
    label: "System",
    description: "THEME_SYSTEM_DESC",
    icon: SunMoon,
  },
};

export function ThemeDrawer({ children }: ThemeDrawerProps) {
  const { t } = useTranslation();
  const { track } = useAnalytics();
  const { settings, setTheme, isLoading } = useSettings();
  const { onSettingChange, onSettingSaved, onSettingError } =
    useHapticInteractions();
  const [isOpen, setIsOpen] = useState(false);

  const handleThemeSelect = async (theme: Theme) => {
    try {
      onSettingChange(); // Haptic feedback for theme change attempt
      track(EVENTS.SETTINGS, {
        status: "drawer_interaction",
        drawerType: "theme",
        action: "select",
        previousValue: settings.theme,
        newValue: theme,
      });
      await setTheme(theme);
      onSettingSaved(); // Haptic feedback for successful save
      setIsOpen(false);
    } catch (error) {
      onSettingError(); // Haptic feedback for setting error
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
            drawerType: "theme",
            action: "open",
          });
        }
      }}>
      <DrawerTrigger asChild>{children}</DrawerTrigger>
      <DrawerContent autoFocus className="max-h-[80vh]">
        <DrawerHeader className="text-center">
          <DrawerTitle>{t("SELECT_THEME")}</DrawerTitle>
          <DrawerDescription>{t("SELECT_THEME_DESCRIPTION")}</DrawerDescription>
        </DrawerHeader>

        <div className="flex flex-col gap-2 p-4">
          {AVAILABLE_THEMES.map((themeValue) => {
            const theme = THEME_CONFIG[themeValue] || {
              label: themeValue,
              description: `Use ${themeValue} theme`,
              icon: Palette,
            };
            const IconComponent = theme.icon;

            return (
              <Button
                key={themeValue}
                variant="ghost"
                className={cn(
                  "h-16 justify-between p-4",
                  settings?.theme === themeValue && "bg-primary/10",
                )}
                onClick={() => handleThemeSelect(themeValue)}
                disabled={isLoading}>
                <div className="flex items-center gap-4">
                  <div className="flex size-10 items-center justify-center rounded-full bg-primary/10 p-2">
                    <IconComponent className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex flex-col items-start">
                    <span className="font-medium">
                      {t(`THEME_${themeValue.toUpperCase()}`)}
                    </span>
                    <span className="text-muted-foreground text-sm">
                      {t(`THEME_${themeValue.toUpperCase()}_DESC`)}
                    </span>
                  </div>
                </div>
                {settings?.theme === themeValue && (
                  <Check className="h-5 w-5 text-primary" />
                )}
              </Button>
            );
          })}
        </div>
      </DrawerContent>
    </Drawer>
  );
}
