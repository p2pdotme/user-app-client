import { RotateCw } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { ROW_BTN } from "@/components/verification-row";

/**
 * Row action for when a verification-status read failed: we don't know
 * whether the user is verified, so offer a re-check instead of "Get verified".
 */
export function StatusCheckFailedAction({ onRetry }: { onRetry: () => void }) {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col items-end gap-1">
      <span className="text-muted-foreground text-xs">
        {t("VFX_STATUS_CHECK_FAILED")}
      </span>
      <Button variant="outline" className={ROW_BTN} onClick={onRetry}>
        <RotateCw className="size-4" />
        {t("RETRY")}
      </Button>
    </div>
  );
}
