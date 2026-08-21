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
import { DisputeConfirmationView } from "./dispute-confirmation-view";
import { DisputeFormView } from "./dispute-form-view";
import { HelpListView } from "./help-list-view";

// Loaded on demand so the support widget stays out of the entry chunk. Only a
// disputed order with a connected wallet ever reaches it. Mirrors how
// src/lib/support-chat.ts defers the AI widget.
const ChatView = lazy(() =>
  import("./chat-view").then((m) => ({ default: m.ChatView })),
);

export type HelpPage = "list" | "dispute-confirm" | "dispute-form" | "chat";

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

  // The bridge creates a conversation only from its OrderDispute chain
  // listener, so before a dispute exists there is no thread to open. Asking
  // early is handled, the widget surfaces an error rather than failing
  // silently, but there is no point sending someone to a panel that can only
  // say that. So gate on an existing dispute plus a bridge url, a wallet and
  // an order, and keep the Telegram fallback for everything else.
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

    await raiseDisputeMutation.mutateAsync(
      {
        orderId: parseInt(order.id, 10),
        redactTransId: BigInt(transactionId),
      },
      {
        onSuccess: () => {
          triggerSuccessHaptic(); // Success haptic for successful dispute submission
          toast.success(t("DISPUTE_SUBMITTED_SUCCESSFULLY"), {
            description: t("DISPUTE_SUBMITTED_DESCRIPTION"),
          });
        },
        onError: (error) => {
          triggerErrorHaptic(); // Error haptic for dispute submission failure
          toast.error(t("DISPUTE_SUBMISSION_FAILED"), {
            description: error.message,
          });
        },
      },
    );

    onOpenChange(false);
    // Reset page state when drawer closes
    setTimeout(() => setPage("list"), 200);
  };

  const handleCancel = () => {
    onNavigate(); // Navigation haptic for cancel action
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

  const handleChatWithUs = () => {
    onNavigate(); // Navigation haptic for chat
    // Prefer the in-app signed support chat (Chatwoot bridge) when available;
    // fall back to the Telegram support channel otherwise.
    if (canChatInApp) {
      setPage("chat");
      return;
    }
    onOpenChange(false);
    window.open(
      currency.telegramSupportChannel,
      "_blank",
      "noopener,noreferrer",
    );
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
              onChatWithUs={handleChatWithUs}
              onOpenDisputeChat={canChatInApp ? handleChatWithUs : undefined}
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
