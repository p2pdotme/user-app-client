import type { SupportSigner } from "@p2pdotme/widgets/support";
import { UserSupportPanel } from "@p2pdotme/widgets/support";
import { ArrowLeftCircle } from "lucide-react";
import { motion } from "motion/react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import {
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";

interface ChatViewProps {
  orderId: string;
  signer: SupportSigner;
  bridgeUrl: string;
  onBack: () => void;
}

export function ChatView({
  orderId,
  signer,
  bridgeUrl,
  onBack,
}: ChatViewProps) {
  const { t } = useTranslation();

  return (
    <motion.div
      key="support-chat"
      initial={{ x: "100%", opacity: 0.5 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: "100%", opacity: 0.5 }}
      transition={{ duration: 0.2, ease: "easeInOut" }}
      layout
      className="w-full">
      <DrawerHeader className="w-full text-center">
        <div className="flex w-full items-center justify-between">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeftCircle className="size-6" />
          </Button>
          <div className="flex flex-col gap-2">
            <DrawerTitle className="flex-1">{t("CHAT_WITH_US")}</DrawerTitle>
            <DrawerDescription>
              {t("HELP_AND_SUPPORT_DESCRIPTION")}
            </DrawerDescription>
          </div>
          <div className="w-6" />
        </div>
      </DrawerHeader>

      <div className="h-[60svh] px-4 pb-2">
        <UserSupportPanel
          orderId={orderId}
          signer={signer}
          bridgeUrl={bridgeUrl}
        />
      </div>
    </motion.div>
  );
}
