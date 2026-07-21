/**
 * Factory for the payment-proof SDK client, bound to the connected thirdweb account.
 *
 * Auth is sign-in-once: the account signs ONE message (POST /auth/session), gets a
 * short-lived bearer token, and every subsequent call reuses it instead of signing
 * per request. The SDK's createSessionAuthorization handles the mint and caches the
 * token in sessionStorage (so a reload doesn't re-prompt until it expires). The
 * claimed on-chain identity is the smart-account address, verified server-side via
 * ERC-1271.
 *
 * The feature is opt-in: with no VITE_ENCRYPTED_PROOF_API_URL configured,
 * isProofServiceConfigured() is false and callers render nothing.
 */

import {
  createProofClient,
  createSessionAuthorization,
  type ProofClient,
} from "p2pme-encrypted-payment-proof";
import type { Account } from "thirdweb/wallets";
import { chain } from "@/core/adapters/thirdweb";

const baseUrl = import.meta.env.VITE_ENCRYPTED_PROOF_API_URL;

export function isProofServiceConfigured(): boolean {
  return typeof baseUrl === "string" && baseUrl.length > 0;
}

export interface ProofPublicConfig {
  /** On-chain currency codes for which proof requests are disabled (denylist). */
  ignoredCurrencies: string[];
  /** How long after completion a proof may still be requested, in hours. */
  requestWindowHours: number;
}

/**
 * Fetch the proof service's public feature config (currency denylist + request
 * window). Unauthenticated — no wallet prompt — so the card can decide on load
 * whether to offer the request control for this order's currency. The server
 * still enforces both, so this is only a UX hint.
 */
export async function fetchProofPublicConfig(): Promise<ProofPublicConfig> {
  if (!baseUrl) throw new Error("Payment proof service is not configured");
  const res = await fetch(`${baseUrl.replace(/\/$/, "")}/public/config`);
  if (!res.ok) throw new Error(`proof config ${res.status}`);
  return (await res.json()) as ProofPublicConfig;
}

// One bearer-session authorizer per address, so a burst of calls shares ONE
// signature and reuses the token until it expires.
const authCache = new Map<string, () => Promise<string>>();

function authorizationFor(
  account: Account,
  url: string,
): () => Promise<string> {
  const key = account.address.toLowerCase();
  let authorization = authCache.get(key);
  if (!authorization) {
    authorization = createSessionAuthorization({
      baseUrl: url,
      address: account.address,
      chainId: chain.id,
      signMessage: (message) => account.signMessage({ message }),
      storage:
        typeof sessionStorage !== "undefined" ? sessionStorage : undefined,
    });
    authCache.set(key, authorization);
  }
  return authorization;
}

export function createProofClientFor(account: Account): ProofClient {
  if (!baseUrl) throw new Error("Payment proof service is not configured");
  return createProofClient({
    baseUrl,
    authorization: authorizationFor(account, baseUrl),
  });
}
