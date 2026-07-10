import { useQueries, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useMemo, useState } from "react";
import { z } from "zod";
import {
  DEFAULT_SLIPPAGE_BPS,
  getQuote,
  getQuoteDeadline,
  getStatus,
  getTokens,
  isStellarOrigin,
  isTerminalStatus,
  ONECLICK_APP_FEE_BPS,
  ONECLICK_APP_FEE_RECIPIENT,
  type OneClickToken,
  type PendingBridge,
  type PendingBridges,
  type QuoteRequest,
  ZodPendingBridgesSchema,
} from "@/core/near-intents";
import {
  loadFromStorageWithMigrations,
  saveStrictToStorage,
} from "@/lib/storage-model";

// ---------------------------------------------------------------------------
// Tokens — GET /v0/tokens registry
// ---------------------------------------------------------------------------

/**
 * Loads the 1Click supported-asset registry (GET /v0/tokens) and
 * groups it by blockchain for the chain/token pickers.
 */
export function useOneClickTokens() {
  const query = useQuery({
    queryKey: ["oneclick", "tokens"],
    queryFn: getTokens,
    staleTime: 5 * 60 * 1000,
  });

  const tokensByChain = useMemo(() => {
    const map = new Map<string, OneClickToken[]>();
    for (const token of query.data ?? []) {
      const list = map.get(token.blockchain) ?? [];
      map.set(token.blockchain, [...list, token]);
    }
    return map;
  }, [query.data]);

  const chains = useMemo(
    () => [...tokensByChain.keys()].sort(),
    [tokensByChain],
  );

  return {
    tokens: query.data ?? [],
    tokensByChain,
    chains,
    isLoading: query.isLoading,
    error: query.error,
  };
}

// ---------------------------------------------------------------------------
// Quote — POST /v0/quote (dry preview)
// ---------------------------------------------------------------------------

export type QuoteParams = {
  originAsset: string;
  // Registry blockchain slug of the origin asset (e.g. "stellar", "base"), used
  // to pick the right depositMode. Optional — detection falls back to assetId.
  originBlockchain?: string;
  destinationAsset: string;
  amount: string; // origin-asset base units
  recipient: string;
  refundTo: string;
  slippageBps?: number;
};

export function buildQuoteRequest(
  params: QuoteParams,
  dry: boolean,
): QuoteRequest {
  return {
    dry,
    swapType: "EXACT_INPUT",
    slippageTolerance: params.slippageBps ?? DEFAULT_SLIPPAGE_BPS,
    originAsset: params.originAsset,
    depositType: "ORIGIN_CHAIN",
    // Stellar only accepts MEMO mode; all other origins keep the default SIMPLE.
    ...(isStellarOrigin(params.originAsset, params.originBlockchain)
      ? { depositMode: "MEMO" as const }
      : {}),
    destinationAsset: params.destinationAsset,
    amount: params.amount,
    recipient: params.recipient,
    recipientType: "DESTINATION_CHAIN",
    refundTo: params.refundTo,
    refundType: "ORIGIN_CHAIN",
    deadline: getQuoteDeadline(),
    ...(ONECLICK_APP_FEE_RECIPIENT
      ? {
          appFees: [
            { recipient: ONECLICK_APP_FEE_RECIPIENT, fee: ONECLICK_APP_FEE_BPS },
          ],
        }
      : {}),
  };
}

/**
 * Live dry-quote preview (no deposit address allocated), refreshed every 30s.
 */
export function useOneClickQuote(params: QuoteParams | null) {
  return useQuery({
    queryKey: ["oneclick", "quote", params],
    queryFn: () => getQuote(buildQuoteRequest(params as QuoteParams, true)),
    enabled:
      !!params &&
      params.amount !== "0" &&
      !!params.recipient &&
      !!params.refundTo,
    refetchInterval: 30_000,
    retry: false,
  });
}

// ---------------------------------------------------------------------------
// Pending bridges — localStorage persistence + status polling
// ---------------------------------------------------------------------------

function storageKey(address: string): string {
  return `oneclick-pending-bridges-${address.toLowerCase()}`;
}

function loadBridges(address: string): PendingBridges {
  return loadFromStorageWithMigrations<PendingBridges>({
    key: storageKey(address),
    schema: ZodPendingBridgesSchema,
    getDefault: () => ({}),
    prune: false, // open-ended record map
  }).unwrapOr({});
}

/**
 * Persists in-flight 1Click bridges to localStorage (keyed by the user's
 * thirdweb address) and resumes a status poll per non-terminal bridge, so
 * swaps survive a page refresh. Records are pruned on dismissal, not on
 * terminal status, so the user sees the final state after a refresh too.
 */
export function usePendingBridges(address: string | undefined) {
  const queryClient = useQueryClient();
  const [bridges, setBridges] = useState<PendingBridges>(() =>
    address ? loadBridges(address) : {},
  );
  const [loadedFor, setLoadedFor] = useState(address);

  // Reload when the wallet address changes (render-phase state sync)
  if (address !== loadedFor) {
    setLoadedFor(address);
    setBridges(address ? loadBridges(address) : {});
  }

  const persist = useCallback(
    (next: PendingBridges) => {
      setBridges(next);
      if (address) {
        saveStrictToStorage({
          key: storageKey(address),
          schema: ZodPendingBridgesSchema,
          value: next,
        });
      }
    },
    [address],
  );

  const addBridge = useCallback(
    (bridge: PendingBridge) => {
      persist({ ...bridges, [bridge.depositAddress]: bridge });
    },
    [bridges, persist],
  );

  const removeBridge = useCallback(
    (depositAddress: string) => {
      const { [depositAddress]: _removed, ...rest } = bridges;
      persist(rest);
    },
    [bridges, persist],
  );

  const bridgeList = useMemo(
    () => Object.values(bridges).sort((a, b) => b.createdAt - a.createdAt),
    [bridges],
  );

  // Poll status for every non-terminal bridge
  const statusQueries = useQueries({
    queries: bridgeList.map((bridge) => ({
      queryKey: ["oneclick", "status", bridge.depositAddress],
      queryFn: () => getStatus(bridge.depositAddress),
      refetchInterval: 5_000,
      enabled: !isTerminalStatus(bridge.status),
      retry: false,
    })),
  });

  // Sync latest polled statuses into the persisted records
  const staleEntries: { depositAddress: string; status: string }[] = [];
  statusQueries.forEach((query, index) => {
    const bridge = bridgeList[index];
    const status = query.data?.status;
    if (bridge && status && bridges[bridge.depositAddress]?.status !== status) {
      staleEntries.push({ depositAddress: bridge.depositAddress, status });
    }
  });
  if (staleEntries.length > 0) {
    const next: PendingBridges = { ...bridges };
    for (const entry of staleEntries) {
      const existing = next[entry.depositAddress];
      if (existing) {
        next[entry.depositAddress] = { ...existing, status: entry.status };
      }
    }
    persist(next);
    if (staleEntries.some((entry) => entry.status === "SUCCESS")) {
      // Refresh balances shown elsewhere in the app
      queryClient.invalidateQueries({ queryKey: ["usdc", "balance"] });
    }
  }

  const statusByAddress = new Map(
    statusQueries.flatMap((query, index) => {
      const depositAddress = bridgeList[index]?.depositAddress;
      return depositAddress && query.data
        ? [[depositAddress, query.data] as const]
        : [];
    }),
  );

  return { bridges: bridgeList, statusByAddress, addBridge, removeBridge };
}

// ---------------------------------------------------------------------------
// Token & chain icons
// ---------------------------------------------------------------------------

const ZodMarketsSchema = z.array(
  z.object({ id: z.string(), image: z.string() }),
);

// The 1Click registry has no icon URLs, but it has coingeckoId —
// one batched public CoinGecko call resolves all token images.
async function fetchIcons(ids: string[]): Promise<Map<string, string>> {
  const response = await fetch(
    `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&per_page=250&ids=${ids.join(",")}`,
  );
  if (!response.ok) throw new Error("Failed to load token icons");
  const parsed = ZodMarketsSchema.safeParse(await response.json());
  if (!parsed.success) throw new Error("Unexpected CoinGecko response");
  return new Map(parsed.data.map((coin) => [coin.id, coin.image]));
}


const TRUST_WALLET_CHAINS: Record<string, string> = {
  aptos: "aptos",
  arb: "arbitrum",
  avax: "avalanchec",
  base: "base",
  bch: "bitcoincash",
  bsc: "smartchain",
  btc: "bitcoin",
  cardano: "cardano",
  dash: "dash",
  doge: "doge",
  eth: "ethereum",
  ltc: "litecoin",
  monad: "monad",
  near: "near",
  op: "optimism",
  plasma: "plasma",
  pol: "polygon",
  scroll: "scroll",
  sol: "solana",
  stellar: "stellar",
  sui: "sui",
  ton: "ton",
  tron: "tron",
  xrp: "ripple",
  zec: "zcash",
};

// Fallback for chains Trust Wallet doesn't host yet:
const LLAMA_CHAIN_NAMES: Record<string, string> = {
  abs: "abstract",
  adi: "adi",
  aleo: "aleo",
  bera: "berachain",
  fogo: "fogo",
  gnosis: "gnosis",
  hypercore: "hyperliquid",
  movement: "movement",
  starknet: "starknet",
  xlayer: "x layer",
};

export function getChainIconUrl(blockchain: string): string | undefined {
  const trustWallet = TRUST_WALLET_CHAINS[blockchain];
  if (trustWallet) {
    return `https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/${trustWallet}/info/logo.png`;
  }
  const llama = LLAMA_CHAIN_NAMES[blockchain];
  return llama
    ? `https://icons.llamao.fi/icons/chains/rsz_${encodeURIComponent(llama)}`
    : undefined;
}

/** Resolves token icon URLs for the registry via one batched CoinGecko call. */
export function useTokenIcons(tokens: OneClickToken[]) {
  const ids = [
    ...new Set(
      tokens
        .map((token) => token.coingeckoId)
        .filter((id): id is string => !!id),
    ),
  ].sort();

  const { data: iconMap } = useQuery({
    queryKey: ["oneclick", "token-icons", ids],
    queryFn: () => fetchIcons(ids),
    enabled: ids.length > 0,
    staleTime: Number.POSITIVE_INFINITY,
    retry: 1,
  });

  const getTokenIconUrl = useCallback(
    (token: Pick<OneClickToken, "coingeckoId">): string | undefined =>
      token.coingeckoId ? iconMap?.get(token.coingeckoId) : undefined,
    [iconMap],
  );

  return { getTokenIconUrl };
}

// ---------------------------------------------------------------------------
// Chain name display
// ---------------------------------------------------------------------------


// 1Click blockchain slug → human-readable chain name. Unknown slugs fall back
// to a capitalised slug in getChainName().
const CHAIN_DISPLAY_NAMES: Record<string, string> = {
  abs: "Abstract",
  aleo: "Aleo",
  aptos: "Aptos",
  arb: "Arbitrum",
  avax: "Avalanche",
  base: "Base",
  bch: "Bitcoin Cash",
  bera: "Berachain",
  bsc: "BNB Smart Chain",
  btc: "Bitcoin",
  cardano: "Cardano",
  doge: "Dogecoin",
  eth: "Ethereum",
  fogo: "Fogo",
  gnosis: "Gnosis",
  hypercore: "Hyperliquid",
  ltc: "Litecoin",
  monad: "Monad",
  movement: "Movement",
  near: "NEAR",
  op: "Optimism",
  plasma: "Plasma",
  pol: "Polygon",
  scroll: "Scroll",
  sol: "Solana",
  stellar: "Stellar",
  sui: "Sui",
  ton: "TON",
  tron: "Tron",
  xlayer: "X Layer",
  xrp: "XRP Ledger",
  zec: "Zcash",
};

/** Full chain name for a 1Click blockchain slug (capitalised slug fallback). */
export function getChainName(blockchain: string): string {
  return (
    CHAIN_DISPLAY_NAMES[blockchain] ??
    blockchain.charAt(0).toUpperCase() + blockchain.slice(1)
  );
}
