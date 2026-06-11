export function getBackendErrorKey(message: string): string | undefined {
  // Case 1: message is already an UPPER_SNAKE_CASE key
  if (/^[A-Z][A-Z0-9_]+$/.test(message)) {
    return `P2P_SWAP_ERROR_${message}`;
  }
  return message;
}

/**
 * Detects a timeout in a backend error body.
 *
 * Matches:
 *  - top-level Lambda timeout: `{ errorType: "TimeoutError" }`
 *  - AppError with nested reason: `{ context: { reason: "TimeoutError" } }`
 */
export function isTimeoutError(body: unknown): boolean {
  if (!body || typeof body !== "object") return false;
  const b = body as { errorType?: unknown; context?: { reason?: unknown } };
  if (b.errorType === "TimeoutError") return true;
  if (b.context?.reason === "TimeoutError") return true;
  return false;
}
