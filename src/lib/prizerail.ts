import type { SubgraphOrder } from "@/core/p2pdotme/shared";
import type { PublicDraw } from "@/core/prizerail/public";
import type { CurrencyType } from "@/lib/constants";

const DAY_SECONDS = 24 * 60 * 60;

// One Prizerail site per chain, in step with the executor's PRIZERAIL_SITES:
// Base mainnet reads the production campaign, Base Sepolia the sandbox one.
// VITE_PRIZERAIL_CAMPAIGN_SLUG / VITE_PRIZERAIL_PUBLIC_URL override either
// for a one-off; a slug of "off" hides every draw card and tile.
export const PRIZERAIL_SITE_BY_CHAIN: Readonly<
  Record<string, { publicUrl: string; campaignSlug: string }>
> = {
  base: { publicUrl: "https://www.prizerail.com", campaignSlug: "p2p-ramp" },
  baseSepolia: {
    publicUrl: "https://sandbox.prizerail.com",
    campaignSlug: "p2pme-p2pdotme-orders",
  },
};
const PRIZERAIL_CAMPAIGN_OFF = "off";

function prizerailSite():
  | { publicUrl: string; campaignSlug: string }
  | undefined {
  return PRIZERAIL_SITE_BY_CHAIN[(import.meta.env.VITE_CHAIN ?? "").trim()];
}

/**
 * Prize-draw entry rate (in percent) per market. At the 2% default an order
 * earns one entry per whole USDC, so a $50 order earns 50 entries, in every
 * market except those excluded above. Mirrors the executor's rule.
 * This is a display-only mirror of the server-side rule; keep the two in
 * sync.
 */
export const DEFAULT_DRAW_ENTRY_PERCENT = 2;
// Every market earns the default except the three LotPot excluded: India,
// Venezuela (also on Prizerail's sanctions list) and Bolivia. Keep in step
// with the executor's DEFAULT_CASHBACK_BPS_BY_CURRENCY.
const DRAW_ENTRY_PERCENT_BY_CURRENCY: Partial<Record<CurrencyType, number>> = {
  INR: 0,
  VEN: 0,
  BOB: 0,
};

export function getDrawEntryPercent(currency?: CurrencyType): number {
  if (!currency) {
    return DEFAULT_DRAW_ENTRY_PERCENT;
  }
  return DRAW_ENTRY_PERCENT_BY_CURRENCY[currency] ?? DEFAULT_DRAW_ENTRY_PERCENT;
}

/**
 * Entries for one order: whole USDC × (percent / 2). At the 2% default a
 * $50 order earns 50 entries; a 1% market earns 25. Mirrors the executor's
 * `entriesForOrder`. Non-numeric or negative input yields 0.
 */
export function entriesForOrderUsdc(
  usdcAmount: string | number,
  percent: number,
): number {
  const usdc = Number(usdcAmount);
  if (!Number.isFinite(usdc) || usdc <= 0 || percent <= 0) {
    return 0;
  }
  // Work in whole cents so "12.345" does not float-drift under the floor.
  const cents = Math.round(usdc * 100);
  return Math.floor((cents * percent) / (DEFAULT_DRAW_ENTRY_PERCENT * 100));
}

export interface DrawWindow {
  /** Inclusive start, unix seconds. */
  startSec: number;
  /** Exclusive end, unix seconds. */
  endSec: number;
}

/**
 * Estimated entries the user holds in the draw whose window is given, from
 * the orders the subgraph returns. Mirrors the executor's eligibility: only
 * COMPLETED BUY/SELL orders count, PAY never does, and 0% markets earn
 * nothing. Two known sources of drift, which is why the UI shows the
 * number with a "~": the subgraph exposes placedAt but not completedAt,
 * so an order placed before a cutoff and completed after it is counted in
 * the earlier window although the executor enters it in the later draw;
 * and the subgraph does not flag B2B orders, which the executor skips.
 */
export function estimateDrawEntries(
  orders: readonly SubgraphOrder[],
  window: DrawWindow,
): number {
  return orders.reduce((total, order) => {
    if (order.status !== "COMPLETED") return total;
    if (order.type !== "BUY" && order.type !== "SELL") return total;
    const placedAt = Number(order.placedAt);
    if (!(placedAt >= window.startSec && placedAt < window.endSec)) {
      return total;
    }
    const percent = getDrawEntryPercent(order.currency as CurrencyType);
    return total + entriesForOrderUsdc(order.usdcAmount, percent);
  }, 0);
}

export interface DrawWindowSelection extends DrawWindow {
  nextDraw: PublicDraw | null;
}

function toSec(iso: string | null | undefined): number | null {
  if (!iso) return null;
  const ms = Date.parse(iso);
  return Number.isFinite(ms) ? Math.floor(ms / 1000) : null;
}

/**
 * From the public draws feed (newest first), find the draw currently taking
 * entries and the window of orders that feed it: from the previous draw's
 * cutoff to the next one's. The feed lists every scheduled open draw
 * (hourly campaigns publish ~48 of them), so a past draw is often outside
 * the page; then the window length is the spacing between the two soonest
 * open draws, which is the campaign cadence. Falls back to 24 hours only
 * when neither is available (a brand-new campaign) or no draw is open
 * (paused).
 */
export function selectDrawWindow(
  draws: readonly PublicDraw[],
  nowSec: number = Math.floor(Date.now() / 1000),
): DrawWindowSelection {
  const open = draws
    .filter((d) => d.stage === "open" && toSec(d.cutoffAt) !== null)
    .sort((a, b) => (toSec(a.cutoffAt) ?? 0) - (toSec(b.cutoffAt) ?? 0));
  const nextDraw = open[0] ?? null;
  const endSec = toSec(nextDraw?.cutoffAt) ?? nowSec;

  const previousCutoff = draws
    .filter((d) => d.stage !== "open")
    .map((d) => toSec(d.cutoffAt))
    .filter((sec): sec is number => sec !== null && sec < endSec)
    .sort((a, b) => b - a)[0];

  const secondCutoff = toSec(open[1]?.cutoffAt);
  const cadenceSec =
    nextDraw && secondCutoff !== null && secondCutoff > endSec
      ? secondCutoff - endSec
      : null;

  return {
    nextDraw,
    startSec: previousCutoff ?? endSec - (cadenceSec ?? DAY_SECONDS),
    endSec,
  };
}

/**
 * Campaign the app shows: the env override, else the chain's site, else
 * undefined (no draw UI) on chains with no Prizerail site, or when "off".
 */
export function getPrizerailCampaignSlug(): string | undefined {
  const slug = (import.meta.env.VITE_PRIZERAIL_CAMPAIGN_SLUG ?? "").trim();
  if (slug.toLowerCase() === PRIZERAIL_CAMPAIGN_OFF) return undefined;
  return slug || prizerailSite()?.campaignSlug;
}

export function getPrizerailPublicBaseUrl(): string {
  const raw = (import.meta.env.VITE_PRIZERAIL_PUBLIC_URL ?? "").trim();
  const url =
    raw || prizerailSite()?.publicUrl || PRIZERAIL_SITE_BY_CHAIN.base.publicUrl;
  return url.replace(/\/+$/, "");
}

/**
 * Base URL of the Prizerail user API, which answers per wallet with the real
 * entries and wins (Prizerail itself only knows hashed entrant ids). Unset
 * hides the PrizeRail Draws page and its link.
 */
export function getPrizerailUserApiUrl(): string | undefined {
  const raw = (import.meta.env.VITE_PRIZERAIL_USER_API_URL ?? "").trim();
  return raw ? raw.replace(/\/+$/, "") : undefined;
}

/** "$31.75" from 3175 — prizes are USD cents, paid in USDC. */
export function formatPrizeCents(cents: number): string {
  return `$${(cents / 100).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/**
 * Top prize advertised on the homescreen card, in USD cents ($100,000).
 * Fixed marketing copy, not read from the campaign's prize table.
 */
export const PRIZERAIL_HEADLINE_PRIZE_CENTS = 10_000_000;

/** The public campaign page users are sent to — odds, draws, proofs. */
export function getPrizerailCampaignUrl(slug: string): string {
  return `${getPrizerailPublicBaseUrl()}/campaigns/${encodeURIComponent(slug)}`;
}
