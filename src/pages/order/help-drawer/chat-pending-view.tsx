import { ArrowLeftCircle, Loader2 } from "lucide-react";
import { motion } from "motion/react";
import { useTranslation } from "react-i18next";
import ASSETS from "@/assets";
import { Button } from "@/components/ui/button";
import {
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";

interface ChatPendingViewProps {
  /** The refetch budget elapsed without the dispute indexing; show the
   *  slower-path copy but keep the same escape controls. */
  timedOut: boolean;
  onChatOnTelegram: () => void;
  onBack: () => void;
}

// Shown for the few seconds between a successful raise and the support thread
// existing. The dispute is already on-chain; the bridge creates the thread from
// that same OrderDispute event, and index.tsx advances to the live chat the
// moment the order refetch reports the dispute. Until then the user waits here
// rather than on a closed drawer, and can always fall back to Telegram.
export function ChatPendingView({
  timedOut,
  onChatOnTelegram,
  onBack,
}: ChatPendingViewProps) {
  const { t } = useTranslation();

  return (
    <motion.div
      key="chat-pending"
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
            <DrawerTitle className="flex-1">
              {t("SETTING_UP_SUPPORT_CHAT")}
            </DrawerTitle>
            <DrawerDescription>
              {timedOut
                ? t("CHAT_SETUP_TAKING_LONGER")
                : t("SETTING_UP_SUPPORT_CHAT_DESCRIPTION")}
            </DrawerDescription>
          </div>
          <div className="w-6" />
        </div>
      </DrawerHeader>

      <div className="flex flex-col items-center gap-8 px-4 py-8">
        {!timedOut && (
          <Loader2 className="size-10 animate-spin text-muted-foreground" />
        )}

        {/* Escape hatch — never trap the user on the spinner. */}
        <Button
          variant="outline"
          className="w-full gap-2 p-6"
          onClick={onChatOnTelegram}>
          <ASSETS.ICONS.Telegram className="size-5" />
          {t("CHAT_ON_TELEGRAM")}
        </Button>
      </div>
    </motion.div>
  );
}
