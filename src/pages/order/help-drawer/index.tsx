import { useQueryClient } from "@tanstack/react-query";
import { AnimatePresence } from "motion/react";
import { lazy, Suspense, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { useActiveAccount, useActiveWalletChain } from "thirdweb/react";
import { Drawer, DrawerContent } from "@/components/ui/drawer";
import { useSettings } from "@/contexts";
import type { Order } from "@/core/adapters/thirdweb/validation";
import { useHapticInteractions, useRaiseDispute } from "@/hooks";
import { INTERNAL_HREFS } from "@/lib/constants";
import { getSupportBridgeUrl } from "@/lib/support-bridge";
import { SUPPORT_PAGE_TITLES } from "../../help/constants";
import { ChatPendingView } from "./chat-pending-view";
import { DisputeConfirmationView } from "./dispute-confirmation-view";
import { DisputeFormView } from "./dispute-form-view";
import { HelpListView } from "./help-list-view";

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

    try {
      await raiseDisputeMutation.mutateAsync({
        orderId: parseInt(order.id, 10),
        redactTransId: BigInt(transactionId),
      });
    } catch (error) {
      triggerErrorHaptic(); // Error haptic for dispute submission failure
      toast.error(t("DISPUTE_SUBMISSION_FAILED"), {
        description: error instanceof Error ? error.message : undefined,
      });
      return; // Stay on the form so the user can retry.
    }

    triggerSuccessHaptic(); // Success haptic for successful dispute submission

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
    onOpenChange(false);
    window.open(
      currency.telegramSupportChannel,
      "_blank",
      "noopener,noreferrer",
    );
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
