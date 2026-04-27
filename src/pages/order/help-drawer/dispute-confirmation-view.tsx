import { ArrowLeftCircle, Loader2 } from "lucide-react";
import { motion } from "motion/react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import {
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import type { Order } from "@/core/adapters/thirdweb/validation";

interface DisputeConfirmationViewProps {
  onConfirm: () => void;
  onCancel: () => void;
  order?: Order;
  isSubmitting?: boolean;
}

export function DisputeConfirmationView({
  onConfirm,
  onCancel,
  order,
  isSubmitting = false,
}: DisputeConfirmationViewProps) {
  const { t } = useTranslation();

  return (
    <motion.div
      key="dispute-confirmation"
      initial={{ x: "100%", opacity: 0.5 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: "100%", opacity: 0.5 }}
      transition={{ duration: 0.2, ease: "easeInOut" }}
      layout
      className="w-full">
      <DrawerHeader className="w-full text-center">
        <div className="flex w-full items-center justify-between">
          <Button
            variant="ghost"
            size="icon"
            onClick={onCancel}
            disabled={isSubmitting}>
            <ArrowLeftCircle className="size-6" />
          </Button>
          <div className="flex flex-col gap-2">
            <DrawerTitle className="flex-1">
              {t("RAISE_DISPUTE_FOR_TRANSACTION")}
            </DrawerTitle>
            <DrawerDescription>
              {t("RAISE_DISPUTE_FOR_TRANSACTION_DESCRIPTION")}
            </DrawerDescription>
          </div>
          <div className="w-6" />
        </div>
      </DrawerHeader>

      <div className="space-y-6 px-4">
        {/* Warning Note */}
        <div className="space-y-4">
          <div className="text-left">
            <h4 className="mb-2 font-semibold text-destructive text-sm">
              {t("NOTE")}:
            </h4>
            <ul className="space-y-2 text-sm">
              <li className="flex items-start gap-2">
                <span className="mt-1 text-muted-foreground">•</span>
                <span>{t("DISPUTE_WARNING_PAYMENT")}</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 text-muted-foreground">•</span>
                <span>{t("DISPUTE_WARNING_REVIEW")}</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 text-muted-foreground">•</span>
                <span>{t("DISPUTE_WARNING_FALSE_DISPUTES")}</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Order Information - Only show when order exists */}
        {order && (
          <div className="rounded-lg bg-muted/50 p-4">
            <p className="text-muted-foreground text-xs">
              {t("ORDER_TYPE")}: {order.orderType}
            </p>
            <p className="text-muted-foreground text-xs">
              {t("STATUS")}: {order.status}
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex w-full items-center justify-center gap-2">
          <Button
            onClick={onConfirm}
            disabled={isSubmitting}
            className="w-1/2 bg-primary p-6 text-primary-foreground hover:bg-primary/90">
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
            onClick={onCancel}
            variant="outline"
            className="w-1/2 p-6"
            disabled={isSubmitting}>
            {t("CANCEL")}
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
