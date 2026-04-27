import { ArrowLeft, HelpCircle } from "lucide-react";
import { useNavigate } from "react-router";
import { Button } from "@/components/ui/button";
import { INTERNAL_HREFS } from "@/lib/constants";
import { safeNavigateBack } from "@/lib/utils";

interface NonHomeHeaderProps {
  title: string;
  showHelp?: boolean;
  onHelpClick?: () => void;
}

export function NonHomeHeader({
  title,
  showHelp = true,
  onHelpClick,
}: NonHomeHeaderProps) {
  const navigate = useNavigate();

  const handleHelpClick = () => {
    if (onHelpClick) {
      onHelpClick();
    } else {
      navigate(INTERNAL_HREFS.HELP);
    }
  };

  return (
    <header className="sticky top-0 z-50 flex w-full items-center justify-center gap-2 bg-sidebar p-4 shadow-md shadow-primary/10">
      <div className="flex w-full max-w-xl items-center justify-between gap-2">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <Button
            onClick={() => safeNavigateBack(navigate)}
            variant="ghost"
            size="icon"
            className="flex h-8 w-8 flex-shrink-0 cursor-pointer items-center justify-center rounded-lg border border-border p-2 transition-colors hover:bg-muted"
            aria-label="Go back">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <p className="truncate font-medium text-lg">{title}</p>
        </div>
        {showHelp ? (
          <Button
            variant="outline"
            size="sm"
            onClick={handleHelpClick}
            className="flex-shrink-0 rounded-lg border-border text-foreground">
            <HelpCircle className="h-4 w-4" />
            <span className="ml-1 hidden sm:inline">Help</span>
          </Button>
        ) : (
          <div className="flex-shrink-0" />
        )}
      </div>
    </header>
  );
}
