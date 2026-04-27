import type React from "react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { useSettings } from "@/contexts";
import type { SettingsError } from "@/core/client/settings";
import { useHapticInteractions } from "@/hooks";

interface ResetConfirmationDrawerProps {
  children: React.ReactNode;
}

export function ResetConfirmationDrawer({
  children,
}: ResetConfirmationDrawerProps) {
  const { t } = useTranslation();
  const { reset, isLoading } = useSettings();
  const { onSettingSaved, onSettingError } = useHapticInteractions();
  const [isOpen, setIsOpen] = useState(false);

  const handleReset = async () => {
    try {
      await reset();
      onSettingSaved(); // Haptic feedback for successful reset
      setIsOpen(false);
      toast.success(t("SETTINGS_RESET_SUCCESS"));
    } catch (error) {
      onSettingError(); // Haptic feedback for reset error
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
            {t("RESET_SETTINGS")}
          </DrawerTitle>
          <DrawerDescription>
            {t("RESET_SETTINGS_DESCRIPTION")}
          </DrawerDescription>
        </DrawerHeader>

        {/* Action Buttons */}
        <DrawerFooter>
          <Button
            variant="destructive"
            hapticType="warning" // Warning haptic for destructive action
            className="w-full p-6"
            onClick={handleReset}
            disabled={isLoading}>
            {t("RESET_NOW")}
          </Button>
          <Button
            variant="outline"
            className="w-full p-6"
            onClick={() => setIsOpen(false)}
            disabled={isLoading}>
            {t("CANCEL")}
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
