import { CopyIcon } from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface CopyButtonProps {
  /** Full value written to the clipboard. */
  value: string;
  /** What is shown; defaults to the value itself. */
  display?: string;
  /** Toast shown after copying. */
  copiedMessage: string;
  ariaLabel: string;
  className?: string;
}

/** A hash or address chip that copies its full value when tapped. */
export function CopyButton({
  value,
  display,
  copiedMessage,
  ariaLabel,
  className,
}: CopyButtonProps) {
  const { t } = useTranslation();

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      toast.success(copiedMessage);
    } catch {
      toast.error(t("FAILED_TO_COPY"));
    }
  };

  return (
    <button
      type="button"
      aria-label={ariaLabel}
      onClick={handleCopy}
      className={cn(
        "flex w-full cursor-pointer items-center justify-between gap-2 rounded-lg bg-muted px-3 py-2 text-left transition-colors hover:bg-muted/80",
        className,
      )}>
      <code className="min-w-0 break-all font-mono text-sm">
        {display ?? value}
      </code>
      <CopyIcon className="size-4 shrink-0 text-muted-foreground" />
    </button>
  );
}
