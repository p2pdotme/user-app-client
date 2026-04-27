import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { ABIS, CONTRACT_ADDRESSES } from "@/core";
import { viemWebsocketClient } from "@/core/adapters/thirdweb";
import { useSounds } from "@/hooks";

export function useEventListeners(orderId: string | undefined) {
  const queryClient = useQueryClient();
  const sounds = useSounds();

  // watch events
  useEffect(() => {
    if (!orderId) return;

    const bigIntOrderId = BigInt(orderId);
    const numericOrderId = Number(orderId);

    // Watch for OrderPlaced events using websocket transport
    const unwatchOrderPlaced = viemWebsocketClient.watchContractEvent({
      address: CONTRACT_ADDRESSES.DIAMOND,
      abi: ABIS.DIAMOND,
      eventName: "OrderPlaced",
      args: {
        orderId: bigIntOrderId,
      },
      onLogs: (logs) => {
        console.log("[useEventListeners] OrderPlaced event logs:", logs);
        queryClient.invalidateQueries({
          queryKey: ["order", "getOrderById", numericOrderId],
        });
      },
    });

    // Watch for OrderAccepted events using websocket transport
    const unwatchOrderAccepted = viemWebsocketClient.watchContractEvent({
      address: CONTRACT_ADDRESSES.DIAMOND,
      abi: ABIS.DIAMOND,
      eventName: "OrderAccepted",
      args: {
        orderId: bigIntOrderId,
      },
      onLogs: (logs) => {
        console.log("[useEventListeners] OrderAccepted event logs:", logs);
        queryClient.invalidateQueries({
          queryKey: ["order", "getOrderById", numericOrderId],
        });
      },
    });

    // Watch for OrderCompleted events using websocket transport
    const unwatchOrderCompleted = viemWebsocketClient.watchContractEvent({
      address: CONTRACT_ADDRESSES.DIAMOND,
      abi: ABIS.DIAMOND,
      eventName: "OrderCompleted",
      args: {
        orderId: BigInt(orderId),
      },
      onLogs: (logs) => {
        console.log("[useEventListeners] OrderCompleted event logs:", logs);
        sounds.triggerSuccessSound(); // Sound feedback for order completion
        queryClient.invalidateQueries({
          queryKey: ["order", "getOrderById", numericOrderId],
        });
      },
    });

    // Watch for OrderCancelled events using websocket transport
    const unwatchOrderCancelled = viemWebsocketClient.watchContractEvent({
      address: CONTRACT_ADDRESSES.DIAMOND,
      abi: ABIS.DIAMOND,
      eventName: "CancelledOrders",
      args: {
        orderId: bigIntOrderId,
      },
      onLogs: (logs) => {
        console.log("[useEventListeners] CancelledOrders event logs:", logs);
        sounds.triggerFailureSound(); // Sound feedback for order cancellation
        queryClient.invalidateQueries({
          queryKey: ["order", "getOrderById", numericOrderId],
        });
      },
    });

    // Cleanup function to unwatch events
    return () => {
      if (unwatchOrderPlaced) unwatchOrderPlaced();
      if (unwatchOrderAccepted) unwatchOrderAccepted();
      if (unwatchOrderCompleted) unwatchOrderCompleted();
      if (unwatchOrderCancelled) unwatchOrderCancelled();
    };
  }, [
    orderId,
    queryClient.invalidateQueries,
    sounds.triggerFailureSound,
    sounds.triggerSuccessSound,
  ]);
}
