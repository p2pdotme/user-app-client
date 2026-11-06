import { z } from "zod";

// Prizerail's public, unauthenticated draw feed (CORS open):
//   GET {base}/campaigns/{slug}/draws.json?limit=N
// Documented at https://docs.prizerail.com/verification/public-endpoints.
// Parsed leniently on purpose: the feed is only read for display, so an
// unexpected field must never blank the card. Each draw is validated on its
// own and a malformed one is dropped rather than failing the whole page.

// The feed is newest-first and lists EVERY scheduled open draw (an hourly
// campaign publishes ~48 ahead). A small page would hold only the furthest
// draws and miss the one taking entries now, so ask for the feed maximum.
const DEFAULT_LIMIT = 100;
const REQUEST_TIMEOUT_MS = 10_000;

/** Public stage names (the partner API calls these `status`). */
export type PublicDrawStage =
  | "open"
  | "locked"
  | "drawing"
  | "drawn"
  | "paid"
  | "skipped";

export interface PublicDraw {
  id: string;
  number: number | null;
  drawAt: string;
  cutoffAt: string | null;
  stage: PublicDrawStage | string;
  winnersCount: number | null;
  entrantCount: number | null;
  totalEntries: number | null;
  proofUrl: string | null;
}

export interface PublicCampaign {
  name: string | null;
  status: string | null;
  cadence: string | null;
  timezone: string | null;
  winnersPerDraw: number | null;
}

export interface CampaignDraws {
  campaign: PublicCampaign;
  /** Newest first, as served. */
  draws: PublicDraw[];
}

const nullableNumber = z.number().nullable().optional();
const nullableString = z.string().nullable().optional();

const rawDrawSchema = z
  .object({
    id: z.union([z.string(), z.number()]).transform(String),
    number: nullableNumber,
    drawAt: z.string(),
    cutoffAt: nullableString,
    stage: z.string().default("open"),
    // draws.json documents `winners` as a count; accept an array too.
    winners: z
      .union([z.number(), z.array(z.unknown())])
      .nullable()
      .optional(),
    entrants: z
      .object({
        count: nullableNumber,
        totalWeight: nullableNumber,
      })
      .passthrough()
      .nullable()
      .optional(),
    proof: nullableString,
  })
  .passthrough();

const rawCampaignSchema = z
  .object({
    name: nullableString,
    status: nullableString,
    cadence: nullableString,
    timezone: nullableString,
    winnersPerDraw: nullableNumber,
  })
  .passthrough();

const envelopeSchema = z
  .object({
    campaign: rawCampaignSchema.nullable().optional(),
    draws: z.array(z.unknown()).optional(),
    drawings: z.array(z.unknown()).optional(),
  })
  .passthrough();

function toPublicDraw(raw: z.infer<typeof rawDrawSchema>): PublicDraw {
  const winnersCount = Array.isArray(raw.winners)
    ? raw.winners.length
    : (raw.winners ?? null);
  return {
    id: raw.id,
    number: raw.number ?? null,
    drawAt: raw.drawAt,
    cutoffAt: raw.cutoffAt ?? null,
    stage: raw.stage,
    winnersCount,
    entrantCount: raw.entrants?.count ?? null,
    totalEntries: raw.entrants?.totalWeight ?? null,
    proofUrl: raw.proof ?? null,
  };
}

function toPublicCampaign(
  raw: z.infer<typeof rawCampaignSchema> | null | undefined,
): PublicCampaign {
  return {
    name: raw?.name ?? null,
    status: raw?.status ?? null,
    cadence: raw?.cadence ?? null,
    timezone: raw?.timezone ?? null,
    winnersPerDraw: raw?.winnersPerDraw ?? null,
  };
}

export interface FetchCampaignDrawsOptions {
  /** Feed host for the chain's site — see PRIZERAIL_SITE_BY_CHAIN. */
  baseUrl: string;
  limit?: number;
  fetchImpl?: typeof fetch;
}

export async function fetchCampaignDraws(
  slug: string,
  options: FetchCampaignDrawsOptions,
): Promise<CampaignDraws> {
  const base = options.baseUrl.replace(/\/+$/, "");
  const limit = options.limit ?? DEFAULT_LIMIT;
  const fetchImpl = options.fetchImpl ?? fetch;
  const url = `${base}/campaigns/${encodeURIComponent(slug)}/draws.json?limit=${limit}`;

  // Manual controller rather than AbortSignal.timeout: the PWA still has
  // to run on Safari < 16, where the static helper does not exist.
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  let res: Response;
  try {
    res = await fetchImpl(url, {
      headers: { Accept: "application/json" },
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timer);
  }
  if (!res.ok) {
    throw new Error(`prizerail draws feed: HTTP ${res.status}`);
  }

  const envelope = envelopeSchema.safeParse(await res.json());
  const rawDraws = envelope.success
    ? (envelope.data.draws ?? envelope.data.drawings)
    : undefined;
  if (!rawDraws) {
    throw new Error("prizerail draws feed: no draws array in response");
  }

  const draws = rawDraws.flatMap((raw) => {
    const parsed = rawDrawSchema.safeParse(raw);
    return parsed.success ? [toPublicDraw(parsed.data)] : [];
  });

  return {
    campaign: toPublicCampaign(
      envelope.success ? envelope.data.campaign : null,
    ),
    draws,
  };
}
