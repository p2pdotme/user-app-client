export const JUPITER_API_BASE = "https://api.jup.ag/swap/v2";
export const JUPITER_API_KEY = import.meta.env.VITE_JUPITER_API_KEY ?? "";

export const P2P_TOKEN_MINT = "P2PXup1ZvMpCDkJn3PQxtBYgxeCSfH39SFeurGSmeta";
export const SOLANA_USDC_MINT = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";

// Verify against on-chain token metadata if uncertain
export const P2P_TOKEN_DECIMALS = 6;
export const SOLANA_USDC_DECIMALS = 6;

// 0.5% slippage in basis points
export const JUPITER_SLIPPAGE_BPS = 50;

if (!JUPITER_API_KEY) {
  console.error("VITE_JUPITER_API_KEY is not set in the environment variables");
}
