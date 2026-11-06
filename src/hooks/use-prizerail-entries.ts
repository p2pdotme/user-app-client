import { useQuery } from "@tanstack/react-query";
import type { Address } from "thirdweb";
import type {
  OrdersCollectionWithDateFilterQueryParams,
  SubgraphOrder,
} from "@/core/p2pdotme/shared";
import { getOrdersCollectionWithDateFilter } from "@/core/p2pdotme/subgraph";
import {
  type DrawWindow,
  estimateDrawEntries,
  getPrizerailCampaignSlug,
} from "@/lib/prizerail";
import { usePrizerailDraws } from "./use-prizerail-draws";
import { useThirdweb } from "./use-thirdweb";

const PAGE_SIZE = 1000;
// One user's orders in a single draw window never approach this; it only
// bounds the loop if the subgraph misbehaves.
const MAX_PAGES = 3;
const STALE_MS = 30_000;

export interface PrizerailEntriesSummary {
  entries: number;
  hasEntries: boolean;
  displayEntries: string;
  window: DrawWindow;
}

async function fetchOrdersInWindow(
  userAddress: Address,
  window: DrawWindow,
): Promise<SubgraphOrder[]> {
  const orders: SubgraphOrder[] = [];
  for (let page = 0; page < MAX_PAGES; page++) {
    const params: OrdersCollectionWithDateFilterQueryParams = {
      userAddress,
      first: PAGE_SIZE,
      skip: page * PAGE_SIZE,
      orderBy: "placedAt",
      orderDirection: "desc",
      placedAtGte: window.startSec,
      // The subgraph filter is inclusive; estimateDrawEntries applies the
      // exclusive end.
      placedAtLte: window.endSec,
    };
    const result = await getOrdersCollectionWithDateFilter(params);
    if (result.isErr()) throw result.error;
    orders.push(...result.value);
    if (result.value.length < PAGE_SIZE) break;
    if (page === MAX_PAGES - 1) {
      console.warn(
        `[usePrizerailEntries] more than ${MAX_PAGES * PAGE_SIZE} orders in the draw window; estimate is truncated`,
      );
    }
  }
  return orders;
}

/**
 * Estimated entries the signed-in user holds in the next Prizerail draw,
 * derived client-side from their completed BUY/SELL orders inside the
 * current draw window. The authoritative count lives with Prizerail (keyed
 * by a pseudonymous entrant id only the backend can derive), so this is a
 * best-effort mirror for the rewards tile, not a ledger.
 *
 * Only runs while a draw is open. With no open draw (campaign paused or
 * between cutoff and draw) there is nothing to be entered in, and the
 * fallback window would end at "now", churning the query key on every
 * feed refetch. The window itself is keyed by the two cutoffs, which are
 * stable for the life of a draw.
 */
export function usePrizerailEntries() {
  const { account } = useThirdweb();
  const userAddress = account?.address as Address | undefined;
  const slug = getPrizerailCampaignSlug();
  const draws = usePrizerailDraws();
  const window = draws.data?.nextDraw ? draws.data.window : undefined;

  return useQuery<PrizerailEntriesSummary>({
    queryKey: [
      "prizerail",
      "entries",
      slug,
      userAddress,
      window?.startSec,
      window?.endSec,
    ],
    enabled: !!slug && !!userAddress && !!window,
    queryFn: async () => {
      if (!userAddress || !window) {
        return {
          entries: 0,
          hasEntries: false,
          displayEntries: "0",
          window: { startSec: 0, endSec: 0 },
        };
      }
      const orders = await fetchOrdersInWindow(userAddress, window);
      const entries = estimateDrawEntries(orders, window);
      return {
        entries,
        hasEntries: entries > 0,
        // "~" marks the figure as an estimate (see estimateDrawEntries).
        displayEntries: `~${entries.toLocaleString()}`,
        window,
      };
    },
    staleTime: STALE_MS,
  });
}
