/**
 * Runtime configuration of the recovery module.
 *
 * Pimlico is the ERC-4337 bundler for gas-price quotes and for UserOps the
 * Thirdweb paymaster does not sponsor. The key is the one the standalone recovery app
 * uses; it is a client-side key that ships in the browser bundle either way.
 */
const PIMLICO_API_KEY = "pim_DgBeb1uoMpzzV4RG1Kxy6E";

export function getThirdwebBundlerUrl(chainId: number): string {
  return `https://${chainId}.bundler.thirdweb.com/v2`;
}

export function getPimlicoBundlerUrl(chainId: number): string {
  return `https://api.pimlico.io/v2/${chainId}/rpc?apikey=${PIMLICO_API_KEY}`;
}

/** How long to wait for a submitted UserOperation to be mined. */
export const RECEIPT_POLL_ATTEMPTS = 30;
export const RECEIPT_POLL_DELAY_MS = 2000;

/**
 * Load-balanced RPCs (e.g. Celo's forno) can lag a block behind a receipt, so
 * freshly deployed code is polled for rather than checked once.
 */
export const CODE_POLL_ATTEMPTS = 10;
export const CODE_POLL_DELAY_MS = 2000;

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
