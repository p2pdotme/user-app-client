import { AnimatePresence } from "motion/react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { Drawer, DrawerContent } from "@/components/ui/drawer";
import { useSettings } from "@/contexts";
import type { Order } from "@/core/adapters/thirdweb/validation";
import { useHapticInteractions, useRaiseDispute } from "@/hooks";
import { INTERNAL_HREFS } from "@/lib/constants";
import { SUPPORT_PAGE_TITLES } from "../../help/constants";
import { DisputeConfirmationView } from "./dispute-confirmation-view";
import { DisputeFormView } from "./dispute-form-view";
import { HelpListView } from "./help-list-view";

export type HelpPage = "list" | "dispute-confirm" | "dispute-form";

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
        </AnimatePresence>
      </DrawerContent>
    </Drawer>
  );
}
