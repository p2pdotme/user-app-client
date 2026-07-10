// ---------------------------------------------------------------------------
// Stellar-origin support for 1Click bridges
//
// Stellar is the one origin chain that does NOT support the default "SIMPLE"
// deposit mode: 1Click matches Stellar deposits by depositAddress + a
// depositMemo, so Stellar-origin quotes must request "MEMO" mode and the memo
// must be attached to the deposit. A memo-less Stellar deposit is never matched
// and the funds sit unrecoverable until manual intervention — so these helpers
// exist to make the memo non-optional for Stellar.
// ---------------------------------------------------------------------------

import { i18n } from "@/lib/i18n";

// HOT Omni bridges Stellar-origin assets under this multi-token asset-id prefix
// (e.g. "nep245:v2_1.omni.hot.tg:1100_111bzQBB…"). Used as a fallback when the
// caller doesn't have the registry blockchain slug handy.
export const STELLAR_ASSET_ID_PREFIX = "nep245:v2_1.omni.hot.tg:1100_";

/**
 * True when the swap's origin asset lives on Stellar. Detected generically:
 * prefer the /v0/tokens `blockchain` slug ("stellar"), and fall back to the HOT
 * Omni asset-id prefix so detection still works before the registry is loaded.
 */
export function isStellarOrigin(
  originAsset: string,
  originBlockchain?: string,
): boolean {
  return (
    originBlockchain === "stellar" ||
    originAsset.startsWith(STELLAR_ASSET_ID_PREFIX)
  );
}

/**
 * Hard guard against losing funds: for a Stellar origin a deposit is only
 * credited when it carries the quote's `depositMemo`. If the origin is Stellar
 * and the quote came back without a memo, throw rather than surface a deposit
 * address the user could pay into memo-less (which 1Click would never match).
 */
export function assertStellarDepositMemo(params: {
  originAsset: string;
  originBlockchain?: string;
  depositMemo?: string | null;
}): void {
  if (
    isStellarOrigin(params.originAsset, params.originBlockchain) &&
    !params.depositMemo
  ) {
    throw new Error(i18n.t("BRIDGE_STELLAR_MEMO_MISSING"));
  }
}
