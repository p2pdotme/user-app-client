import { AlertTriangle, Code } from "lucide-react";
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

interface DevModeDrawerProps {
  children: React.ReactNode;
}

export function DevModeDrawer({ children }: DevModeDrawerProps) {
  const { t } = useTranslation();
  const { setDevMode, isLoading } = useSettings();
  const [isOpen, setIsOpen] = useState(false);

  const handleDisableDevMode = async () => {
    try {
      await setDevMode(false);
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
            <Code className="h-5 w-5" />
            Developer Mode
          </DrawerTitle>
          <DrawerDescription>
            Manage developer features and debugging tools
          </DrawerDescription>
        </DrawerHeader>

        <div className="space-y-4 p-4">
          {/* Current Status */}
          <div className="rounded-lg bg-primary/10 p-4">
            <div className="mb-2 flex items-center gap-2">
              <Code className="h-4 w-4 text-primary" />
              <span className="font-medium text-sm">Status: Active</span>
            </div>
            <p className="text-muted-foreground text-xs">
              Developer mode is currently enabled. You have access to dev routes
              and debugging features.
            </p>
          </div>

          {/* Warning */}
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-800 dark:bg-amber-950">
            <div className="mb-1 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              <span className="font-medium text-amber-800 text-sm dark:text-amber-200">
                Development Features
              </span>
            </div>
            <p className="text-amber-700 text-xs dark:text-amber-300">
              These features enable only debugging of various UI/UX features and
              nothing more. It may affect app performance. So, disable it if
              you&apos;ve nothing to debug.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <DrawerFooter>
          <Button
            variant="destructive"
            className="w-full p-6"
            onClick={handleDisableDevMode}
            disabled={isLoading}>
            Disable Developer Mode
          </Button>
          <Button
            variant="outline"
            className="w-full p-6"
            onClick={() => setIsOpen(false)}
            disabled={isLoading}>
            Cancel
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
