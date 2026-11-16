import { CheckCircle } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerFooter,
  DrawerTitle,
} from "@/components/ui/drawer";

interface AccessGrantedDrawerProps {
  open: boolean;
  onClose: () => void;
}

export function AccessGrantedDrawer({
  open,
  onClose,
}: AccessGrantedDrawerProps) {
  const { t } = useTranslation();

  return (
    <Drawer open={open} onOpenChange={(v) => !v && onClose()}>
      <DrawerTitle>{t("ACCESS_GRANTED_TITLE")}</DrawerTitle>
      <DrawerContent className="mx-auto rounded-2xl bg-background">
        <div className="flex h-full max-h-[80vh] flex-col overflow-y-auto px-6 py-8">
          <div className="flex flex-col items-center space-y-6 text-center">
            <div className="flex items-center justify-center rounded-full bg-primary/10 p-4">
              <span className="flex items-center justify-center rounded-full bg-primary p-4">
                <CheckCircle className="size-12 text-background" />
              </span>
            </div>
            <h2 className="font-regular text-2xl">
              {t("ACCESS_GRANTED_TITLE")}
            </h2>
            <div className="mt-2 w-full rounded-2xl bg-primary/5 p-4 shadow-sm">
              <div className="font-light text-foreground text-small">
                {t("ACCESS_GRANTED_READY_DESCRIPTION")}
              </div>
            </div>
          </div>
          <DrawerFooter className="mt-8 flex-shrink-0 px-0">
            <Button
              size="lg"
              className="w-full border border-primary text-primary hover:bg-primary/10"
              variant="outline"
              onClick={onClose}>
              {t("CLOSE")}
            </Button>
          </DrawerFooter>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
