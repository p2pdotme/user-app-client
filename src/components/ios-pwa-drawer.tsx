import { PlusSquare, Share } from "lucide-react";
import { useTranslation } from "react-i18next";
import ASSETS from "@/assets";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";

interface IOSPWADrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function IOSPWADrawer({ isOpen, onClose }: IOSPWADrawerProps) {
  const { t } = useTranslation();

  return (
    <Drawer open={isOpen} onOpenChange={onClose}>
      <DrawerContent className="container-narrow mx-auto pb-8">
        <DrawerHeader className="text-center">
          <div className="flex items-center justify-center p-4">
            <ASSETS.ICONS.Logo className="size-20 text-primary" />
          </div>
          <DrawerTitle className="font-semibold text-xl">
            {t("INSTALL_PWA_IOS_TITLE")}
          </DrawerTitle>
          <DrawerDescription>
            {t("INSTALL_PWA_IOS_DESCRIPTION")}
          </DrawerDescription>
        </DrawerHeader>
        <ol className="flex flex-col space-y-2 rounded-lg bg-primary/10 p-4">
          <li className="flex items-start gap-2">
            <Share className="size-4" />
            <p className="font-medium text-sm">{t("INSTALL_PWA_IOS_STEP_1")}</p>
          </li>
          <li className="flex items-start gap-2">
            <PlusSquare className="size-4" />
            <p className="font-medium text-sm">{t("INSTALL_PWA_IOS_STEP_2")}</p>
          </li>
        </ol>
      </DrawerContent>
    </Drawer>
  );
}
