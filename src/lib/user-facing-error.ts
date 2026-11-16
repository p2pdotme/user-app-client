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
 */
export function getUserFacingErrorMessage(
  t: TFunction,
  error: unknown,
  fallbackKey = "ERROR_GENERIC_DESCRIPTION",
): string {
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

  if (
    raw.includes("network") ||
    raw.includes("failed to fetch") ||
    raw.includes("fetch failed") ||
    raw.includes("load failed") ||
    raw.includes("offline") ||
    raw.includes("econn") ||
    raw.includes("socket")
  ) {
    return t("ERROR_NETWORK_DESCRIPTION");
  }

  if (raw.includes("timeout") || raw.includes("timed out")) {
    return t("ERROR_TIMEOUT_DESCRIPTION");
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
    raw.includes("modal closed") ||
    raw.includes("aborted")
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
