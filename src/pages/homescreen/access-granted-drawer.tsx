import { CheckCircle, PlayCircle } from "lucide-react";
import { useTranslation } from "react-i18next";
import ASSETS from "@/assets";
import { BannerItem } from "@/components";
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
              <div className="relative my-4 flex w-full items-center justify-center overflow-hidden rounded-xl bg-muted">
                <BannerItem bgImage={ASSETS.IMAGES.HOME_GUIDE_BANNER_BG}>
                  <div className="flex h-full w-full items-center justify-center">
                    <div className="rounded-full bg-white/20 p-2 backdrop-blur-sm">
                      <PlayCircle className="h-10 w-10 text-white" />
                    </div>
                  </div>
                </BannerItem>
              </div>
              <div className="font-light text-foreground text-small">
                {t("ACCESS_GRANTED_DESCRIPTION")}
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
