/**
 * Read-only proof-request status for a single order, for surfacing a small
 * "requested / uploaded" indicator in list views (e.g. the transactions list).
 *
 * Shares the same query cache key as RequestProofCard (`["proofRequest", orderId]`)
 * so opening the order detail reuses this fetch and vice-versa. Only runs for
 * proof-eligible orders (completed SELL/PAY) when the service is configured and a
 * wallet is connected — a no-op otherwise.
 */

import { useQuery } from "@tanstack/react-query";
import { useThirdweb } from "@/hooks/use-thirdweb";
import { createProofClientFor, isProofServiceConfigured } from "./client";

export type OrderProofStatus = "PENDING" | "FULFILLED" | "APPROVED" | null;

export function useOrderProofStatus(
  orderId: string,
  eligible: boolean,
): OrderProofStatus {
  const { account } = useThirdweb();
  const enabled = isProofServiceConfigured() && !!account && eligible;

  const { data } = useQuery({
    queryKey: ["proofRequest", orderId],
    enabled,
    retry: false,
    staleTime: 30_000,
    queryFn: async () => {
      const client = createProofClientFor(account!);
      const { request } = await client.getOrderProofRequests(orderId);
      return request;
    },
  });

  return data?.status ?? null;
}
