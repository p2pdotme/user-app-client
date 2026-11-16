import { useQueryClient } from "@tanstack/react-query";
import { AnimatePresence } from "motion/react";
import { lazy, Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { useActiveAccount, useActiveWalletChain } from "thirdweb/react";
import { Drawer, DrawerContent } from "@/components/ui/drawer";
import { useSettings } from "@/contexts";
import type { Order } from "@/core/adapters/thirdweb/validation";
import { useAnalytics, useHapticInteractions, useRaiseDispute } from "@/hooks";
import { EVENTS } from "@/lib/analytics";
import { INTERNAL_HREFS } from "@/lib/constants";
import { getSupportBridgeUrl } from "@/lib/support-bridge";
import {
  destroyAiSupportWidget,
  openSupportHumanChat,
  setSupportChatPrimaryLabel,
  setSupportChatSigner,
  setSupportChatTelegram,
} from "@/lib/support-chat";
import {
  getUserFacingErrorMessage,
  isUserCancellation,
} from "@/lib/user-facing-error";
import { SUPPORT_PAGE_TITLES } from "../../help/constants";
import { ChatPendingView } from "./chat-pending-view";
import { DisputeConfirmationView } from "./dispute-confirmation-view";
import { DisputeFormView } from "./dispute-form-view";
import { HelpListView } from "./help-list-view";
import { getMinutesSincePlaced } from "./utils";

// Loaded on demand so the support widget stays out of the entry chunk. Only a
// disputed order with a connected wallet ever reaches it. Mirrors how
// src/lib/support-chat.ts defers the AI widget.
const ChatView = lazy(() =>
  import("./chat-view").then((m) => ({ default: m.ChatView })),
);

export type HelpPage =
  | "list"
  | "dispute-confirm"
  | "dispute-form"
  | "chat-pending"
  | "chat";

// While in "chat-pending" the order is refetched until it reports the dispute,
// which is also when the bridge has a thread to open. Poll rate and how long we
// wait before showing the slower-path copy.
const CHAT_PENDING_POLL_MS = 3000;
const CHAT_PENDING_TIMEOUT_MS = 40000;

export function HelpDrawer({
  open,
  onOpenChange,
  order,
  orderType,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order?: Order;
  orderType?: "BUY" | "SELL" | "PAY";
}) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [page, setPage] = useState<HelpPage>("list");
  const {
    settings: { currency },
  } = useSettings();
  const {
    triggerWarningHaptic,
    triggerSuccessHaptic,
    triggerErrorHaptic,
    onNavigate,
  } = useHapticInteractions();
  const { raiseDisputeMutation } = useRaiseDispute();
  const account = useActiveAccount();
  const activeChain = useActiveWalletChain();
  const bridgeUrl = getSupportBridgeUrl();
  const queryClient = useQueryClient();
  const [chatPendingTimedOut, setChatPendingTimedOut] = useState(false);
  const { track } = useAnalytics();

  // Order context attached to every support event and copied for the user to
  // paste into a chat, so support never has to ask "which order?".
  const orderContext = useMemo(
    () => ({
      orderId: order?.id,
      orderType: order?.orderType ?? orderType,
      orderStatus: order?.status,
      disputeStatus: order?.disputeInfo.status,
      minutesSincePlaced: order ? getMinutesSincePlaced(order) : undefined,
    }),
    [order, orderType],
  );

  // "Help drawer opened", once per open.
  const trackedOpen = useRef(false);
  useEffect(() => {
    if (!open) {
      trackedOpen.current = false;
      return;
    }
    if (trackedOpen.current) return;
    trackedOpen.current = true;
    track(EVENTS.HELP, { status: "order_help_opened", ...orderContext });
  }, [open, orderContext, track]);

  /** Human-readable one-liner, e.g. "Order #123 · Buy · Paid · placed 22 min ago". */
  const orderSummary = order
    ? t("SUP_ORDER_SUMMARY", {
        id: order.id,
        type: t(order.orderType),
        status: t(order.status),
        minutes: getMinutesSincePlaced(order),
      })
    : null;

  // Best effort: clipboard can be unavailable (permissions, insecure origin,
  // tests). Never blocks the channel from opening.
  const copyOrderSummary = (): boolean => {
    if (!orderSummary || !navigator.clipboard?.writeText) return false;
    navigator.clipboard.writeText(orderSummary).catch(() => {});
    return true;
  };

  // The bridge creates a conversation only from its OrderDispute chain
  // listener, so before a dispute exists there is no thread to open. Asking
  // early is handled, the widget surfaces an error rather than failing
  // silently, but there is no point sending someone to a panel that can only
  // say that. So gate on an existing dispute plus a bridge url, a wallet and
  // an order. This gates the in-app row only; Telegram renders regardless.
  // Note this is an existence check, not proof that sign-in will succeed —
  // which is exactly why Telegram is not conditioned on it.
  const hasDispute = order ? order.disputeInfo.status !== "DEFAULT" : false;
  const canChatInApp = Boolean(
    bridgeUrl && account && activeChain && order && hasDispute,
  );

  // The chat page is the only branch keyed on page === "chat". If the gate
  // closes while it is open, for instance the wallet session drops, no branch
  // matches and the drawer renders an empty sheet with no way back.
  useEffect(() => {
    if (page === "chat" && !canChatInApp) {
      setPage("list");
    }
  }, [page, canChatInApp]);

  // While waiting for a freshly raised dispute to index, refetch the order so
  // the parent's query picks up the DEFAULT -> RAISED flip. Its refetchInterval
  // does not poll a disputed SELL/COMPLETED order, and the one invalidation the
  // mutation fires can land before the subgraph has indexed the event, so drive
  // it here until the flip arrives (or the budget elapses, then show the slower
  // copy). invalidateQueries refetches the active order query regardless of its
  // refetchInterval.
  useEffect(() => {
    if (page !== "chat-pending") return;
    setChatPendingTimedOut(false);
    const poll = setInterval(() => {
      queryClient.invalidateQueries({ queryKey: ["order", "getOrderById"] });
    }, CHAT_PENDING_POLL_MS);
    const timeout = setTimeout(() => {
      setChatPendingTimedOut(true);
      clearInterval(poll);
    }, CHAT_PENDING_TIMEOUT_MS);
    return () => {
      clearInterval(poll);
      clearTimeout(timeout);
    };
  }, [page, queryClient]);

  // Once the refetch reports the dispute, canChatInApp opens and the bridge has
  // a thread, so leave the pending view for the live chat.
  useEffect(() => {
    if (page === "chat-pending" && canChatInApp) {
      setChatPendingTimedOut(false);
      setPage("chat");
    }
  }, [page, canChatInApp]);

  const handleRaiseDispute = () => {
    triggerWarningHaptic(); // Warning haptic for dispute action
    track(EVENTS.HELP, { status: "dispute_row_clicked", ...orderContext });
    setPage("dispute-confirm");
  };

  const handleConfirmDispute = () => {
    triggerWarningHaptic(); // Warning haptic for confirming dispute
    setPage("dispute-form");
  };

  const handleSubmitDispute = async (transactionId: string) => {
    if (!order) {
      triggerErrorHaptic();
      toast.error(t("ORDER_NOT_FOUND"));
      return;
    }

    track(EVENTS.HELP, {
      status: "dispute_submit_clicked",
      hasTransactionRef: transactionId !== "" && transactionId !== "0",
      ...orderContext,
    });
    try {
      await raiseDisputeMutation.mutateAsync({
        orderId: parseInt(order.id, 10),
        // SELL/PAY may submit without a reference (a seller who was never
        // paid has none). The contract takes any uint256; blank sends 0, the
        // same value typing "0000" always produced.
        redactTransId: BigInt(transactionId || "0"),
      });
    } catch (error) {
      triggerErrorHaptic(); // Error haptic for dispute submission failure
      const cancelled = isUserCancellation(error);
      track(EVENTS.HELP, {
        status: cancelled
          ? "dispute_submit_cancelled"
          : "dispute_submit_failed",
        errorMessage: error instanceof Error ? error.message : undefined,
        ...orderContext,
      });
      toast.error(t("DISPUTE_SUBMISSION_FAILED"), {
        description: getUserFacingErrorMessage(t, error),
      });
      return; // Stay on the form so the user can retry.
    }

    triggerSuccessHaptic(); // Success haptic for successful dispute submission
    track(EVENTS.HELP, { status: "dispute_submitted", ...orderContext });

    // Keep the drawer open and take the user straight into support chat when
    // the channel is reachable. Deliberately NOT canChatInApp: the `order` prop
    // still reports DEFAULT at this instant (it updates on the refetch the
    // mutation triggers), so the in-app gate is not open yet. The chat-pending
    // view waits for it; if the bridge is not wired we keep the Telegram path.
    const chatChannelReady = Boolean(bridgeUrl && account && activeChain);
    if (chatChannelReady) {
      toast.success(t("DISPUTE_SUBMITTED_SUCCESSFULLY"));
      setPage("chat-pending");
      return;
    }

    toast.success(t("DISPUTE_SUBMITTED_SUCCESSFULLY"), {
      description: t("DISPUTE_SUBMITTED_DESCRIPTION"),
    });
    onOpenChange(false);
    // Reset page state when drawer closes
    setTimeout(() => setPage("list"), 200);
  };

  const handleCancel = () => {
    onNavigate(); // Navigation haptic for cancel action
    setChatPendingTimedOut(false);
    setPage("list");
  };

  const handleBrowseHelpCenter = () => {
    onNavigate(); // Navigation haptic for help center
    onOpenChange(false);
    navigate(INTERNAL_HREFS.HELP);
  };

  const handleOrderTypeFAQs = () => {
    onNavigate(); // Navigation haptic for FAQ navigation
    onOpenChange(false);
    navigate(`${INTERNAL_HREFS.HELP}/${SUPPORT_PAGE_TITLES.TRANSACTIONS}`);
  };

  // The two support channels sit side by side rather than one shadowing the
  // other, so the user picks. Telegram is unconditional: a user whose in-app
  // sign-in fails still has a way to reach us from this same screen, instead of
  // being stranded on the widget's auth error with only a retry that keeps
  // failing. The in-app chat is the dispute row above, which appears only once
  // there is a thread to open.
  const handleChatOnTelegram = () => {
    onNavigate(); // Navigation haptic for chat
    track(EVENTS.HELP, {
      status: "order_telegram_clicked",
      page,
      ...orderContext,
    });
    // The group has no idea which order this is; hand the user the order
    // number to paste so support doesn't have to ask.
    if (copyOrderSummary()) {
      toast.success(t("SUP_ORDER_DETAILS_COPIED"));
    }
    onOpenChange(false);
    window.open(
      currency.telegramSupportChannel,
      "_blank",
      "noopener,noreferrer",
    );
  };

  // In-app human support (the Help page's "Chat with us"): the AI widget's
  // human thread, signed in with this wallet over the support bridge. Only
  // offered when that can work; Telegram is always beside it.
  const humanChatSigner = useMemo(() => {
    if (!account || !activeChain) return null;
    return {
      address: account.address as `0x${string}`,
      signMessage: (message: string) => account.signMessage({ message }),
      getChainId: () => activeChain.id,
    };
  }, [account, activeChain]);
  const canChatWithUs = Boolean(humanChatSigner && bridgeUrl);
  const mountedSupportWidget = useRef(false);

  // The widget is mounted on demand from here; tear it down when the order
  // screen goes away so its launcher doesn't follow the user around the app.
  useEffect(() => {
    return () => {
      if (!mountedSupportWidget.current) return;
      mountedSupportWidget.current = false;
      setSupportChatSigner(null, null);
      setSupportChatPrimaryLabel(null);
      setSupportChatTelegram(null);
      void destroyAiSupportWidget();
    };
  }, []);

  const handleChatWithUs = () => {
    if (!humanChatSigner || !bridgeUrl) {
      handleChatOnTelegram();
      return;
    }
    onNavigate();
    track(EVENTS.HELP, {
      status: "order_chat_with_us_clicked",
      ...orderContext,
    });
    // The human thread has no prefill API, so copy the order context for the
    // user to paste as their first message.
    if (copyOrderSummary()) {
      toast.success(t("SUP_ORDER_DETAILS_COPIED_CHAT"));
    }
    setSupportChatSigner(humanChatSigner, bridgeUrl);
    setSupportChatPrimaryLabel(t("CHAT_WITH_US"));
    setSupportChatTelegram(
      currency.telegramSupportChannel
        ? {
            url: currency.telegramSupportChannel,
            label: t("CHAT_ON_TELEGRAM"),
            sub: t("CHAT_ON_TELEGRAM_SUBTITLE"),
            short: t("TELEGRAM"),
          }
        : null,
    );
    mountedSupportWidget.current = true;
    // Close the drawer first: its modal overlay would otherwise sit over the
    // chat panel and swallow taps.
    onOpenChange(false);
    setTimeout(() => setPage("list"), 200);
    openSupportHumanChat(currency.currency || "global", account?.address)
      .then((opened) => {
        if (!opened) toast.error(t("SUP_CHAT_UNAVAILABLE"));
      })
      .catch(() => toast.error(t("SUP_CHAT_UNAVAILABLE")));
  };

  const handleOpenDisputeChat = () => {
    onNavigate(); // Navigation haptic for chat
    setPage("chat");
  };

  // Reset page when drawer closes
  const handleOpenChange = (open: boolean) => {
    onOpenChange(open);
    if (!open) {
      setTimeout(() => setPage("list"), 200);
    }
  };

  return (
    <Drawer open={open} onOpenChange={handleOpenChange}>
      <DrawerContent className="px-6 pb-6">
        <AnimatePresence mode="wait" initial={false}>
          {page === "list" && (
            <HelpListView
              key="help-list"
              order={order}
              orderType={orderType}
              disputeStatus={order?.disputeInfo.status}
              onRaiseDispute={handleRaiseDispute}
              onBrowseHelpCenter={handleBrowseHelpCenter}
              onOrderTypeFAQs={handleOrderTypeFAQs}
              onChatOnTelegram={handleChatOnTelegram}
              onChatWithUs={canChatWithUs ? handleChatWithUs : undefined}
              onOpenDisputeChat={
                canChatInApp ? handleOpenDisputeChat : undefined
              }
            />
          )}
          {page === "dispute-confirm" && (
            <DisputeConfirmationView
              key="dispute-confirmation"
              onConfirm={handleConfirmDispute}
              onCancel={handleCancel}
              order={order}
              isSubmitting={false}
            />
          )}
          {page === "dispute-form" && (
            <DisputeFormView
              key="dispute-form"
              onSubmit={handleSubmitDispute}
              onCancel={handleCancel}
              order={order}
              isSubmitting={raiseDisputeMutation.isPending}
            />
          )}
          {page === "chat-pending" && (
            <ChatPendingView
              key="chat-pending"
              timedOut={chatPendingTimedOut}
              onChatOnTelegram={handleChatOnTelegram}
              onBack={handleCancel}
            />
          )}
          {/* canChatInApp already implies all four. They are repeated
              because a boolean does not narrow the optional types for
              TypeScript. */}
          {page === "chat" &&
            canChatInApp &&
            order &&
            account &&
            activeChain &&
            bridgeUrl && (
              <Suspense key="support-chat" fallback={null}>
                <ChatView
                  orderId={order.id}
                  isSettled={order.disputeInfo.status === "SETTLED"}
                  account={account}
                  chainId={activeChain.id}
                  bridgeUrl={bridgeUrl}
                  onBack={handleCancel}
                />
              </Suspense>
            )}
        </AnimatePresence>
      </DrawerContent>
    </Drawer>
  );
}
