import { Loader2 } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router";
import { NonHomeHeader } from "@/components";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { useEventListeners, useGetOrderById } from "@/hooks";
import { Buy } from "./buy";
import { HelpDrawer } from "./help-drawer";
import { Pay } from "./pay";
import { Sell } from "./sell";

export function Order() {
  const { t } = useTranslation();
  const { id: orderId } = useParams();
  const [showHelpDrawer, setShowHelpDrawer] = useState(false);

  // listen to order events
  useEventListeners(orderId);

  const { order, isOrderPending, isOrderError, orderError } = useGetOrderById(
    Number(orderId),
  );

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
        <main className="no-scrollbar container-narrow flex h-full w-full flex-col items-center justify-center gap-2 overflow-y-auto py-8">
          <p className="text-center text-destructive text-lg">
            {orderError.message}
          </p>
          <p className="text-center text-muted-foreground text-sm">
            {t("ORDER_ERROR_DESCRIPTION")}
          </p>
          <ScrollArea className="w-full rounded-md border border-destructive bg-destructive/20 p-4">
            <p className="text-muted-foreground text-sm">
              {JSON.stringify(orderError.cause, null, 2)}
            </p>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
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
