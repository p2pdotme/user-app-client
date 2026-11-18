/**
 * When to keep polling the SAME Reclaim session after `session.start()`
 * fails, instead of failing the verification.
 *
 * Why this exists: @p2pdotme/sdk polls Reclaim's status API with a plain
 * `fetch` loop that gives up on the first problem. Reclaim's own SDK
 * (`ReclaimProofRequest.startSession`) is deliberately more tolerant:
 *  - it retries network errors, 408/429/5xx (fetch-retry, honours
 *    Retry-After),
 *  - it treats PROOF_GENERATION_FAILED as transient for 30 s (the attestor
 *    retries on its side) before reporting it,
 *  - and it keeps polling while the session isn't visible yet.
 * Without the same tolerance, a blip on Reclaim's side (or the phone
 * suspending the PWA while the user is in the Reclaim app) fails the whole
 * verification, and the only way out was "Retry", which starts a NEW session
 * and makes the user redo the Reclaim app step. Resuming the existing session
 * keeps any proof the user already generated.
 *
 * The overall 10-minute cap on an attempt still applies on top of this.
 */

export type ReclaimPollState = {
  /** Resumes done for this attempt so far. */
  retries: number;
  /** When PROOF_GENERATION_FAILED was first seen (cleared by other errors). */
  generationFailedSince: number | null;
  /** When the attempt started (session created or resumed from the URL). */
  startedAt: number;
  /** When the last transient failure was handled (null before the first). */
  lastFailureAt: number | null;
};

export type ReclaimPollDecision =
  | {
      action: "retry";
      delayMs: number;
      reason: string;
      nextState: ReclaimPollState;
    }
  | { action: "stop"; reason: string };

/** Same grace Reclaim's own SDK gives PROOF_GENERATION_FAILED. */
export const RECLAIM_GENERATION_FAILED_GRACE_MS = 30_000;
/** A freshly created / resumed session can briefly 404 on Reclaim's API. */
export const RECLAIM_NOT_FOUND_GRACE_MS = 60_000;
export const RECLAIM_MAX_POLL_RETRIES = 8;
/**
 * A failure this long after the previous one means polling recovered in
 * between, so it's a separate outage and gets a fresh retry budget. Longer
 * than the max backoff (15 s), so back-to-back failures of one outage never
 * reset it. The 10-minute attempt cap still bounds the whole attempt.
 */
export const RECLAIM_RETRY_BUDGET_RESET_MS = 30_000;
const BASE_DELAY_MS = 2_000;
const MAX_DELAY_MS = 15_000;

/** Errors that retrying the same session can never fix. */
const TERMINAL_CODES = new Set([
  "RECLAIM_POLLING_ABORTED", // we (Cancel / unmount / new attempt) stopped it
  "RECLAIM_PROOF_INVALID", // e.g. GitHub eligibility criteria not met
  "RECLAIM_SESSION_ENDPOINT_FAILED", // creating the session failed
  "VALIDATION_ERROR",
  "PEER_DEPENDENCY_MISSING",
]);

export function initialReclaimPollState(now = Date.now()): ReclaimPollState {
  return {
    retries: 0,
    generationFailedSince: null,
    startedAt: now,
    lastFailureAt: null,
  };
}

function errorCode(error: unknown): string | undefined {
  if (error && typeof error === "object" && "code" in error) {
    const code = (error as { code?: unknown }).code;
    return typeof code === "string" ? code : undefined;
  }
  return undefined;
}

export function decideReclaimPollRetry(
  error: unknown,
  state: ReclaimPollState,
  now = Date.now(),
): ReclaimPollDecision {
  const code = errorCode(error) ?? "UNKNOWN";

  if (TERMINAL_CODES.has(code)) return { action: "stop", reason: code };
  const retries =
    state.lastFailureAt !== null &&
    now - state.lastFailureAt > RECLAIM_RETRY_BUDGET_RESET_MS
      ? 0
      : state.retries;
  if (retries >= RECLAIM_MAX_POLL_RETRIES) {
    return { action: "stop", reason: "max_retries" };
  }

  let generationFailedSince: number | null = null;
  if (code === "RECLAIM_PROOF_GENERATION_FAILED") {
    generationFailedSince = state.generationFailedSince ?? now;
    if (now - generationFailedSince >= RECLAIM_GENERATION_FAILED_GRACE_MS) {
      return { action: "stop", reason: code };
    }
  } else if (code === "RECLAIM_SESSION_NOT_FOUND") {
    if (now - state.startedAt >= RECLAIM_NOT_FOUND_GRACE_MS) {
      return { action: "stop", reason: code };
    }
  }
  // Anything else (RECLAIM_INIT_FAILED wrapping a network error or a
  // non-JSON 5xx page from the status API, or an unknown code) is treated as
  // a transient polling failure, bounded by RECLAIM_MAX_POLL_RETRIES.

  const delayMs = Math.min(BASE_DELAY_MS * 2 ** retries, MAX_DELAY_MS);
  return {
    action: "retry",
    delayMs,
    reason: code,
    nextState: {
      ...state,
      retries: retries + 1,
      generationFailedSince,
      lastFailureAt: now,
    },
  };
}
