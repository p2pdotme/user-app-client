import type { TFunction } from "i18next";

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
