import { ABIS, CONTRACT_ADDRESSES } from "@p2pdotme";
import { useQuery } from "@tanstack/react-query";
import { decodeEventLog, parseUnits } from "viem";
import { viemPublicClient } from "@/core/adapters/thirdweb";

export function useCancelledTimestamp(orderId: number) {
  return useQuery({
    queryKey: ["order", "cancelledTimestamp", orderId],
    enabled: orderId !== undefined,
    staleTime: Infinity,
    queryFn: async () => {
      const events = await viemPublicClient.getContractEvents({
        address: CONTRACT_ADDRESSES.DIAMOND,
        abi: ABIS.DIAMOND,
        eventName: "CancelledOrders",
        args: { orderId: BigInt(orderId) },
        fromBlock: 0n,
        toBlock: "latest",
      });

      if (events.length === 0) return undefined;

      const latestEvent = events[events.length - 1];
      if (!latestEvent?.blockHash) return undefined;

      const block = await viemPublicClient.getBlock({
        blockHash: latestEvent.blockHash,
      });

      return Number(block.timestamp);
    },
  });
}

export function useAcceptedTimestamp(orderId: number) {
  return useQuery({
    queryKey: ["order", "acceptedTimestamp", orderId],
    enabled: orderId !== undefined,
    staleTime: Infinity,
    queryFn: async () => {
      const events = await viemPublicClient.getContractEvents({
        address: CONTRACT_ADDRESSES.DIAMOND,
        abi: ABIS.DIAMOND,
        eventName: "OrderAccepted",
        args: { orderId: BigInt(orderId) },
        fromBlock: 0n,
        toBlock: "latest",
      });

      if (events.length === 0) return undefined;

      const latestEvent = events[events.length - 1];
      if (!latestEvent?.blockHash) return undefined;

      const block = await viemPublicClient.getBlock({
        blockHash: latestEvent.blockHash,
      });

      return Number(block.timestamp);
    },
  });
}

export function useUsdcTransferTxHash(params: {
  orderId: number;
  recipientAddr: string;
  amount: string; // human-readable USDC amount (6 decimals)
}) {
  const { orderId, recipientAddr, amount } = params;

  return useQuery({
    queryKey: ["order", "usdcTransferTxHash", orderId],
    enabled: orderId !== undefined && !!recipientAddr && !!amount,
    staleTime: Infinity,
    queryFn: async () => {
      // 1) Find OrderCompleted tx for the order via contract event filtering
      const events = await viemPublicClient.getContractEvents({
        address: CONTRACT_ADDRESSES.DIAMOND,
        abi: ABIS.DIAMOND,
        eventName: "OrderCompleted",
        args: { orderId: BigInt(orderId) },
        fromBlock: 0n,
        toBlock: "latest",
      });

      if (events.length === 0) return undefined;

      const latest = events[events.length - 1];
      if (!latest?.transactionHash) return undefined;

      // 2) Inspect the transaction receipt for a USDC Transfer to recipient
      const receipt = await viemPublicClient.getTransactionReceipt({
        hash: latest.transactionHash,
      });

      const expectedValue = parseUnits(amount, 6);

      for (const log of receipt.logs) {
        if (log.address.toLowerCase() !== CONTRACT_ADDRESSES.USDC.toLowerCase())
          continue;
        try {
          const decoded = decodeEventLog({
            abi: ABIS.EXTERNAL.USDC,
            eventName: "Transfer",
            data: log.data,
            topics: log.topics,
          });

          const { to, value } = decoded.args as unknown as {
            from: `0x${string}`;
            to: `0x${string}`;
            value: bigint;
          };

          if (
            to?.toLowerCase() === recipientAddr.toLowerCase() &&
            value === expectedValue
          ) {
            return receipt.transactionHash;
          }
        } catch {}
      }

      // Fallback: if USDC transfer log not found, do not return a misleading hash
      return undefined;
    },
  });
}
