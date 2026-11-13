import { defineChain as defineThirdwebChain } from "thirdweb/chains";
import { type Address, type Chain, defineChain } from "viem";
import { getPimlicoBundlerUrl } from "./config";

/** ERC-4337 v0.6 EntryPoint, at the same address on every supported network. */
export const ENTRY_POINT_ADDRESS: Address =
  "0x5ff137d4b0fdcd49dca30c7cf57e578a026d2789";

/**
 * P2P.me account factory. Deployed at the same address on every network (via
 * CREATE2), so a user's smart account address is identical everywhere.
 */
export const ACCOUNT_FACTORY_ADDRESS: Address =
  "0xdE320c2E2b4953883f61774c006f9057A55B97D1";

/** Address used to represent a network's native coin in token lists. */
export const NATIVE_TOKEN_ADDRESS: Address =
  "0x0000000000000000000000000000000000000000";

/** Default block span scanned for recent token transfers. */
export const DEFAULT_LOG_SCAN_BLOCKS = 500;

export type RecoveryNetworkKey =
  | "monad"
  | "bnb"
  | "avax"
  | "polygon"
  | "optimism"
  | "hyperliquid"
  | "ethereum"
  | "arbitrum"
  | "mantle"
  | "celo"
  | "zksync"
  | "robinhood"
  | "xlayer";

export type RecoveryTokenConfig = {
  address: Address;
  symbol: string;
  name: string;
  decimals: number;
};

export type RecoveryNetwork = {
  key: RecoveryNetworkKey;
  /** Short display name. */
  label: string;
  chain: Chain;
  thirdwebChain: ReturnType<typeof defineThirdwebChain>;
  /**
   * null when no ERC-4337 bundler supports the chain; UserOps are then sent to
   * the EntryPoint directly by the owner wallet.
   */
  bundlerUrl: string | null;
  entryPoint: Address;
  factoryAddress: Address;
  usdcAddress: Address;
  usdcDecimals: number;
  /** Tokens always listed for recovery alongside native and USDC. */
  extraTokens: readonly RecoveryTokenConfig[];
  /** Block span for the recent-transfer scan (some RPCs cap eth_getLogs). */
  logScanBlocks: number;
};

type NetworkSpec = {
  label: string;
  id: number;
  name: string;
  native: { name: string; symbol: string };
  rpc: string;
  explorer: { name: string; url: string };
  /** false when Pimlico has no bundler for the chain. */
  hasBundler: boolean;
  usdcAddress: Address;
  usdcDecimals?: number;
  extraTokens?: readonly RecoveryTokenConfig[];
  logScanBlocks?: number;
};

const ETHER = { name: "Ether", symbol: "ETH" };

const NETWORK_SPECS: Record<RecoveryNetworkKey, NetworkSpec> = {
  monad: {
    label: "Monad",
    id: 143,
    name: "Monad Mainnet",
    native: { name: "Monad", symbol: "MON" },
    rpc: "https://rpc3.monad.xyz",
    explorer: {
      name: "Monad Explorer",
      url: "https://mainnet-beta.monvision.io",
    },
    hasBundler: true,
    usdcAddress: "0x754704Bc059F8C67012fEd69BC8A327a5aafb603",
  },
  bnb: {
    label: "BNB Smart Chain",
    id: 56,
    name: "BNB Smart Chain",
    native: { name: "BNB", symbol: "BNB" },
    rpc: "https://1rpc.io/bnb",
    explorer: { name: "BscScan", url: "https://bscscan.com" },
    hasBundler: true,
    usdcAddress: "0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d",
    usdcDecimals: 18,
  },
  avax: {
    label: "Avalanche",
    id: 43114,
    name: "Avalanche C-Chain",
    native: { name: "Avalanche", symbol: "AVAX" },
    rpc: "https://avax.api.pocket.network",
    explorer: { name: "SnowTrace", url: "https://snowtrace.io" },
    hasBundler: true,
    usdcAddress: "0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E",
  },
  polygon: {
    label: "Polygon",
    id: 137,
    name: "Polygon",
    native: { name: "MATIC", symbol: "MATIC" },
    rpc: "https://polygon.drpc.org",
    explorer: { name: "PolygonScan", url: "https://polygonscan.com" },
    hasBundler: true,
    usdcAddress: "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359",
  },
  optimism: {
    label: "Optimism",
    id: 10,
    name: "Optimism",
    native: ETHER,
    rpc: "https://mainnet.optimism.io",
    explorer: {
      name: "Optimism Explorer",
      url: "https://optimistic.etherscan.io",
    },
    hasBundler: true,
    usdcAddress: "0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85",
  },
  hyperliquid: {
    label: "HyperLiquid",
    id: 999,
    name: "HyperLiquid",
    native: { name: "HyperLiquid", symbol: "HYPE" },
    rpc: "https://hyperliquid.drpc.org",
    explorer: {
      name: "HyperLiquid Explorer",
      url: "https://explorer.hyperliquid.xyz",
    },
    hasBundler: true,
    usdcAddress: "0xb88339CB7199b77E23DB6E890353E22632Ba630f",
  },
  ethereum: {
    label: "Ethereum",
    id: 1,
    name: "Ethereum",
    native: ETHER,
    rpc: "https://eth.llamarpc.com",
    explorer: { name: "Etherscan", url: "https://etherscan.io" },
    hasBundler: true,
    usdcAddress: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
  },
  arbitrum: {
    label: "Arbitrum",
    id: 42161,
    name: "Arbitrum One",
    native: ETHER,
    rpc: "https://arb1.arbitrum.io/rpc",
    explorer: { name: "Arbiscan", url: "https://arbiscan.io" },
    hasBundler: true,
    usdcAddress: "0xaf88d065e77c8cC2239327C5EDb3A432268e5831",
  },
  mantle: {
    label: "Mantle",
    id: 5000,
    name: "Mantle",
    native: { name: "Mantle", symbol: "MNT" },
    rpc: "https://1rpc.io/mantle",
    explorer: { name: "Mantle Explorer", url: "https://explorer.mantle.xyz" },
    hasBundler: true,
    usdcAddress: "0x09Bc4E0D864854c6aFB6eB9A9cdF58aC190D0dF9",
  },
  celo: {
    label: "Celo",
    id: 42220,
    name: "Celo",
    native: { name: "Celo", symbol: "CELO" },
    rpc: "https://forno.celo.org",
    explorer: { name: "Celoscan", url: "https://celoscan.io" },
    hasBundler: true,
    usdcAddress: "0xcebA9300f2b948710d2653dD7B07f33A8B32118C",
    extraTokens: [
      {
        address: "0x48065fbBE25f71C9282ddf5e1cD6D6A887483D5e",
        symbol: "USDT",
        name: "Tether USD",
        decimals: 6,
      },
    ],
  },
  zksync: {
    label: "zkSync Era",
    id: 324,
    name: "zkSync Era",
    native: ETHER,
    rpc: "https://mainnet.era.zksync.io",
    explorer: { name: "zkSync Explorer", url: "https://explorer.zksync.io" },
    hasBundler: false, // Pimlico does not support zkSync Era
    usdcAddress: "0x1d17CBcF0D6D143135aE902365D2E5e2A16538D4",
  },
  robinhood: {
    label: "Robinhood Chain",
    id: 4663,
    name: "Robinhood Chain",
    native: ETHER,
    rpc: "https://rpc.mainnet.chain.robinhood.com",
    explorer: {
      name: "Robinhood Chain Explorer",
      url: "https://robinhoodchain.blockscout.com",
    },
    hasBundler: true,
    usdcAddress: "0x80e0e24718dbFcad49ECAA6F1e6C89A190586cA8",
    extraTokens: [
      {
        address: "0x5fc5360D0400a0Fd4f2af552ADD042D716F1d168",
        symbol: "USDG",
        name: "Global Dollar",
        decimals: 6,
      },
    ],
  },
  xlayer: {
    label: "X Layer",
    id: 196,
    name: "X Layer",
    native: { name: "OKB", symbol: "OKB" },
    rpc: "https://rpc.xlayer.tech",
    explorer: { name: "OKLink", url: "https://www.oklink.com/xlayer" },
    hasBundler: false, // Pimlico does not support X Layer
    // Native (Circle-issued) USDC
    usdcAddress: "0x74b7F16337b8972027F6196A17a631aC6dE26d22",
    // rpc.xlayer.tech rejects eth_getLogs ranges above 100 blocks
    logScanBlocks: 100,
    extraTokens: [
      {
        // Bridged USDC from Ethereum; reports its symbol as USDC on-chain
        address: "0xA8CE8aee21bC2A48a5EF670afCc9274C7bbbC035",
        symbol: "USDC.e",
        name: "Bridged USDC",
        decimals: 6,
      },
    ],
  },
};

function buildNetwork(
  key: RecoveryNetworkKey,
  spec: NetworkSpec,
): RecoveryNetwork {
  const nativeCurrency = { ...spec.native, decimals: 18 };
  return {
    key,
    label: spec.label,
    chain: defineChain({
      id: spec.id,
      name: spec.name,
      nativeCurrency,
      rpcUrls: { default: { http: [spec.rpc] } },
      blockExplorers: { default: spec.explorer },
      testnet: false,
    }),
    thirdwebChain: defineThirdwebChain({
      id: spec.id,
      name: spec.name,
      nativeCurrency,
      rpc: spec.rpc,
    }),
    bundlerUrl: spec.hasBundler ? getPimlicoBundlerUrl(spec.id) : null,
    entryPoint: ENTRY_POINT_ADDRESS,
    factoryAddress: ACCOUNT_FACTORY_ADDRESS,
    usdcAddress: spec.usdcAddress,
    usdcDecimals: spec.usdcDecimals ?? 6,
    extraTokens: spec.extraTokens ?? [],
    logScanBlocks: spec.logScanBlocks ?? DEFAULT_LOG_SCAN_BLOCKS,
  };
}

export const RECOVERY_NETWORKS = Object.fromEntries(
  (Object.keys(NETWORK_SPECS) as RecoveryNetworkKey[]).map((key) => [
    key,
    buildNetwork(key, NETWORK_SPECS[key]),
  ]),
) as Record<RecoveryNetworkKey, RecoveryNetwork>;

export const DEFAULT_RECOVERY_NETWORK: RecoveryNetworkKey = "monad";

/** Every supported network, sorted alphabetically by label. */
export const RECOVERY_NETWORK_LIST: readonly RecoveryNetwork[] = Object.values(
  RECOVERY_NETWORKS,
).sort((a, b) => a.label.localeCompare(b.label));

export function isRecoveryNetworkKey(
  value: unknown,
): value is RecoveryNetworkKey {
  return typeof value === "string" && Object.hasOwn(NETWORK_SPECS, value);
}

/** Block-explorer link for a transaction, or null if the chain has none. */
export function getExplorerTxUrl(
  key: RecoveryNetworkKey,
  txHash: string,
): string | null {
  const base = RECOVERY_NETWORKS[key].chain.blockExplorers?.default.url;
  return base ? `${base}/tx/${txHash}` : null;
}
