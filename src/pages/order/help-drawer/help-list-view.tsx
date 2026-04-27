import {
  AlertTriangle,
  ArrowLeftCircle,
  BookOpen,
  Clock,
  FileText,
  MessageCircle,
} from "lucide-react";
import { motion } from "motion/react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import {
  DrawerClose,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Separator } from "@/components/ui/separator";
import type { Order } from "@/core/adapters/thirdweb/validation";
import { cn } from "@/lib/utils";
import { canRaiseDispute, getDisputeTimeRemaining } from "./utils";

interface HelpListViewProps {
  order?: Order;
  orderType?: "BUY" | "SELL" | "PAY";
  onRaiseDispute: () => void;
  onBrowseHelpCenter: () => void;
  onOrderTypeFAQs: () => void;
  onChatWithUs: () => void;
}

export function HelpListView({
  order,
  orderType,
  onRaiseDispute,
  onBrowseHelpCenter,
  onOrderTypeFAQs,
  onChatWithUs,
}: HelpListViewProps) {
  const { t } = useTranslation();
  const canDispute = order ? canRaiseDispute(order) : false;
  const { timeRemaining, canRaiseNow } = order
    ? getDisputeTimeRemaining(order, t)
    : { timeRemaining: "", canRaiseNow: false };

  // Determine the effective order type for FAQ section
  const effectiveOrderType = order?.orderType || orderType;

  return (
    <motion.div
      key="help-list"
      initial={{ x: 0, opacity: 1 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: "-100%", opacity: 0 }}
      transition={{ duration: 0.2, ease: "easeInOut" }}
      layout
      className="w-full">
      <DrawerHeader className="text-center">
        <div className="flex w-full items-center justify-between">
          <DrawerClose>
            <ArrowLeftCircle className="size-6" />
          </DrawerClose>
          <div className="flex flex-col gap-2">
            <DrawerTitle>{t("HELP_AND_SUPPORT")}</DrawerTitle>
            <DrawerDescription>
              {t("HELP_AND_SUPPORT_DESCRIPTION")}
            </DrawerDescription>
          </div>
          <div className="w-6" />
        </div>
      </DrawerHeader>

      <div className="space-y-2">
        {/* Raise a Dispute - Only show when order exists */}
        {order && (
          <>
            <Button
              variant="ghost"
              className={cn(
                "flex h-fit items-start gap-4 rounded-lg p-4 transition-colors",
                canDispute && canRaiseNow
                  ? "cursor-pointer hover:bg-accent/50"
                  : "cursor-not-allowed opacity-60",
              )}
              onClick={canDispute && canRaiseNow ? onRaiseDispute : undefined}>
              <div
                className={cn(
                  "flex size-12 shrink-0 items-center justify-center rounded-lg",
                  canDispute && canRaiseNow
                    ? "bg-destructive/10"
                    : "bg-muted/30",
                )}>
                <AlertTriangle
                  className={cn(
                    "size-6",
                    canDispute && canRaiseNow
                      ? "text-destructive"
                      : "text-muted-foreground",
                  )}
                />
              </div>
              <div className="flex-1">
                <h3 className="text-left font-medium text-base">
                  {t("RAISE_A_DISPUTE")}
                </h3>
                <p className="text-left font-light text-muted-foreground text-sm">
                  {canDispute && canRaiseNow
                    ? t("RAISE_DISPUTE_DESCRIPTION")
                    : timeRemaining}
                </p>
                {canDispute && canRaiseNow && (
                  <div className="mt-2 flex items-center gap-1">
                    <Clock className="size-3 text-muted-foreground" />
                    <p className="text-muted-foreground text-xs">
                      {t("TIME_REMAINING")}: {timeRemaining}
                    </p>
                  </div>
                )}
              </div>
            </Button>

            <div className="px-4">
              <Separator className="bg-primary/10" />
            </div>
          </>
        )}

        {/* Order Type FAQs - Always show when we have an order type */}
        {effectiveOrderType && (
          <>
            <Button
              variant="ghost"
              className="flex h-fit cursor-pointer items-start gap-4 rounded-lg p-4 transition-colors hover:bg-accent/50"
              onClick={onOrderTypeFAQs}>
              <div className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                <FileText className="size-6 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="text-left font-medium text-base">
                  {t(`${effectiveOrderType}_USDC_FAQS`)}
                </h3>
                <p className="text-left text-muted-foreground text-sm">
                  {t("VIEW_ORDER_TYPE_FAQS_DESCRIPTION", {
                    orderType: effectiveOrderType.toLowerCase(),
                  })}
                </p>
              </div>
            </Button>

            <div className="px-4">
              <Separator className="bg-primary/10" />
            </div>
          </>
        )}

        {/* Browse Help Center */}
        <Button
          variant="ghost"
          className="flex h-fit cursor-pointer items-start gap-4 rounded-lg p-4 transition-colors hover:bg-accent/50"
          onClick={onBrowseHelpCenter}>
          <div className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-primary/10">
            <BookOpen className="size-6 text-primary" />
          </div>
          <div className="flex-1">
            <h3 className="text-left font-semibold text-base">
              {t("BROWSE_HELP_CENTER")}
            </h3>
            <p className="text-left text-muted-foreground text-sm">
              {t("BROWSE_HELP_CENTER_DESCRIPTION")}
            </p>
          </div>
        </Button>
      </div>

      {/* Action Button */}
      <div className="mt-6 px-4">
        <Button
          variant="outline"
          className="w-full gap-2 p-6"
          onClick={onChatWithUs}>
          <MessageCircle className="size-4" />
          {t("CHAT_WITH_US")}
        </Button>
      </div>
    </motion.div>
  );
}
