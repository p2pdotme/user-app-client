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
import type { Language, SettingsError } from "@/core/client/settings";
import { useAnalytics } from "@/hooks";
import { EVENTS } from "@/lib/analytics";
import { LANGUAGE_OPTIONS } from "@/lib/constants";
import { cn } from "@/lib/utils";

interface LanguageDrawerProps {
  children: React.ReactNode;
}

export function LanguageDrawer({ children }: LanguageDrawerProps) {
  const { t, i18n } = useTranslation();
  const { track } = useAnalytics();
  const { settings, setLanguage, isLoading } = useSettings();
  const [isOpen, setIsOpen] = useState(false);

  const handleLanguageSelect = async (language: Language) => {
    try {
      track(EVENTS.SETTINGS, {
        status: "drawer_interaction",
        drawerType: "language",
        action: "select",
        previousValue: settings.language.code,
        newValue: language.code,
      });
      await setLanguage(language);
      // Note: setLanguage already syncs i18n and moment locale via the settings context
      // but we call these explicitly to ensure immediate UI update
      await i18n.changeLanguage(language.code);
      await i18n.reloadResources(language.code, "translation");
      setIsOpen(false);
    } catch (error) {
      const settingsError = error as SettingsError;
      toast.error(t(settingsError.code), {
        description: t(settingsError.message),
      });
    }
  };

  return (
    <Drawer open={isOpen} onOpenChange={setIsOpen}>
      <DrawerTrigger asChild>{children}</DrawerTrigger>
      <DrawerContent autoFocus className="max-h-[80vh]">
        <DrawerHeader className="text-center">
          <DrawerTitle className="flex items-center justify-center gap-2">
            {t("SELECT_LANGUAGE")}
          </DrawerTitle>
          <DrawerDescription>
            {t("SELECT_LANGUAGE_DESCRIPTION")}
          </DrawerDescription>
        </DrawerHeader>

        <div className="flex flex-col gap-2 p-4">
          {LANGUAGE_OPTIONS.map((language) => (
            <Button
              key={language.code}
              variant="ghost"
              className={cn(
                "h-16 justify-between p-4",
                settings?.language.code === language.code && "bg-primary/10",
              )}
              onClick={() => handleLanguageSelect(language)}
              disabled={isLoading}>
              <div className="flex items-center gap-4">
                <div className="flex size-10 items-center justify-center rounded-full bg-primary/10 p-2">
                  <span className="font-semibold text-lg text-primary">
                    {language.code.toUpperCase()}
                  </span>
                </div>
                <div className="flex flex-col items-start">
                  <span className="font-medium">{language.nameNative}</span>
                  <span className="text-muted-foreground text-sm">
                    {language.name} • {language.locale}
                  </span>
                </div>
              </div>
              {settings?.language.code === language.code && (
                <Check className="h-5 w-5 text-primary" />
              )}
            </Button>
          ))}
        </div>
      </DrawerContent>
    </Drawer>
  );
}
