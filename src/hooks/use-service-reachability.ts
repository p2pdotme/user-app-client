import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { viemPublicClient } from "@/core/adapters/thirdweb/client";

/**
 * Live connectivity check for the services the app depends on, used by the
 * sidebar "Connection status" indicator and drawer.
 *
 * - internet:   the device reports being online
 * - app:        the P2P.me app host answers (catches ISP/DNS blocking, the
 *               case the drawer's VPN/DNS tips are for). robots.txt is used
 *               because the service worker does not precache it, so a cached
 *               copy can't make a blocked host look reachable.
 * - blockchain: the Base RPC that every contract read/write goes through
 * - orders:     the subgraph that serves order history and routing
 */

export type ServiceId = "app" | "blockchain" | "orders";
export type ServiceState = "ok" | "down";
export type ConnectionOverall =
  | "checking"
  | "connected"
  | "degraded"
  | "offline";

export interface ServiceReachability {
  app: ServiceState;
  blockchain: ServiceState;
  orders: ServiceState;
}

const CHECK_TIMEOUT_MS = 8_000;
const RECHECK_INTERVAL_MS = 30_000;

function withTimeout<T>(
  promise: Promise<T>,
  ms = CHECK_TIMEOUT_MS,
): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const id = setTimeout(() => reject(new Error("timeout")), ms);
    promise.then(
      (value) => {
        clearTimeout(id);
        resolve(value);
      },
      (error) => {
        clearTimeout(id);
        reject(error);
      },
    );
  });
}

async function check(run: () => Promise<boolean>): Promise<ServiceState> {
  try {
    return (await withTimeout(run())) ? "ok" : "down";
  } catch {
    return "down";
  }
}

export async function checkAppHost(fetchImpl: typeof fetch = fetch) {
  return check(async () => {
    const response = await fetchImpl(
      `${window.location.origin}/robots.txt?reachability=${Date.now()}`,
      { cache: "no-store", method: "GET" },
    );
    return response.ok;
  });
}

export async function checkBlockchain(
  getBlockNumber: () => Promise<bigint> = () =>
    viemPublicClient.getBlockNumber(),
) {
  return check(async () => (await getBlockNumber()) > 0n);
}

export async function checkOrders(
  url: string | undefined = import.meta.env.VITE_SUBGRAPH_URL,
  fetchImpl: typeof fetch = fetch,
) {
  if (!url) return "down" as const;
  return check(async () => {
    const response = await fetchImpl(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: "{ _meta { block { number } } }" }),
      cache: "no-store",
    });
    if (!response.ok) return false;
    const body = (await response.json()) as {
      data?: { _meta?: { block?: { number?: number } } };
    };
    return typeof body.data?._meta?.block?.number === "number";
  });
}

export function summarizeReachability(
  isOnline: boolean,
  services: ServiceReachability | undefined,
): ConnectionOverall {
  if (!isOnline) return "offline";
  if (!services) return "checking";
  return Object.values(services).every((state) => state === "ok")
    ? "connected"
    : "degraded";
}

function useIsOnline() {
  const [isOnline, setIsOnline] = useState(() =>
    typeof navigator === "undefined" ? true : navigator.onLine,
  );
  useEffect(() => {
    const update = () => setIsOnline(navigator.onLine);
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);
  return isOnline;
}

/**
 * Runs the checks while a component using it is mounted (the sidebar sheet
 * only mounts while open), re-checking every 30 s and when the device comes
 * back online.
 */
export function useServiceReachability() {
  const isOnline = useIsOnline();
  const query = useQuery({
    queryKey: ["service-reachability"],
    queryFn: async (): Promise<ServiceReachability> => {
      const [app, blockchain, orders] = await Promise.all([
        checkAppHost(),
        checkBlockchain(),
        checkOrders(),
      ]);
      return { app, blockchain, orders };
    },
    enabled: isOnline,
    staleTime: 15_000,
    refetchInterval: RECHECK_INTERVAL_MS,
    retry: false,
  });

  return {
    isOnline,
    services: isOnline ? query.data : undefined,
    overall: summarizeReachability(isOnline, query.data),
    isChecking: query.isFetching,
    recheck: () => query.refetch(),
  };
}
