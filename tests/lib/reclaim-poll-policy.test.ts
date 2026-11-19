import { describe, expect, it } from "vitest";
import {
  decideReclaimPollRetry,
  initialReclaimPollState,
  RECLAIM_GENERATION_FAILED_GRACE_MS,
  RECLAIM_MAX_POLL_RETRIES,
  RECLAIM_NOT_FOUND_GRACE_MS,
  RECLAIM_RETRY_BUDGET_RESET_MS,
  type ReclaimPollState,
} from "@/lib/reclaim-poll-policy";

const err = (code: string, cause?: unknown) =>
  Object.assign(new Error(code), { code, cause });

describe("Reclaim polling retry policy", () => {
  const t0 = 1_000_000;

  it("retries a network failure on the same session with exponential backoff", () => {
    let state: ReclaimPollState = initialReclaimPollState(t0);
    const delays: number[] = [];
    for (let i = 0; i < 5; i++) {
      const d = decideReclaimPollRetry(
        err("RECLAIM_INIT_FAILED", new TypeError("Failed to fetch")),
        state,
        t0 + i * 1000,
      );
      expect(d.action).toBe("retry");
      if (d.action !== "retry") return;
      delays.push(d.delayMs);
      state = d.nextState;
    }
    expect(delays).toEqual([2000, 4000, 8000, 15000, 15000]);
  });

  it("gives up after the retry budget", () => {
    const state = {
      ...initialReclaimPollState(t0),
      retries: RECLAIM_MAX_POLL_RETRIES,
    };
    expect(
      decideReclaimPollRetry(err("RECLAIM_INIT_FAILED"), state, t0),
    ).toEqual({ action: "stop", reason: "max_retries" });
  });

  it("gives a second outage in the same attempt a fresh retry budget", () => {
    const exhausted = {
      ...initialReclaimPollState(t0),
      retries: RECLAIM_MAX_POLL_RETRIES,
      lastFailureAt: t0,
    };
    // Same outage (next failure soon after the last): still out of retries.
    expect(
      decideReclaimPollRetry(
        err("RECLAIM_INIT_FAILED"),
        exhausted,
        t0 + RECLAIM_RETRY_BUDGET_RESET_MS,
      ),
    ).toEqual({ action: "stop", reason: "max_retries" });
    // Polling recovered, then a new drop: the budget starts over.
    const d = decideReclaimPollRetry(
      err("RECLAIM_INIT_FAILED"),
      exhausted,
      t0 + RECLAIM_RETRY_BUDGET_RESET_MS + 1,
    );
    expect(d.action).toBe("retry");
    if (d.action !== "retry") return;
    expect(d.delayMs).toBe(2_000);
    expect(d.nextState.retries).toBe(1);
  });

  it("never retries cancellations or errors a retry can't fix", () => {
    const state = initialReclaimPollState(t0);
    for (const code of [
      "RECLAIM_POLLING_ABORTED",
      "RECLAIM_PROOF_INVALID",
      "RECLAIM_SESSION_ENDPOINT_FAILED",
    ]) {
      expect(decideReclaimPollRetry(err(code), state, t0)).toEqual({
        action: "stop",
        reason: code,
      });
    }
  });

  it("treats PROOF_GENERATION_FAILED as transient for 30 s, like Reclaim's SDK", () => {
    const first = decideReclaimPollRetry(
      err("RECLAIM_PROOF_GENERATION_FAILED"),
      initialReclaimPollState(t0),
      t0,
    );
    expect(first.action).toBe("retry");
    if (first.action !== "retry") return;
    expect(first.nextState.generationFailedSince).toBe(t0);

    const stillWithinGrace = decideReclaimPollRetry(
      err("RECLAIM_PROOF_GENERATION_FAILED"),
      first.nextState,
      t0 + RECLAIM_GENERATION_FAILED_GRACE_MS - 1,
    );
    expect(stillWithinGrace.action).toBe("retry");

    expect(
      decideReclaimPollRetry(
        err("RECLAIM_PROOF_GENERATION_FAILED"),
        first.nextState,
        t0 + RECLAIM_GENERATION_FAILED_GRACE_MS,
      ),
    ).toEqual({ action: "stop", reason: "RECLAIM_PROOF_GENERATION_FAILED" });
  });

  it("a different error in between resets the generation-failed clock", () => {
    const first = decideReclaimPollRetry(
      err("RECLAIM_PROOF_GENERATION_FAILED"),
      initialReclaimPollState(t0),
      t0,
    );
    if (first.action !== "retry") throw new Error("expected retry");
    const network = decideReclaimPollRetry(
      err("RECLAIM_INIT_FAILED"),
      first.nextState,
      t0 + 5_000,
    );
    if (network.action !== "retry") throw new Error("expected retry");
    expect(network.nextState.generationFailedSince).toBeNull();
  });

  it("tolerates 'session not found' only right after the session started", () => {
    const state = initialReclaimPollState(t0);
    expect(
      decideReclaimPollRetry(
        err("RECLAIM_SESSION_NOT_FOUND"),
        state,
        t0 + 5_000,
      ).action,
    ).toBe("retry");
    expect(
      decideReclaimPollRetry(
        err("RECLAIM_SESSION_NOT_FOUND"),
        state,
        t0 + RECLAIM_NOT_FOUND_GRACE_MS,
      ),
    ).toEqual({ action: "stop", reason: "RECLAIM_SESSION_NOT_FOUND" });
  });
});
