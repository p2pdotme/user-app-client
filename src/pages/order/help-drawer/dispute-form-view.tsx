import { ArrowLeftCircle, Info, Loader2 } from "lucide-react";
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
  /**
   * Called with the 4 digits entered, or "" when the field is optional
   * (SELL/PAY) and the user left it blank.
   */
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

  // BUY: the user paid fiat, so they hold the payment reference (UTR) and it
  // is what support matches against the merchant's records — required.
  // SELL/PAY: the merchant was meant to pay the user. A user who was never
  // paid has no reference, so the field is optional there.
  const userPaysFiat = order?.orderType === "BUY";
  const isReferenceOptional = !userPaysFiat;

  const isValid =
    transactionId.length === 4 ||
    (isReferenceOptional && transactionId.length === 0);

  const handleSubmit = () => {
    if (isValid) {
      onSubmit(transactionId);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, ""); // Only allow digits
    if (value.length <= 4) {
      setTransactionId(value);
    }
  };

  const isSubmitDisabled = !isValid || isSubmitting;

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
              {userPaysFiat
                ? t("ENTER_LAST_4_DIGITS_OF_TRANSACTION_ID")
                : t("SUP_DISPUTE_FORM_DESCRIPTION_SELL_PAY")}
            </DrawerDescription>
          </div>
          <div className="w-6" />
        </div>
      </DrawerHeader>

      <div className="space-y-6 px-4">
        {/* Transaction ID Input */}
        <div className="space-y-2">
          <label htmlFor="txn-last4" className="font-medium text-sm">
            {isReferenceOptional
              ? t("SUP_DISPUTE_REFERENCE_LABEL_OPTIONAL")
              : t("LAST_4_DIGITS")}
          </label>
          <Input
            id="txn-last4"
            type="text"
            inputMode="numeric"
            value={transactionId}
            onChange={handleInputChange}
            placeholder="XXXX"
            maxLength={4}
            className="text-center text-lg tracking-widest"
            disabled={isSubmitting}
          />
          <p className="text-muted-foreground text-xs">
            {userPaysFiat
              ? t("ENTER_LAST_4_DIGITS_INSTRUCTION")
              : t("SUP_DISPUTE_REFERENCE_HINT_SELL_PAY")}
          </p>
          {userPaysFiat && (
            <p className="flex items-start gap-1 text-muted-foreground text-xs">
              <Info className="mt-0.5 size-3 shrink-0" />
              {t("SUP_DISPUTE_TXN_ID_WHERE_BUY")}
            </p>
          )}
        </div>

        {/* Order Information - Only show when order exists */}
        {order && (
          <div className="space-y-2 rounded-lg bg-muted/50 p-4">
            <div className="flex justify-between">
              <span className="text-muted-foreground text-sm">
                {t("ORDER_ID")}:
              </span>
              <span className="font-medium text-sm">#{order.id}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground text-sm">
                {t("ORDER_TYPE")}:
              </span>
              <span className="font-medium text-sm">{t(order.orderType)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground text-sm">
                {t("STATUS")}:
              </span>
              <span className="font-medium text-sm">{t(order.status)}</span>
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
