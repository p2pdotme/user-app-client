import { ArrowRight, MessageCircle } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { useSupportChat } from "@/hooks";
import { cn } from "@/lib/utils";

interface ChatButtonProps {
  className?: string;
  onClick?: () => void;
}

export const ChatButton = ({ className, onClick }: ChatButtonProps) => {
  const { t } = useTranslation();
  const { openSupportChat } = useSupportChat();

  return (
    <Button
      variant="outline"
      className={cn("h-12 items-center justify-between px-4", className)}
      onClick={onClick ?? openSupportChat}>
      <div className="flex items-center gap-2">
        <MessageCircle className="size-4" />
        <span>{t("CHAT_WITH_US")}</span>
      </div>
      <ArrowRight className="size-4" />
    </Button>
  );
};
