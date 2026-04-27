import { arbitrum, bsc, mainnet, optimism, polygon } from "viem/chains";
import ASSETS from "@/assets";
import type { BridgeChain, BridgeToken } from "./types";

export const RANGO_API_KEY = import.meta.env.VITE_RANGO_API_KEY;
export const RANGO_REFERRER_CODE = import.meta.env.VITE_RANGO_REFERRER_CODE;
export const RANGO_REFERRER_ADDRESS =
  import.meta.env.VITE_RANGO_REFERRER_ADDRESS ?? null;
export const RANGO_REFERRER_FEE_PERCENT = 0.5;

if (!RANGO_API_KEY) {
  console.error("RANGO_API_KEY is not set in the environment variables");
}

export const RANGO_SOLANA_CHAINS = ["SOLANA"] as const;
export const RANGO_EVM_CHAINS = [
  "ETH",
  "POLYGON",
  "BSC",
  "ARBITRUM",
  "OPTIMISM",
  "HYPEREVM",
] as const;
export const RANGO_ALL_CHAINS = [
  ...RANGO_SOLANA_CHAINS,
  ...RANGO_EVM_CHAINS,
] as const;
export const RANGO_ALL_CHAINS_SET = new Set(RANGO_ALL_CHAINS);

export const NATIVE_TOKEN_SYMBOLS: { [chain: string]: string } = {
  SOLANA: "SOL",
  ETH: "ETH",
  POLYGON: "POL",
  BSC: "BNB",
  ARBITRUM: "ETH",
  OPTIMISM: "ETH",
  HYPEREVM: "HYPE",
};

export const CHAIN_TO_CHAINID_MAP = {
  SOLANA: "SOLANA",
  ETH: mainnet.id,
  POLYGON: polygon.id,
  BSC: bsc.id,
  ARBITRUM: arbitrum.id,
  OPTIMISM: optimism.id,
  HYPEREVM: 999,
};

export const OFFICIAL_RANGO_SUPPORT_CHANNELS = [
  {
    name: "Telegram",
    icon: ASSETS.ICONS.Telegram,
    url: "https://t.me/rangoexchange",
  },
  {
    name: "Discord",
    icon: ASSETS.ICONS.Discord,
    url: "https://discord.com/invite/q3EngGyTrZ",
  },
  {
    name: "Twitter",
    icon: ASSETS.ICONS.Twitter,
    url: "https://x.com/RangoExchange",
  },
];

export const BRIDGE_TOKEN_ADDRESSES = {
  SOLANA: {
    SOL: null,
    USDC: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
    USDT: "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB",
  },
  ETH: {
    ETH: null,
    USDC: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
    USDT: "0xdac17f958d2ee523a2206206994597c13d831ec7",
    DAI: "0x6b175474e89094c44da98b954eedeac495271d0f",
  },
  POLYGON: {
    POL: null,
    USDC: "0x3c499c542cef5e3811e1192ce70d8cc03d5c3359",
    USDT: "0xc2132d05d31c914a87c6611c10748aeb04b58e8f",
    DAI: "0x8f3cf7ad23cd3cadbd9735aff958023239c6a063",
  },
  BSC: {
    BNB: null,
    USDC: "0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d",
    USDT: "0x55d398326f99059fF775485246999027B3197955",
    DAI: "0x1af3f329e8be154074d8769d1ffa4ee058b1dbc3",
  },
  ARBITRUM: {
    ETH: null,
    USDC: "0xaf88d065e77c8cc2239327c5edb3a432268e5831",
    USDT: "0xfd086bc7cd5c481dcc9c85ebe478a1c0b69fcbb9",
    DAI: "0xda10009cbd5d07dd0cecc66161fc93d7c9000da1",
  },
  OPTIMISM: {
    ETH: null,
    USDC: "0x0b2c639c533813f4aa9d7837caf62653d097ff85",
    USDT: "0x94b008aa00579c1307b0ef2c499ad98a8ce58e58",
    DAI: "0xda10009cbd5d07dd0cecc66161fc93d7c9000da1",
  },
  HYPEREVM: {
    HYPE: null,
    USDC: "0xb88339cb7199b77e23db6e890353e22632ba630f",
    USDT: "0xb8ce59fc3717ada4c02eadf9682a9e934f625ebb",
  },
};

export const RANGO_SWAPPER_GROUPS = undefined;
export const RANGO_SWAPPER_GROUPS_EXCLUDE = false;
export const RANGO_SLIPPAGE = 2;

// Token logo URLs from CoinGecko
export const TOKEN_LOGOS = {
  BTC: "https://assets.coingecko.com/coins/images/1/small/bitcoin.png",
  ETH: "https://assets.coingecko.com/coins/images/279/small/ethereum.png",
  SOL: "https://assets.coingecko.com/coins/images/4128/small/solana.png",
  USDC: "https://assets.coingecko.com/coins/images/6319/small/USD_Coin_icon.png",
  USDT: "https://assets.coingecko.com/coins/images/325/small/Tether.png",
  DAI: "https://assets.coingecko.com/coins/images/9956/small/dai-multi-collateral-mcd.png",
  BNB: "https://assets.coingecko.com/coins/images/825/small/bnb-icon2_2x.png",
  POL: "https://assets.coingecko.com/coins/images/4713/small/polygon.png",
  HYPE: "https://assets.coingecko.com/coins/images/50882/small/hyperliquid.jpg",
};

// Chain logo URLs from CoinGecko
export const CHAIN_LOGOS = {
  SOLANA: "https://assets.coingecko.com/coins/images/4128/small/solana.png",
  ETH: "https://assets.coingecko.com/coins/images/279/small/ethereum.png",
  POLYGON: "https://assets.coingecko.com/coins/images/4713/small/polygon.png",
  BSC: "https://assets.coingecko.com/coins/images/825/small/bnb-icon2_2x.png",
  ARBITRUM:
    "https://assets.coingecko.com/coins/images/16547/small/photo_2023-03-29_21.47.00.jpeg",
  OPTIMISM:
    "https://assets.coingecko.com/coins/images/25244/small/Optimism.png",
  HYPEREVM:
    "https://assets.coingecko.com/coins/images/50882/small/hyperliquid.jpg",
};

// Helper function to create a token object
export const createBridgeToken = (
  symbol: string,
  name: string,
  address: string | null,
  decimals: number,
  logo: string,
): BridgeToken => ({
  symbol,
  name,
  address,
  balance: "0",
  decimals,
  logo,
  price: 0,
  usdBalance: "0.00",
});

// Helper function to create a chain object
export const createBridgeChain = (
  id: string,
  name: string,
  logo: string,
  nativeCurrency: BridgeToken,
  tokens: BridgeToken[],
): BridgeChain => ({
  id,
  name,
  logo,
  nativeCurrency,
  tokens,
});

export const bridgeMetaDeposit = [
  createBridgeChain(
    "SOLANA",
    "Solana",
    CHAIN_LOGOS.SOLANA,
    createBridgeToken("SOL", "Solana", null, 9, TOKEN_LOGOS.SOL),
    [
      createBridgeToken("SOL", "Solana", null, 9, TOKEN_LOGOS.SOL),
      createBridgeToken(
        "USDC",
        "USD Coin",
        BRIDGE_TOKEN_ADDRESSES.SOLANA.USDC,
        6,
        TOKEN_LOGOS.USDC,
      ),
      createBridgeToken(
        "USDT",
        "Tether USD",
        BRIDGE_TOKEN_ADDRESSES.SOLANA.USDT,
        6,
        TOKEN_LOGOS.USDT,
      ),
    ],
  ),
  createBridgeChain(
    "HYPEREVM",
    "Hyperliquid",
    CHAIN_LOGOS.HYPEREVM,
    createBridgeToken("HYPE", "Hyperliquid", null, 18, TOKEN_LOGOS.HYPE),
    [
      createBridgeToken("HYPE", "Hyperliquid", null, 18, TOKEN_LOGOS.HYPE),
      createBridgeToken(
        "USDC",
        "USD Coin",
        BRIDGE_TOKEN_ADDRESSES.HYPEREVM.USDC,
        6,
        TOKEN_LOGOS.USDC,
      ),
      createBridgeToken(
        "USDT",
        "Tether USD",
        BRIDGE_TOKEN_ADDRESSES.HYPEREVM.USDT,
        6,
        TOKEN_LOGOS.USDT,
      ),
    ],
  ),
  createBridgeChain(
    "ETH",
    "Ethereum",
    CHAIN_LOGOS.ETH,
    createBridgeToken("ETH", "Ether", null, 18, TOKEN_LOGOS.ETH),
    [
      createBridgeToken("ETH", "Ether", null, 18, TOKEN_LOGOS.ETH),
      createBridgeToken(
        "USDC",
        "USD Coin",
        BRIDGE_TOKEN_ADDRESSES.ETH.USDC,
        6,
        TOKEN_LOGOS.USDC,
      ),
      createBridgeToken(
        "USDT",
        "Tether USD",
        BRIDGE_TOKEN_ADDRESSES.ETH.USDT,
        6,
        TOKEN_LOGOS.USDT,
      ),
      createBridgeToken(
        "DAI",
        "Dai Stablecoin",
        BRIDGE_TOKEN_ADDRESSES.ETH.DAI,
        18,
        TOKEN_LOGOS.DAI,
      ),
    ],
  ),
  createBridgeChain(
    "POLYGON",
    "Polygon",
    CHAIN_LOGOS.POLYGON,
    createBridgeToken("POL", "Polygon", null, 18, TOKEN_LOGOS.POL),
    [
      createBridgeToken("POL", "Polygon", null, 18, TOKEN_LOGOS.POL),
      createBridgeToken(
        "USDC",
        "USD Coin",
        BRIDGE_TOKEN_ADDRESSES.POLYGON.USDC,
        6,
        TOKEN_LOGOS.USDC,
      ),
      createBridgeToken(
        "USDT",
        "Tether USD",
        BRIDGE_TOKEN_ADDRESSES.POLYGON.USDT,
        6,
        TOKEN_LOGOS.USDT,
      ),
      createBridgeToken(
        "DAI",
        "Dai Stablecoin",
        BRIDGE_TOKEN_ADDRESSES.POLYGON.DAI,
        18,
        TOKEN_LOGOS.DAI,
      ),
    ],
  ),
  createBridgeChain(
    "BSC",
    "BNB Smart Chain",
    CHAIN_LOGOS.BSC,
    createBridgeToken("BNB", "BNB", null, 18, TOKEN_LOGOS.BNB),
    [
      createBridgeToken("BNB", "BNB", null, 18, TOKEN_LOGOS.BNB),
      createBridgeToken(
        "USDC",
        "USD Coin",
        BRIDGE_TOKEN_ADDRESSES.BSC.USDC,
        18,
        TOKEN_LOGOS.USDC,
      ),
      createBridgeToken(
        "USDT",
        "Tether USD",
        BRIDGE_TOKEN_ADDRESSES.BSC.USDT,
        18,
        TOKEN_LOGOS.USDT,
      ),
      createBridgeToken(
        "DAI",
        "Dai Stablecoin",
        BRIDGE_TOKEN_ADDRESSES.BSC.DAI,
        18,
        TOKEN_LOGOS.DAI,
      ),
    ],
  ),
  createBridgeChain(
    "ARBITRUM",
    "Arbitrum",
    CHAIN_LOGOS.ARBITRUM,
    createBridgeToken("ETH", "Ether", null, 18, TOKEN_LOGOS.ETH),
    [
      createBridgeToken("ETH", "Ether", null, 18, TOKEN_LOGOS.ETH),
      createBridgeToken(
        "USDC",
        "USD Coin",
        BRIDGE_TOKEN_ADDRESSES.ARBITRUM.USDC,
        6,
        TOKEN_LOGOS.USDC,
      ),
      createBridgeToken(
        "USDT",
        "Tether USD",
        BRIDGE_TOKEN_ADDRESSES.ARBITRUM.USDT,
        6,
        TOKEN_LOGOS.USDT,
      ),
      createBridgeToken(
        "DAI",
        "Dai Stablecoin",
        BRIDGE_TOKEN_ADDRESSES.ARBITRUM.DAI,
        18,
        TOKEN_LOGOS.DAI,
      ),
    ],
  ),
  createBridgeChain(
    "OPTIMISM",
    "Optimism",
    CHAIN_LOGOS.OPTIMISM,
    createBridgeToken("ETH", "Ether", null, 18, TOKEN_LOGOS.ETH),
    [
      createBridgeToken("ETH", "Ether", null, 18, TOKEN_LOGOS.ETH),
      createBridgeToken(
        "USDC",
        "USD Coin",
        BRIDGE_TOKEN_ADDRESSES.OPTIMISM.USDC,
        6,
        TOKEN_LOGOS.USDC,
      ),
      createBridgeToken(
        "USDT",
        "Tether USD",
        BRIDGE_TOKEN_ADDRESSES.OPTIMISM.USDT,
        6,
        TOKEN_LOGOS.USDT,
      ),
      createBridgeToken(
        "DAI",
        "Dai Stablecoin",
        BRIDGE_TOKEN_ADDRESSES.OPTIMISM.DAI,
        18,
        TOKEN_LOGOS.DAI,
      ),
    ],
  ),
];

export const bridgeMetaWithdraw = [
  createBridgeChain(
    "SOLANA",
    "Solana",
    CHAIN_LOGOS.SOLANA,
    createBridgeToken("SOL", "Solana", null, 9, TOKEN_LOGOS.SOL),
    [createBridgeToken("SOL", "Solana", null, 9, TOKEN_LOGOS.SOL)],
  ),
  createBridgeChain(
    "HYPEREVM",
    "Hyperliquid",
    CHAIN_LOGOS.HYPEREVM,
    createBridgeToken("HYPE", "Hyperliquid", null, 18, TOKEN_LOGOS.HYPE),
    [
      createBridgeToken("HYPE", "Hyperliquid", null, 18, TOKEN_LOGOS.HYPE),
      createBridgeToken(
        "USDC",
        "USD Coin",
        BRIDGE_TOKEN_ADDRESSES.HYPEREVM.USDC,
        6,
        TOKEN_LOGOS.USDC,
      ),
      createBridgeToken(
        "USDT",
        "Tether USD",
        BRIDGE_TOKEN_ADDRESSES.HYPEREVM.USDT,
        6,
        TOKEN_LOGOS.USDT,
      ),
    ],
  ),
  createBridgeChain(
    "ETH",
    "Ethereum",
    CHAIN_LOGOS.ETH,
    createBridgeToken("ETH", "Ether", null, 18, TOKEN_LOGOS.ETH),
    [createBridgeToken("ETH", "Ether", null, 18, TOKEN_LOGOS.ETH)],
  ),
  createBridgeChain(
    "POLYGON",
    "Polygon",
    CHAIN_LOGOS.POLYGON,
    createBridgeToken("POL", "Polygon", null, 18, TOKEN_LOGOS.POL),
    [createBridgeToken("POL", "Polygon", null, 18, TOKEN_LOGOS.POL)],
  ),
  createBridgeChain(
    "BSC",
    "BNB Smart Chain",
    CHAIN_LOGOS.BSC,
    createBridgeToken("BNB", "BNB", null, 18, TOKEN_LOGOS.BNB),
    [createBridgeToken("BNB", "BNB", null, 18, TOKEN_LOGOS.BNB)],
  ),
  createBridgeChain(
    "ARBITRUM",
    "Arbitrum",
    CHAIN_LOGOS.ARBITRUM,
    createBridgeToken("ETH", "Ether", null, 18, TOKEN_LOGOS.ETH),
    [createBridgeToken("ETH", "Ether", null, 18, TOKEN_LOGOS.ETH)],
  ),
  createBridgeChain(
    "OPTIMISM",
    "Optimism",
    CHAIN_LOGOS.OPTIMISM,
    createBridgeToken("ETH", "Ether", null, 18, TOKEN_LOGOS.ETH),
    [createBridgeToken("ETH", "Ether", null, 18, TOKEN_LOGOS.ETH)],
  ),
];
