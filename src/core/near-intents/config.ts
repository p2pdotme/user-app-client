export const ONECLICK_BASE_URL = "https://1click.chaindefuser.com";

// Optional partner JWT
export const ONECLICK_JWT: string | undefined = undefined;

// App fee routed to our Intents account (bps)
export const ONECLICK_APP_FEE_RECIPIENT: string | undefined = undefined;
export const ONECLICK_APP_FEE_BPS = 50;

// Hub asset: Base USDC
export const BASE_USDC_ASSET_ID =
  "nep141:base-0x833589fcd6edb6e08f4c7c32d4f71b54bda02913.omft.near";

export const ONECLICK_EXPLORER_URL = "https://explorer.near-intents.org";

export const DEFAULT_SLIPPAGE_BPS = 200; // 2%

export function getQuoteDeadline(): string {
  // 1 hour from now — plenty for a manual send from a wallet/exchange
  return new Date(Date.now() + 60 * 60 * 1000).toISOString();
}
