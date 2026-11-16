import {
  AlertTriangle,
  ArrowLeftCircle,
  BookOpen,
  Clock,
  FileText,
  Info,
  MessageCircle,
  MessagesSquare,
} from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import ASSETS from "@/assets";
import { SafetyNotice } from "@/components/safety-notice";
import { Button } from "@/components/ui/button";
import {
  DrawerClose,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Separator } from "@/components/ui/separator";
import type { DisputeStatus, Order } from "@/core/adapters/thirdweb/validation";
import { useAnalytics } from "@/hooks";
import { EVENTS } from "@/lib/analytics";
import { cn } from "@/lib/utils";
import {
  type DisputeAvailability,
  getDisputeAvailability,
  getDisputeTimeRemaining,
} from "./utils";

interface HelpListViewProps {
  order?: Order;
  orderType?: "BUY" | "SELL" | "PAY";
  disputeStatus?: DisputeStatus;
  onRaiseDispute: () => void;
  onBrowseHelpCenter: () => void;
  onOrderTypeFAQs: () => void;
  onChatOnTelegram: () => void;
  onOpenDisputeChat?: () => void;
  /**
   * In-app human support chat (the same one the Help page's "Chat with us"
   * opens). Omitted when it can't be reached; Telegram stays either way.
   */
  onChatWithUs?: () => void;
}

const NOT_ELIGIBLE_KEYS: Record<
  Extract<DisputeAvailability, { state: "not_eligible" }>["reason"],
  string
> = {
  buy_not_paid: "SUP_DISPUTE_NOT_ELIGIBLE_BUY_NOT_PAID",
  buy_completed: "SUP_DISPUTE_NOT_ELIGIBLE_BUY_COMPLETED",
  sell_not_completed: "SUP_DISPUTE_NOT_ELIGIBLE_SELL_NOT_COMPLETED",
  sell_cancelled: "SUP_DISPUTE_NOT_ELIGIBLE_SELL_CANCELLED",
};

export function HelpListView({
  order,
  orderType,
  disputeStatus,
  onRaiseDispute,
  onBrowseHelpCenter,
  onOrderTypeFAQs,
  onChatOnTelegram,
  onOpenDisputeChat,
  onChatWithUs,
}: HelpListViewProps) {
  const { t } = useTranslation();
  const { track } = useAnalytics();
  // Exactly one of the two rows renders whenever there is an order. The chat
  // row needs a dispute AND a handler, because without one it would lead
  // nowhere. Everything else falls through to the normal "Raise a Dispute"
  // row, including a disputed order whose gate is shut, where that row shows
  // in its usual disabled form. Deriving both conditions from one boolean is
  // what keeps them complementary. Two hand-written conditions drift and
  // leave a state where neither renders.
  const hasDispute = Boolean(disputeStatus && disputeStatus !== "DEFAULT");
  const isSettled = disputeStatus === "SETTLED";
  const showDisputeChatRow = Boolean(order && hasDispute && onOpenDisputeChat);

  const availability: DisputeAvailability | null = order
    ? hasDispute
      ? { state: "already_raised" }
      : getDisputeAvailability(order)
    : null;
  const canRaiseNow = availability?.state === "available";
  const { timeRemaining } = order
    ? getDisputeTimeRemaining(order, t)
    : { timeRemaining: "" };

  // Determine the effective order type for FAQ section
  const effectiveOrderType = order?.orderType || orderType;

  // BUY is the only side where the user pays fiat and awaits USDC. On SELL/PAY
  // the merchant pays fiat to the user, so the dispute copy must flip.
  const userPaysFiat = effectiveOrderType === "BUY";

  // One "viewed" event per distinct dispute state, so funnels can tell how
  // often users reach the row while it is still locked.
  const trackedState = useRef<string | null>(null);
  useEffect(() => {
    if (!order || !availability || showDisputeChatRow) return;
    const key = `${order.id}:${availability.state}`;
    if (trackedState.current === key) return;
    trackedState.current = key;
    track(EVENTS.HELP, {
      status: "dispute_row_viewed",
      state: availability.state,
      reason:
        availability.state === "not_eligible" ? availability.reason : undefined,
      orderType: order.orderType,
      orderStatus: order.status,
    });
  }, [order, availability, showDisputeChatRow, track]);

  const disabledRowText = (() => {
    if (!availability) return "";
    switch (availability.state) {
      case "locked":
        return t("SUP_DISPUTE_AVAILABLE_IN", {
          minutes: availability.minutesUntil,
        });
      case "not_eligible":
        return t(NOT_ELIGIBLE_KEYS[availability.reason]);
      case "already_raised":
        return t("SUP_DISPUTE_ALREADY_RAISED");
      case "expired":
        return timeRemaining;
      default:
        return "";
    }
  })();

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

      <SafetyNotice variant="wallet" className="mb-4" />

      <div className="space-y-2">
        {/* In-app dispute chat - replaces the raise row once a dispute
            exists. Sits alongside the Telegram button below, not instead of
            it, so the user can choose either channel. */}
        {showDisputeChatRow && (
          <>
            <Button
              variant="ghost"
              className="flex h-fit w-full cursor-pointer items-start gap-4 rounded-lg p-4 transition-colors hover:bg-accent/50"
              onClick={onOpenDisputeChat}>
              <div
                className={cn(
                  "flex size-12 shrink-0 items-center justify-center rounded-lg",
                  isSettled ? "bg-primary/10" : "bg-destructive/10",
                )}>
                <MessageCircle
                  className={cn(
                    "size-6",
                    isSettled ? "text-primary" : "text-destructive",
                  )}
                />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-left font-medium text-base">
                    {isSettled
                      ? t("DISPUTE_RESOLVED_CHAT_TITLE")
                      : t("DISPUTE_RAISED_CHAT_TITLE")}
                  </h3>
                  <span
                    className={cn(
                      "size-2 shrink-0 rounded-full",
                      isSettled ? "bg-primary" : "bg-destructive",
                    )}
                  />
                </div>
                <p className="text-left font-light text-muted-foreground text-sm">
                  {isSettled
                    ? t("DISPUTE_RESOLVED_CHAT_DESCRIPTION")
                    : t("DISPUTE_RAISED_CHAT_DESCRIPTION")}
                </p>
              </div>
            </Button>

            <div className="px-4">
              <Separator className="bg-primary/10" />
            </div>
          </>
        )}

        {/* Raise a Dispute - Only show when order exists */}
        {order && !showDisputeChatRow && (
          <>
            <Button
              variant="ghost"
              aria-disabled={!canRaiseNow}
              className={cn(
                "flex h-fit items-start gap-4 whitespace-normal rounded-lg p-4 transition-colors",
                canRaiseNow
                  ? "cursor-pointer hover:bg-accent/50"
                  : "cursor-not-allowed",
              )}
              onClick={canRaiseNow ? onRaiseDispute : undefined}>
              <div
                className={cn(
                  "flex size-12 shrink-0 items-center justify-center rounded-lg",
                  canRaiseNow ? "bg-destructive/10" : "bg-muted/30",
                )}>
                <AlertTriangle
                  className={cn(
                    "size-6",
                    canRaiseNow ? "text-destructive" : "text-muted-foreground",
                  )}
                />
              </div>
              <div className="flex-1">
                <h3
                  className={cn(
                    "text-left font-medium text-base",
                    !canRaiseNow && "text-muted-foreground",
                  )}>
                  {t("RAISE_A_DISPUTE")}
                </h3>
                {canRaiseNow ? (
                  <>
                    <p className="text-left font-light text-muted-foreground text-sm">
                      {t(
                        userPaysFiat
                          ? "RAISE_DISPUTE_DESCRIPTION_BUY"
                          : "RAISE_DISPUTE_DESCRIPTION_SELL_PAY",
                      )}
                    </p>
                    <div className="mt-2 flex items-center gap-1">
                      <Clock className="size-3 text-muted-foreground" />
                      <p className="text-muted-foreground text-xs">
                        {timeRemaining}
                      </p>
                    </div>
                  </>
                ) : (
                  <p className="flex items-center gap-1 text-left font-medium text-muted-foreground text-sm">
                    {availability?.state === "locked" && (
                      <Clock className="size-3.5 shrink-0" />
                    )}
                    {disabledRowText}
                  </p>
                )}
                {/* While locked, say what happens meanwhile so waiting
                    doesn't feel like being ignored. */}
                {availability?.state === "locked" && (
                  <div className="mt-2 flex items-start gap-1">
                    <Info className="mt-0.5 size-3 shrink-0 text-muted-foreground" />
                    <p className="text-left text-muted-foreground text-xs">
                      {t(
                        userPaysFiat
                          ? "SUP_DISPUTE_LOCKED_EXPLAINER_BUY"
                          : "SUP_DISPUTE_LOCKED_EXPLAINER_SELL_PAY",
                        { minutes: availability.minWaitMinutes },
                      )}
                    </p>
                  </div>
                )}
                {/* Shown in both states — while the window counts down and once
                    it is open — so the user knows support is reachable and that
                    evidence helps, before they ever raise. Text only. */}
                <div className="mt-2 flex items-start gap-1">
                  <MessageCircle className="mt-0.5 size-3 shrink-0 text-muted-foreground" />
                  <p className="text-left text-muted-foreground text-xs">
                    {t(
                      userPaysFiat
                        ? "DISPUTE_CHAT_SHARE_DETAILS_NOTE_BUY"
                        : "DISPUTE_CHAT_SHARE_DETAILS_NOTE_SELL_PAY",
                    )}
                  </p>
                </div>
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
                    orderType: t(effectiveOrderType).toLowerCase(),
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

      {/* Support channels. "Chat with us" lands in the ops support queue
          in-app; Telegram is the always-available fallback. */}
      <div className="mt-6 flex flex-col gap-2 px-4">
        {onChatWithUs && (
          <Button className="w-full gap-2 p-6" onClick={onChatWithUs}>
            <MessagesSquare className="size-5" />
            {t("CHAT_WITH_US")}
          </Button>
        )}
        <Button
          variant="outline"
          className="w-full gap-2 p-6"
          onClick={onChatOnTelegram}>
          {/* size-5, not size-4: telegram.tsx has a non-square viewBox
              (0 0 23 18) and no preserveAspectRatio, so size-4 renders ~12.5px
              tall with a 0.84px stroke — a hairline beside the dispute row's
              icon above. size-5 matches social-links.tsx. */}
          <ASSETS.ICONS.Telegram className="size-5" />
          {t("CHAT_ON_TELEGRAM")}
        </Button>
        {order && (
          <p className="text-center text-muted-foreground text-xs">
            {t("SUP_ORDER_ID_SHARED_HINT", { id: order.id })}
          </p>
        )}
      </div>
    </motion.div>
  );
}
