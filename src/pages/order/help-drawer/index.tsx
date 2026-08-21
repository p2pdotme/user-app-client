import { AnimatePresence } from "motion/react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { Drawer, DrawerContent } from "@/components/ui/drawer";
import { useSettings } from "@/contexts";
import type { Order } from "@/core/adapters/thirdweb/validation";
import {
  useHapticInteractions,
  useRaiseDispute,
  useSupportSigner,
} from "@/hooks";
import { INTERNAL_HREFS } from "@/lib/constants";
import { getSupportBridgeUrl } from "@/lib/support-bridge";
import { SUPPORT_PAGE_TITLES } from "../../help/constants";
import { ChatView } from "./chat-view";
import { DisputeConfirmationView } from "./dispute-confirmation-view";
import { DisputeFormView } from "./dispute-form-view";
import { HelpListView } from "./help-list-view";

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
  const supportSigner = useSupportSigner();
  const bridgeUrl = getSupportBridgeUrl();

  // The bridge creates a conversation only from its OrderDispute chain
  // listener, so before a dispute exists there is no thread to open. Asking
  // early is handled, the widget surfaces an error rather than failing
  // silently, but there is no point sending someone to a panel that can only
  // say that. So gate on an existing dispute plus a bridge url, a wallet and
  // an order, and keep the Telegram fallback for everything else.
  const hasDispute = order ? order.disputeInfo.status !== "DEFAULT" : false;
  const canChatInApp = Boolean(
    bridgeUrl && supportSigner && order && hasDispute,
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
              onRaiseDispute={handleRaiseDispute}
              onBrowseHelpCenter={handleBrowseHelpCenter}
              onOrderTypeFAQs={handleOrderTypeFAQs}
              onChatWithUs={handleChatWithUs}
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
          {page === "chat" &&
            canChatInApp &&
            order &&
            supportSigner &&
            bridgeUrl && (
              <ChatView
                key="support-chat"
                orderId={order.id}
                signer={supportSigner}
                bridgeUrl={bridgeUrl}
                onBack={handleCancel}
              />
            )}
        </AnimatePresence>
      </DrawerContent>
    </Drawer>
  );
}
