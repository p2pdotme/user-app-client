import { Loader2 } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router";
import { NonHomeHeader } from "@/components";
import { Button } from "@/components/ui/button";
import { useEventListeners, useGetOrderById } from "@/hooks";
import { INTERNAL_HREFS } from "@/lib/constants";
import { Buy } from "./buy";
import { HelpDrawer } from "./help-drawer";
import { Pay } from "./pay";
import { Sell } from "./sell";

export function Order() {
  const { t } = useTranslation();
  const { id: orderId } = useParams();
  const navigate = useNavigate();
  const [showHelpDrawer, setShowHelpDrawer] = useState(false);

  // listen to order events
  useEventListeners(orderId);

  const { order, isOrderPending, isOrderError, orderError, refetchOrder } =
    useGetOrderById(Number(orderId));

  if (isOrderPending)
    return (
      <>
        <NonHomeHeader title={`${t("ORDER")} ${orderId}`} />
        <main className="no-scrollbar container-narrow flex h-full w-full flex-col items-center justify-center gap-2 overflow-y-auto py-8">
          <Loader2 className="size-16 animate-spin text-primary" />
        </main>
      </>
    );

  if (isOrderError && orderError)
    return (
      <>
        <NonHomeHeader title={`${t("ORDER")} ${orderId}`} />
        <main className="no-scrollbar container-narrow flex h-full w-full flex-col items-center justify-center gap-4 overflow-y-auto py-8">
          <p className="text-center font-medium text-lg">
            {t("ORDER_LOAD_FAILED_TITLE")}
          </p>
          <p className="text-center text-muted-foreground text-sm">
            {t("ORDER_LOAD_FAILED_DESCRIPTION")}
          </p>
          <div className="flex w-full max-w-xs flex-col gap-2">
            <Button onClick={() => void refetchOrder()}>{t("RETRY")}</Button>
            <Button
              variant="outline"
              onClick={() => navigate(INTERNAL_HREFS.TRANSACTIONS)}>
              {t("VIEW_MY_ORDERS")}
            </Button>
            <Button
              variant="ghost"
              onClick={() => navigate(INTERNAL_HREFS.HELP)}>
              {t("CONTACT_SUPPORT")}
            </Button>
          </div>
        </main>
      </>
    );

  if (!order)
    return (
      <>
        <NonHomeHeader title={`${t("ORDER")} #${orderId}`} />
        <main className="no-scrollbar container-narrow flex h-full w-full flex-col items-center justify-center gap-2 overflow-y-auto py-8">
          <p className="text-destructive">{t("ORDER_NOT_FOUND")}</p>
        </main>
      </>
    );

  const renderOrderContent = () => {
    switch (order.orderType) {
      case "BUY":
        return <Buy order={order} />;
      case "SELL":
        return <Sell order={order} />;
      case "PAY":
        return <Pay order={order} />;
      default:
        return null;
    }
  };

  return (
    <>
      <HelpDrawer
        open={showHelpDrawer}
        onOpenChange={setShowHelpDrawer}
        order={order}
      />
      <NonHomeHeader
        title={`${t("ORDER")} ${orderId}`}
        onHelpClick={() => setShowHelpDrawer(true)}
      />
      {renderOrderContent()}
    </>
  );
}
