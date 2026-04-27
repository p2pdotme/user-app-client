import {
  AlertTriangle,
  Check,
  Info,
  Smartphone,
  Vibrate,
  VibrateOff,
} from "lucide-react";
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
import type { Settings, SettingsError } from "@/core/client/settings";
import { type HapticSupportInfo, useHaptics } from "@/hooks/use-haptics";
import { cn } from "@/lib/utils";

interface HapticsDrawerProps {
  children: React.ReactNode;
}

const HAPTICS_OPTIONS: Array<{
  value: Settings["haptics"];
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  {
    value: "all",
    label: "HAPTICS_ALL",
    description: "HAPTICS_ALL_DESC",
    icon: Vibrate,
  },
  {
    value: "essential",
    label: "HAPTICS_ESSENTIAL",
    description: "HAPTICS_ESSENTIAL_DESC",
    icon: Smartphone,
  },
  {
    value: "none",
    label: "HAPTICS_NONE",
    description: "HAPTICS_NONE_DESC",
    icon: VibrateOff,
  },
];

function HapticSupportAlert({
  supportInfo,
}: {
  supportInfo: HapticSupportInfo;
}) {
  const { t } = useTranslation();

  if (supportInfo.isAPIAvailable && supportInfo.willTrigger) {
    return (
      <div className="mb-4 space-y-1 rounded-lg border border-success bg-success/10 p-3 dark:border-success/20 dark:bg-success/20">
        <div className="flex items-center gap-2">
          <Info className="h-4 w-4 text-success dark:text-success" />
          <span className="font-medium text-sm text-success dark:text-success">
            {t("HAPTIC_FEEDBACK_AVAILABLE_AND_ENABLED")}
          </span>
        </div>
        <div className="space-y-1">
          {supportInfo.reasons.map((reason: string, index: number) => (
            <p key={index} className="text-muted-foreground text-xs">
              • {reason}
            </p>
          ))}
        </div>
      </div>
    );
  }

  if (!supportInfo.isAPIAvailable) {
    return (
      <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-800 dark:bg-amber-950">
        <div className="mb-2 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          <span className="font-medium text-amber-800 text-sm dark:text-amber-200">
            {t("HAPTIC_FEEDBACK_NOT_SUPPORTED")}
          </span>
        </div>
        <div className="space-y-1">
          {supportInfo.reasons.map((reason: string, index: number) => (
            <p key={index} className="text-muted-foreground text-xs">
              • {reason}
            </p>
          ))}
        </div>
      </div>
    );
  }

  if (supportInfo.isDisabledByUser) {
    return (
      <div className="mb-4 rounded-lg border border-blue-200 bg-blue-50 p-3 dark:border-blue-800 dark:bg-blue-950">
        <div className="flex items-center gap-2">
          <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          <span className="font-medium text-blue-800 text-sm dark:text-blue-200">
            {t("HAPTIC_FEEDBACK_DISABLED_IN_SETTINGS")}
          </span>
        </div>
      </div>
    );
  }

  return null;
}

export function HapticsDrawer({ children }: HapticsDrawerProps) {
  const { t } = useTranslation();
  const { settings, setHaptics, isLoading } = useSettings();
  const { supportInfo } = useHaptics();
  const [isOpen, setIsOpen] = useState(false);

  const handleHapticsSelect = async (haptics: Settings["haptics"]) => {
    try {
      await setHaptics(haptics);
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
          <DrawerTitle>{t("SELECT_HAPTICS")}</DrawerTitle>
          <DrawerDescription>
            {t("SELECT_HAPTICS_DESCRIPTION")}
          </DrawerDescription>
        </DrawerHeader>

        <div className="p-4">
          {/* Support Information */}
          <HapticSupportAlert supportInfo={supportInfo} />

          {/* Haptics Options */}
          <div className="flex flex-col gap-2">
            {HAPTICS_OPTIONS.map((haptic) => {
              const IconComponent = haptic.icon;
              const isDisabled =
                !supportInfo.isAPIAvailable && haptic.value !== "none";

              return (
                <Button
                  key={haptic.value}
                  variant="ghost"
                  className={cn(
                    "h-16 justify-between p-4",
                    settings?.haptics === haptic.value && "bg-primary/10",
                    isDisabled && "cursor-not-allowed opacity-50",
                  )}
                  onClick={() => handleHapticsSelect(haptic.value)}
                  disabled={isLoading || isDisabled}>
                  <div className="flex items-center gap-4">
                    <div className="flex size-10 items-center justify-center rounded-full bg-primary/10 p-2">
                      <IconComponent className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex flex-col items-start">
                      <span className="font-medium">
                        {t(`HAPTICS_${haptic.value.toUpperCase()}`)}
                      </span>
                      <span className="text-muted-foreground text-sm">
                        {t(`HAPTICS_${haptic.value.toUpperCase()}_DESC`)}
                      </span>
                    </div>
                  </div>
                  {settings?.haptics === haptic.value && (
                    <Check className="h-5 w-5 text-primary" />
                  )}
                </Button>
              );
            })}
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
