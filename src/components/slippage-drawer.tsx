import { TrendingUp } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";

interface SlippageDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}

export function SlippageDrawer({
  open,
  onOpenChange,
  onConfirm,
}: SlippageDrawerProps) {
  const { t } = useTranslation();

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="pb-[env(safe-area-inset-bottom)]">
        <div className="flex flex-col items-center px-6 pt-10 pb-2">
          <div className="relative flex size-24 items-center justify-center">
            <span
              className="absolute inset-0 animate-ping rounded-full bg-yellow-500/20"
              style={{ animationDuration: "2s" }}
            />
            <span
              className="absolute inset-2 animate-ping rounded-full bg-yellow-500/25"
              style={{ animationDuration: "2s", animationDelay: "0.4s" }}
            />
            <div className="relative flex size-20 items-center justify-center rounded-full bg-gradient-to-br from-yellow-500/20 to-yellow-500/5 ring-1 ring-yellow-500/30">
              <TrendingUp className="size-9 text-yellow-500" />
            </div>
          </div>
        </div>

        <DrawerHeader className="items-center gap-3 pb-4 text-center">
          <DrawerTitle className="text-2xl">{t("SLIPPAGE_TITLE")}</DrawerTitle>
          <DrawerDescription className="text-center text-base leading-relaxed">
            {t("SLIPPAGE_DESCRIPTION")}
          </DrawerDescription>
        </DrawerHeader>

        <DrawerFooter className="gap-3 px-6 pb-6 sm:items-center">
          <Button
            className="h-12 w-full text-base sm:w-auto sm:min-w-[280px] sm:px-10"
            onClick={onConfirm}>
            {t("PLACE_NEW_ORDER")}
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
