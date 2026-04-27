import { ChevronRight } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface SettingsItemProps {
  title: string;
  icon: ReactNode;
  onClick: () => void;
}

export const SettingsItem = ({ title, icon, onClick }: SettingsItemProps) => {
  return (
    <div className="w-full">
      <div className="m-0 h-full w-full p-0">
        <Button
          variant="ghost"
          onClick={onClick}
          className={cn(
            "h-auto w-full justify-between p-0 py-4 hover:bg-transparent",
          )}>
          <div className="flex items-center gap-4">
            <div className="relative">{icon}</div>
            <div className="flex flex-col items-start">
              <span className="font-medium">{title}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </div>
        </Button>
      </div>
    </div>
  );
};
