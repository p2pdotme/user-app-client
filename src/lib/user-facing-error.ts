import type { TFunction } from "i18next";
import { parseContractError } from "@/lib/errors";

/**
 * Turns any thrown value into a short, plain-language message that is safe to
 * show to end users. Raw SDK / RPC / contract messages are never surfaced
 * directly; instead we pattern-match the common failure classes and fall back
 * to a generic, actionable sentence.
 *
 * Use this for toast descriptions and inline error text instead of
 * `error.message`.
 *
 * Pass `{ context: "send" }` for value transfers (withdraw, bridge send): a
 * network / timeout error there is ambiguous (the tx may still have been
 * broadcast), so the message tells the user to check their balance or
 * BaseScan before retrying instead of implying it failed.
 */
export type UserFacingErrorOptions = {
  fallbackKey?: string;
  context?: "send";
};

export function getUserFacingErrorMessage(
  t: TFunction,
  error: unknown,
  fallbackKeyOrOptions: string | UserFacingErrorOptions = {},
): string {
  const { fallbackKey = "ERROR_GENERIC_DESCRIPTION", context } =
    typeof fallbackKeyOrOptions === "string"
      ? { fallbackKey: fallbackKeyOrOptions }
      : fallbackKeyOrOptions;

  // "This account/passport/BVN is already linked" can't be fixed by retrying;
  // say so plainly instead of "the transaction didn't go through".
  if (isAlreadyVerifiedError(error)) {
    return t("ERROR_ALREADY_VERIFIED_DESCRIPTION");
  }

  // A known contract revert (decoded from its selector) has its own message.
  const contractKey = safeParseContractError(error);
  if (contractKey) {
    const message = t(contractKey, { defaultValue: "" });
    if (message) return message;
  }

  const raw = extractRawMessage(error).toLowerCase();

  if (!raw) return t(fallbackKey);

  if (
    raw.includes("user rejected") ||
    raw.includes("user denied") ||
    raw.includes("user cancelled") ||
    raw.includes("user canceled") ||
    raw.includes("closed by user") ||
    raw.includes("popup closed")
  ) {
    return t("ERROR_USER_CANCELLED_DESCRIPTION");
  }

  if (
    raw.includes("insufficient funds") ||
    raw.includes("insufficient balance") ||
    raw.includes("transfer amount exceeds balance") ||
    raw.includes("exceeds balance")
  ) {
    return t("ERROR_INSUFFICIENT_BALANCE_DESCRIPTION");
  }

  if (isNetworkOrTimeoutMessage(raw)) {
    if (context === "send") return t("RVW_ERROR_SEND_UNCONFIRMED_DESCRIPTION");
    return isTimeoutMessage(raw)
      ? t("ERROR_TIMEOUT_DESCRIPTION")
      : t("ERROR_NETWORK_DESCRIPTION");
  }

  if (
    raw.includes("execution reverted") ||
    raw.includes("revert") ||
    raw.includes("call exception")
  ) {
    return t("ERROR_TRANSACTION_REVERTED_DESCRIPTION");
  }

  return t(fallbackKey);
}

function isTimeoutMessage(raw: string): boolean {
  return (
    raw.includes("timeout") ||
    raw.includes("timed out") ||
    // fetch() aborted by an AbortSignal timeout: "The operation was aborted".
    raw.includes("aborted")
  );
}

function isNetworkOrTimeoutMessage(raw: string): boolean {
  return (
    raw.includes("network") ||
    raw.includes("failed to fetch") ||
    raw.includes("fetch failed") ||
    raw.includes("load failed") ||
    raw.includes("offline") ||
    raw.includes("econn") ||
    raw.includes("socket") ||
    isTimeoutMessage(raw)
  );
}

/**
 * `true` for network / timeout failures (offline, fetch failed, request
 * timed out or aborted). For a send, these are ambiguous: the transaction may
 * have been broadcast even though we never saw the result.
 */
export function isNetworkOrTimeoutError(error: unknown): boolean {
  return isNetworkOrTimeoutMessage(extractRawMessage(error).toLowerCase());
}

/** Contract error keys meaning "this identity is already used/verified". */
const ALREADY_VERIFIED_KEYS = new Set([
  "ALREADY_VERIFIED",
  "SOCIAL_ALREADY_VERIFIED",
  "NULLIFIER_ALREADY_VERIFIED",
  "USER_ID_ALREADY_VERIFIED",
  "USERNAME_ALREADY_VERIFIED",
  "BVN_ALREADY_VERIFIED",
  "BVN_NULLIFIER_ALREADY_SPENT",
  "PASSPORT_ALREADY_VERIFIED",
]);

/**
 * `true` when a verification failed because the social account, passport,
 * face or BVN is already verified (for this or another wallet). Retrying
 * can't succeed, so callers should not offer Retry.
 */
export function isAlreadyVerifiedError(error: unknown): boolean {
  const key = safeParseContractError(error);
  if (key && ALREADY_VERIFIED_KEYS.has(key)) return true;
  const raw = extractRawMessage(error).toLowerCase();
  return (
    raw.includes("alreadyverified") ||
    raw.includes("already verified") ||
    raw.includes("nullifier already")
  );
}

function safeParseContractError(error: unknown): string | null {
  try {
    const key = parseContractError(error);
    return typeof key === "string" ? key : null;
  } catch {
    return null;
  }
}

/**
 * Returns `true` when the error represents the user deliberately dismissing a
 * wallet / auth / signing prompt. Callers usually want to stay silent (or show
 * a neutral message) in that case rather than an error toast.
 *
 * Deliberately does NOT match a bare "aborted": fetch timeouts surface as
 * "The operation was aborted" and must be reported, not silenced.
 */
export function isUserCancellation(error: unknown): boolean {
  const raw = extractRawMessage(error).toLowerCase();
  return (
    raw.includes("user rejected") ||
    raw.includes("user denied") ||
    raw.includes("user cancelled") ||
    raw.includes("user canceled") ||
    raw.includes("closed by user") ||
    raw.includes("popup closed") ||
    raw.includes("modal closed")
  );
}

function extractRawMessage(error: unknown): string {
  if (!error) return "";
  if (typeof error === "string") return error;
  if (error instanceof Error) {
    const cause = (error as Error & { cause?: unknown }).cause;
    const causeMessage =
      cause && cause !== error ? ` ${extractRawMessage(cause)}` : "";
    return `${error.message ?? ""}${causeMessage}`;
  }
  if (typeof error === "object") {
    const maybe = error as { message?: unknown; code?: unknown };
    const parts = [maybe.message, maybe.code].filter(
      (p): p is string => typeof p === "string",
    );
    return parts.join(" ");
  }
  return String(error);
}
