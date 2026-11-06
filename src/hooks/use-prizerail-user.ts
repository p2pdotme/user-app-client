import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import {
  fetchUserDrawings,
  fetchUserPrizeSummary,
  type UserDrawingsPage,
  type UserPrizeSummary,
} from "@/core/prizerail/user-api";
import { getPrizerailUserApiUrl } from "@/lib/prizerail";
import { useThirdweb } from "./use-thirdweb";

const SUMMARY_STALE_MS = 30_000;
const SUMMARY_REFETCH_MS = 60_000;
const HISTORY_STALE_MS = 5 * 60_000;
const HISTORY_PAGE_SIZE = 10;

/**
 * The signed-in wallet's standing in the open draw plus its win totals, from
 * the Prizerail user API. Unlike usePrizerailEntries (an estimate from the
 * subgraph), these are the entries Prizerail actually holds. Disabled until
 * the wallet is known and VITE_PRIZERAIL_USER_API_URL is set.
 */
export function usePrizerailUserSummary() {
  const { account } = useThirdweb();
  const wallet = account?.address;
  const baseUrl = getPrizerailUserApiUrl();

  return useQuery<UserPrizeSummary>({
    queryKey: ["prizerail", "user", "summary", baseUrl, wallet],
    enabled: !!baseUrl && !!wallet,
    queryFn: () => {
      if (!baseUrl || !wallet) throw new Error("prizerail user api disabled");
      return fetchUserPrizeSummary(wallet, { baseUrl });
    },
    staleTime: SUMMARY_STALE_MS,
    refetchInterval: SUMMARY_REFETCH_MS,
    retry: 1,
  });
}

/**
 * Past draws the wallet entered, newest first, a page at a time. Closed
 * draws never change, so pages are kept fresh for a long while. A page can
 * come back short (the API reads a bounded number of draws per call), so the
 * cursor, not the page size, decides whether there is more.
 */
export function usePrizerailUserDrawings() {
  const { account } = useThirdweb();
  const wallet = account?.address;
  const baseUrl = getPrizerailUserApiUrl();

  return useInfiniteQuery<
    UserDrawingsPage,
    Error,
    { pages: UserDrawingsPage[] },
    readonly unknown[],
    string | undefined
  >({
    queryKey: ["prizerail", "user", "drawings", baseUrl, wallet],
    enabled: !!baseUrl && !!wallet,
    initialPageParam: undefined,
    queryFn: ({ pageParam }) => {
      if (!baseUrl || !wallet) throw new Error("prizerail user api disabled");
      return fetchUserDrawings(
        wallet,
        { limit: HISTORY_PAGE_SIZE, before: pageParam, enteredOnly: true },
        { baseUrl },
      );
    },
    getNextPageParam: (last) => last.nextBefore ?? undefined,
    staleTime: HISTORY_STALE_MS,
    retry: 1,
  });
}
