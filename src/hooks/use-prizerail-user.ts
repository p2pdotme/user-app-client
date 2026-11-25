import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import {
  fetchUserDrawings,
  fetchUserPrizeSummary,
  fetchUserPublicityLinks,
  type PublicityLink,
  type PublicityRequest,
  type UserDrawingsPage,
  type UserPrizeSummary,
  winnerLinkMessage,
} from "@/core/prizerail/user-api";
import { getPrizerailUserApiUrl } from "@/lib/prizerail";
import { useThirdweb } from "./use-thirdweb";

const SUMMARY_STALE_MS = 30_000;
const SUMMARY_REFETCH_MS = 60_000;
const HISTORY_STALE_MS = 5 * 60_000;
const HISTORY_PAGE_SIZE = 10;
// Prizerail clears a link once the publicity is approved, so links are
// re-read about as often as the summary that says one is needed.
const PUBLICITY_STALE_MS = 60_000;
const HOME_PUBLICITY_STALE_MS = 5 * 60_000;

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
 * Whether the wallet has a win to share before its prize is released, for
 * the homescreen. Reads the same summary as the draws page but without
 * polling, so the homescreen costs the API one call every few minutes.
 */
export function usePrizerailPublicityRequests(enabled: boolean) {
  const { account } = useThirdweb();
  const wallet = account?.address;
  const baseUrl = getPrizerailUserApiUrl();

  return useQuery<UserPrizeSummary, Error, PublicityRequest[]>({
    queryKey: ["prizerail", "user", "summary", baseUrl, wallet],
    enabled: enabled && !!baseUrl && !!wallet,
    queryFn: () => {
      if (!baseUrl || !wallet) throw new Error("prizerail user api disabled");
      return fetchUserPrizeSummary(wallet, { baseUrl });
    },
    select: (summary) => summary.publicityRequests,
    staleTime: HOME_PUBLICITY_STALE_MS,
    refetchOnWindowFocus: false,
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

/**
 * The winner's own Prizerail links for the wins it still has to share. The
 * API only gives them to the wallet itself, so the wallet signs a short
 * dated message first (silent for the in-app wallet). Off until `enabled`:
 * pass whether the summary lists a publicity request, so a wallet with
 * nothing to share is never asked to sign.
 */
export function usePrizerailPublicityLinks(enabled: boolean) {
  const { account } = useThirdweb();
  const wallet = account?.address;
  const baseUrl = getPrizerailUserApiUrl();

  return useQuery<PublicityLink[]>({
    queryKey: ["prizerail", "user", "publicity", baseUrl, wallet],
    enabled: enabled && !!baseUrl && !!account,
    queryFn: async () => {
      if (!baseUrl || !account) throw new Error("prizerail user api disabled");
      const signedAt = new Date().toISOString();
      const signature = await account.signMessage({
        message: winnerLinkMessage(account.address, signedAt),
      });
      return fetchUserPublicityLinks(
        account.address,
        { signature, signedAt },
        { baseUrl },
      );
    },
    staleTime: PUBLICITY_STALE_MS,
    // The link stays in memory only; it is never written to storage.
    gcTime: PUBLICITY_STALE_MS,
    refetchOnWindowFocus: false,
    retry: 1,
  });
}
