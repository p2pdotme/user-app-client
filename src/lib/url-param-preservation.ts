const STORAGE_KEY = "@P2PME:URL_PARAMS";

interface URLParams {
  // Campaign params
  manager?: string;
  id?: string;
  // Referral params
  address?: string;
  nonce?: string;
  signature?: string;
  // Verification params
  sessionId?: string;
  socialPlatform?: string;
  language?: string;
  currency?: string;
}

/**
 * Store current URL parameters before auth redirect
 */
export function preserveUrlParams(): void {
  const params = new URLSearchParams(window.location.search);
  const urlParams: URLParams = {};

  // Extract all relevant parameters
  const keys = [
    "manager",
    "id",
    "address",
    "nonce",
    "signature",
    "sessionId",
    "socialPlatform",
    "language",
    "currency",
  ];
  keys.forEach((key) => {
    const value = params.get(key);
    if (value) {
      urlParams[key as keyof URLParams] = value;
    }
  });

  // Store if we have any parameters
  if (Object.keys(urlParams).length > 0) {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(urlParams));
  }
}

/**
 * Get restoration URL and clear stored parameters
 */
export function restoreUrlParams(): string | null {
  const stored = sessionStorage.getItem(STORAGE_KEY);
  if (!stored) return null;

  try {
    const params: URLParams = JSON.parse(stored);
    sessionStorage.removeItem(STORAGE_KEY);

    // Campaign takes priority
    if (params.manager || params.id) {
      const url = new URL("/campaign", window.location.origin);
      if (params.manager) url.searchParams.set("manager", params.manager);
      if (params.id) url.searchParams.set("id", params.id);
      return url.pathname + url.search;
    }

    // Referral (needs all three)
    if (params.address && params.nonce && params.signature) {
      const url = new URL("/recommend", window.location.origin);
      url.searchParams.set("address", params.address);
      url.searchParams.set("nonce", params.nonce);
      url.searchParams.set("signature", params.signature);
      return url.pathname + url.search;
    }

    // Verification (needs sessionId and socialPlatform)
    if (params.sessionId && params.socialPlatform) {
      const url = new URL("/limits", window.location.origin);
      url.searchParams.set("sessionId", params.sessionId);
      url.searchParams.set("socialPlatform", params.socialPlatform);
      return url.pathname + url.search;
    }

    return null;
  } catch {
    sessionStorage.removeItem(STORAGE_KEY);
    return null;
  }
}

/**
 * Check if we have stored parameters
 */
export function hasStoredParams(): boolean {
  return Boolean(sessionStorage.getItem(STORAGE_KEY));
}

/**
 * Clear stored parameters
 */
export function clearStoredParams(): void {
  sessionStorage.removeItem(STORAGE_KEY);
}

/**
 * Get stored parameters for hooks fallback
 */
export function getStoredParams(): URLParams | null {
  const stored = sessionStorage.getItem(STORAGE_KEY);
  if (!stored) return null;

  try {
    return JSON.parse(stored);
  } catch {
    return null;
  }
}
