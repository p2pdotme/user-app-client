import { useQuery } from "@tanstack/react-query";
import {
  type CampaignDraws,
  fetchCampaignDraws,
  type PublicDraw,
} from "@/core/prizerail/public";
import {
  type DrawWindow,
  getPrizerailCampaignSlug,
  getPrizerailPublicBaseUrl,
  selectDrawWindow,
} from "@/lib/prizerail";

const STALE_MS = 60_000;
const REFETCH_MS = 5 * 60_000;

export interface PrizerailDrawsSummary {
  campaign: CampaignDraws["campaign"];
  draws: PublicDraw[];
  /** The draw currently taking entries, or null when none is open. */
  nextDraw: PublicDraw | null;
  /** Orders placed inside this window feed `nextDraw`. */
  window: DrawWindow;
}

/**
 * Public draw feed for the configured campaign. No API key: the feed is
 * open and CORS-enabled by Prizerail. Disabled when
 * VITE_PRIZERAIL_CAMPAIGN_SLUG is unset, so the draw UI simply does not
 * render on deploys without the programme.
 */
export function usePrizerailDraws() {
  const slug = getPrizerailCampaignSlug();
  const baseUrl = getPrizerailPublicBaseUrl();

  return useQuery<PrizerailDrawsSummary>({
    queryKey: ["prizerail", "draws", baseUrl, slug],
    enabled: !!slug,
    queryFn: async () => {
      if (!slug) throw new Error("prizerail campaign slug not configured");
      const { campaign, draws } = await fetchCampaignDraws(slug, { baseUrl });
      const { nextDraw, startSec, endSec } = selectDrawWindow(draws);
      return { campaign, draws, nextDraw, window: { startSec, endSec } };
    },
    staleTime: STALE_MS,
    refetchInterval: REFETCH_MS,
    retry: 1,
  });
}
