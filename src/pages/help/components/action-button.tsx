import { ArrowRight } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";

interface ActionButtonProps {
  icon: ReactNode;
  text: string;
  onClick?: () => void;
}

export const ActionButton = ({ icon, text, onClick }: ActionButtonProps) => {
  return (
    <Button
      variant="outline"
      onClick={onClick}
      className="h-12 flex-1 items-center justify-between px-4">
      <div className="flex items-center gap-2">
        {icon}
        <span>{text}</span>
      </div>
      <ArrowRight className="size-4" />
    </Button>
  );
};
