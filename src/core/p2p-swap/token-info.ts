import { z } from "zod";

const StatsSchema = z.object({
  priceChange: z.number(),
  holderChange: z.number(),
  liquidityChange: z.number(),
  volumeChange: z.number(),
  buyVolume: z.number(),
  sellVolume: z.number(),
  buyOrganicVolume: z.number().optional(),
  sellOrganicVolume: z.number().optional(),
  numBuys: z.number(),
  numSells: z.number(),
  numTraders: z.number(),
  numNetBuyers: z.number(),
});

const AuditSchema = z.object({
  freezeAuthorityDisabled: z.boolean(),
  topHoldersPercentage: z.number(),
  devBalancePercentage: z.number(),
  devMigrations: z.number(),
  devMints: z.number(),
});

const PoolRefSchema = z.object({
  id: z.string(),
  createdAt: z.string(),
});

const TokenInfoSchema = z.object({
  mint: z.string(),
  name: z.string(),
  symbol: z.string(),
  decimals: z.number(),
  icon: z.string().nullable(),
  links: z.object({
    twitter: z.string().nullable(),
    discord: z.string().nullable(),
    website: z.string().nullable(),
  }),
  supply: z.object({
    circulating: z.number(),
    total: z.number(),
    holders: z.number(),
  }),
  market: z.object({
    usdPrice: z.number(),
    marketCap: z.number(),
    fdv: z.number(),
    liquidity: z.number(),
    priceBlockId: z.number(),
  }),
  authority: z.object({
    mint: z.string().nullable(),
    freezeDisabled: z.boolean(),
    tokenProgram: z.string(),
  }),
  launchpad: z.object({
    name: z.string().nullable(),
    graduatedPool: z.string().nullable(),
    graduatedAt: z.string().nullable(),
    firstPool: PoolRefSchema.nullable(),
  }),
  audit: AuditSchema.nullable(),
  trust: z.object({
    organicScore: z.number(),
    organicScoreLabel: z.string(),
    isVerified: z.boolean(),
    tags: z.array(z.string()),
  }),
  stats: z.object({
    h6: StatsSchema.nullable(),
    h24: StatsSchema.nullable(),
  }),
  timestamps: z.object({
    createdAt: z.string(),
    updatedAt: z.string(),
  }),
});

const TokenInfoResponseSchema = z.object({
  status: z.literal("ok"),
  data: TokenInfoSchema,
});

export type P2PTokenInfo = z.infer<typeof TokenInfoSchema>;
export type P2PTokenStats = z.infer<typeof StatsSchema>;

export async function fetchP2PTokenInfo(): Promise<P2PTokenInfo> {
  if (!import.meta.env.VITE_P2P_SWAP_URL) throw new Error("VITE_P2P_SWAP_URL is not configured");
  const res = await fetch(`${import.meta.env.VITE_P2P_SWAP_URL}/api/token/p2p`);
  const contentType = res.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) {
    throw new Error(
      `Expected JSON but got ${contentType || "unknown"} — check VITE_P2P_SWAP_URL`,
    );
  }
  const json = await res.json();
  if (!res.ok) {
    throw new Error(json?.message ?? `Request failed: ${res.status}`);
  }
  return TokenInfoResponseSchema.parse(json).data;
}
