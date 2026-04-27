import { ArrowLeftCircle, Loader2 } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import {
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import type { Order } from "@/core/adapters/thirdweb/validation";

interface DisputeFormViewProps {
  onSubmit: (transactionId: string) => void;
  onCancel: () => void;
  order?: Order;
  isSubmitting?: boolean;
}

export function DisputeFormView({
  onSubmit,
  onCancel,
  order,
  isSubmitting = false,
}: DisputeFormViewProps) {
  const { t } = useTranslation();
  const [transactionId, setTransactionId] = useState("");

  const handleSubmit = () => {
    if (transactionId.length === 4) {
      onSubmit(transactionId);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, ""); // Only allow digits
    if (value.length <= 4) {
      setTransactionId(value);
    }
  };

  const isSubmitDisabled = transactionId.length !== 4 || isSubmitting;

  return (
    <motion.div
      key="dispute-form"
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
            <DrawerTitle className="flex-1">{t("RAISE_DISPUTE")}</DrawerTitle>
            <DrawerDescription>
              {t("ENTER_LAST_4_DIGITS_OF_TRANSACTION_ID")}
            </DrawerDescription>
          </div>
          <div className="w-6" />
        </div>
      </DrawerHeader>

      <div className="space-y-6 px-4">
        {/* Transaction ID Input */}
        <div className="space-y-2">
          <label htmlFor="txn-last4" className="font-medium text-sm">
            {t("LAST_4_DIGITS")}
          </label>
          <Input
            id="txn-last4"
            type="text"
            value={transactionId}
            onChange={handleInputChange}
            placeholder="XXXX"
            maxLength={4}
            className="text-center text-lg tracking-widest"
            disabled={isSubmitting}
          />
          <p className="text-muted-foreground text-xs">
            {t("ENTER_LAST_4_DIGITS_INSTRUCTION")}
          </p>
        </div>

        {/* Order Information - Only show when order exists */}
        {order && (
          <div className="space-y-2 rounded-lg bg-muted/50 p-4">
            <div className="flex justify-between">
              <span className="text-muted-foreground text-sm">
                {t("ORDER_ID")}:
              </span>
              <span className="font-medium text-sm">{order.id}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground text-sm">
                {t("ORDER_TYPE")}:
              </span>
              <span className="font-medium text-sm">{order.orderType}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground text-sm">
                {t("STATUS")}:
              </span>
              <span className="font-medium text-sm">{order.status}</span>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex w-full items-center justify-center gap-2">
          <Button
            onClick={handleSubmit}
            disabled={isSubmitDisabled}
            className="w-1/2 bg-destructive p-6 text-destructive-foreground hover:bg-destructive/90">
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                {t("SUBMITTING")}
              </>
            ) : (
              t("RAISE_DISPUTE")
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
