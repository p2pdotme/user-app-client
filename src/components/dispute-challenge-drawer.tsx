import { Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";

export type DisputeChallengeAction = "challenge" | "escalate" | "finalize";

const COPY: Record<
  DisputeChallengeAction,
  { titleKey: string; descriptionKey: string }
> = {
  challenge: {
    titleKey: "DISPUTE_CHALLENGE_DECISION",
    descriptionKey: "DISPUTE_CHALLENGE_DESCRIPTION",
  },
  escalate: {
    titleKey: "DISPUTE_ESCALATE",
    descriptionKey: "DISPUTE_ESCALATE_DESCRIPTION",
  },
  finalize: {
    titleKey: "DISPUTE_FINALIZE",
    descriptionKey: "DISPUTE_FINALIZE_DESCRIPTION",
  },
};

interface DisputeChallengeDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  action: DisputeChallengeAction;
  /** Translated label of the tier the dispute moves to (appeal/escalate). */
  nextTierLabel?: string;
  orderId: string;
  isSubmitting: boolean;
  onConfirm: () => void;
}

/** Confirmation step before an appeal / escalate / finalize transaction. */
export function DisputeChallengeDrawer({
  open,
  onOpenChange,
  action,
  nextTierLabel,
  orderId,
  isSubmitting,
  onConfirm,
}: DisputeChallengeDrawerProps) {
  const { t } = useTranslation();
  const { titleKey, descriptionKey } = COPY[action];

  return (
    <Drawer open={open} onOpenChange={isSubmitting ? undefined : onOpenChange}>
      <DrawerContent className="mx-auto max-w-md px-6 pb-6">
        <DrawerHeader className="text-center">
          <DrawerTitle>{t(titleKey)}</DrawerTitle>
          <DrawerDescription>
            {t(descriptionKey, { tier: nextTierLabel ?? "" })}
          </DrawerDescription>
        </DrawerHeader>

        <div className="space-y-6">
          <div className="rounded-lg bg-muted/50 p-4">
            <p className="text-muted-foreground text-xs">
              {t("ORDER_ID")}: {orderId}
            </p>
          </div>

          <div className="flex w-full items-center justify-center gap-2">
            <Button
              onClick={onConfirm}
              disabled={isSubmitting}
              className="h-14 w-1/2 rounded-xl">
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  {t("SUBMITTING")}
                </>
              ) : (
                t("CONFIRM")
              )}
            </Button>
            <Button
              onClick={() => onOpenChange(false)}
              variant="outline"
              className="h-14 w-1/2 rounded-xl"
              disabled={isSubmitting}>
              {t("CANCEL")}
            </Button>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
