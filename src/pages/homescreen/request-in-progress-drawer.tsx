import { Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Drawer, DrawerContent, DrawerTitle } from "@/components/ui/drawer";

interface RequestInProgressDrawerProps {
  open: boolean;
  onClose: () => void;
}

export function RequestInProgressDrawer({
  open,
  onClose,
}: RequestInProgressDrawerProps) {
  const { t } = useTranslation();

  return (
    <Drawer open={open} onOpenChange={(v) => !v && onClose()}>
      <DrawerTitle>{t("REQUEST_IN_PROGRESS")}</DrawerTitle>
      <DrawerContent className="mx-auto rounded-2xl bg-background">
        <div className="flex h-full max-h-[80vh] flex-col overflow-y-auto px-6 py-8">
          <div className="flex flex-col items-center space-y-4 text-center">
            {/* Loader Animation */}
            <Loader2 className="size-36 animate-spin stroke-[3] text-primary" />
            <h2 className="mt-2 font-regular text-2xl">
              {t("REQUEST_IN_PROGRESS")}
            </h2>
            <p className="text-muted-foreground">
              {t("YOU_VE_RECEIVED_A_SPECIAL_INVITE")}
            </p>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
