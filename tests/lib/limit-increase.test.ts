import { QueryClient } from "@tanstack/react-query";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { INTERNAL_HREFS } from "@/lib/constants";
import {
  clearLimitReturn,
  getLimitReturnTarget,
  invalidateLimitQueries,
  readLimitReturn,
  saveLimitReturn,
} from "@/lib/limit-increase";
import {
  getUserFacingErrorMessage,
  isAlreadyVerifiedError,
} from "@/lib/user-facing-error";

describe("limit return (resume order after verifying)", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.useRealTimers();
  });

  it("round-trips a Buy order and targets /buy with the crypto prefill", () => {
    saveLimitReturn({ flow: "buy", cryptoAmount: 250 });
    const entry = readLimitReturn();
    expect(entry?.flow).toBe("buy");
    expect(entry && getLimitReturnTarget(entry)).toEqual({
      to: INTERNAL_HREFS.BUY,
      state: { prefill: { crypto: 250 } },
    });
  });

  it("uses each screen's own prefill shape for Sell and Pay", () => {
    saveLimitReturn({ flow: "sell", cryptoAmount: 40 });
    const sell = readLimitReturn();
    expect(sell && getLimitReturnTarget(sell)).toEqual({
      to: INTERNAL_HREFS.SELL,
      state: { prefillCryptoAmount: 40 },
    });

    saveLimitReturn({ flow: "pay", fiatAmount: 1999 });
    const pay = readLimitReturn();
    expect(pay && getLimitReturnTarget(pay)).toEqual({
      to: INTERNAL_HREFS.PAY,
      state: { prefill: { fiat: 1999 } },
    });
  });

  it("drops empty / invalid amounts instead of prefilling NaN or 0", () => {
    saveLimitReturn({ flow: "buy", cryptoAmount: Number.NaN });
    const entry = readLimitReturn();
    expect(entry?.cryptoAmount).toBeUndefined();
    expect(entry && getLimitReturnTarget(entry)).toEqual({
      to: INTERNAL_HREFS.BUY,
      state: undefined,
    });
  });

  it("expires after an hour", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T00:00:00Z"));
    saveLimitReturn({ flow: "sell", cryptoAmount: 10 });
    vi.setSystemTime(new Date("2026-01-01T01:00:01Z"));
    expect(readLimitReturn()).toBeNull();
    expect(localStorage.getItem("@P2PME:LIMIT_RETURN")).toBeNull();
  });

  it("ignores tampered or corrupt storage", () => {
    localStorage.setItem("@P2PME:LIMIT_RETURN", "{not json");
    expect(readLimitReturn()).toBeNull();
    localStorage.setItem(
      "@P2PME:LIMIT_RETURN",
      JSON.stringify({ flow: "withdraw", savedAt: Date.now() }),
    );
    expect(readLimitReturn()).toBeNull();
  });

  it("clears", () => {
    saveLimitReturn({ flow: "buy", cryptoAmount: 1 });
    clearLimitReturn();
    expect(readLimitReturn()).toBeNull();
  });
});

describe("invalidateLimitQueries", () => {
  afterEach(() => vi.restoreAllMocks());

  it("invalidates every per-wallet limit query, whatever the address/currency", async () => {
    const client = new QueryClient();
    const spy = vi.spyOn(client, "invalidateQueries");
    await invalidateLimitQueries(client);
    const keys = spy.mock.calls.map(([filters]) => filters?.queryKey);
    expect(keys).toEqual(
      expect.arrayContaining([
        ["tx-limit"],
        ["user-rp"],
        ["task-ledger"],
        ["on-chain-activity-rp"],
      ]),
    );
  });
});

describe("already-verified errors", () => {
  const t = ((key: string) => key) as unknown as Parameters<
    typeof getUserFacingErrorMessage
  >[0];

  it("detects a SocialAlreadyVerified revert by its selector", () => {
    const error = new Error(
      "execution reverted: custom error 0x2f850b6b (SocialAlreadyVerified)",
    );
    expect(isAlreadyVerifiedError(error)).toBe(true);
    expect(getUserFacingErrorMessage(t, error)).toBe(
      "ERROR_ALREADY_VERIFIED_DESCRIPTION",
    );
  });

  it("detects BVN and nullifier reuse", () => {
    expect(isAlreadyVerifiedError("0x27fec7ec")).toBe(true);
    expect(isAlreadyVerifiedError("reverted with 0x0f165e7b")).toBe(true);
  });

  it("does not flag ordinary failures", () => {
    expect(isAlreadyVerifiedError(new Error("Failed to fetch"))).toBe(false);
    expect(getUserFacingErrorMessage(t, new Error("Failed to fetch"))).toBe(
      "ERROR_NETWORK_DESCRIPTION",
    );
  });
});
