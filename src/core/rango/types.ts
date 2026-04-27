import { TransactionStatus, TransactionType } from "rango-types";
import type {
  BlockchainMeta,
  QuoteRequest,
  QuoteResponse,
  SwapRequest,
  SwapResponse,
  Token,
  TokenBalanceResponse,
} from "rango-types/basicApi";

export type RangoBlockchain = BlockchainMeta;
export type RangoToken = Token;
export type RangoQuoteResponse = QuoteResponse;
export type RangoSwapResponse = SwapResponse;
export const RangoTxType = TransactionType;
export const RangoTxStatus = TransactionStatus;

export type SupportedBridgeChains =
  | "ETH"
  | "POLYGON"
  | "BSC"
  | "ARBITRUM"
  | "OPTIMISM"
  | "SOLANA"
  | "HYPEREVM";

export interface BridgeToken {
  symbol: string;
  name: string;
  address: string | null;
  balance: string;
  decimals: number;
  logo: string;
  price: number;
  usdBalance: string;
}

export interface BridgeChain {
  id: string;
  name: string;
  logo: string;
  nativeCurrency: BridgeToken;
  tokens: BridgeToken[];
}

export type { QuoteRequest, SwapRequest, TokenBalanceResponse };
