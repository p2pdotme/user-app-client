import { useQuery } from "@tanstack/react-query";
import {
  type CampaignDetails,
  fetchCampaignDetails,
} from "@/core/prizerail/user-api";
import { getPrizerailUserApiUrl } from "@/lib/prizerail";

// The prize table and cadence change rarely; the totals move once per draw.
const STALE_MS = 5 * 60_000;
const REFETCH_MS = 10 * 60_000;

/**
 * Campaign-wide facts from the Prizerail user API: winners per draw, prize
 * tiers with their odds, draw cadence and prizes paid so far. Disabled until
 * VITE_PRIZERAIL_USER_API_URL is set; needs no wallet.
 */
export function usePrizerailCampaignDetails() {
  const baseUrl = getPrizerailUserApiUrl();

  return useQuery<CampaignDetails>({
    queryKey: ["prizerail", "campaign", "details", baseUrl],
    enabled: !!baseUrl,
    queryFn: () => {
      if (!baseUrl) throw new Error("prizerail user api disabled");
      return fetchCampaignDetails({ baseUrl });
    },
    staleTime: STALE_MS,
    refetchInterval: REFETCH_MS,
    retry: 1,
  });
}
