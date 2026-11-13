import { act, renderHook, waitFor } from "@testing-library/react";
import * as thirdwebReact from "thirdweb/react";
import type { Wallet } from "thirdweb/wallets";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { RecoveryError, type RecoveryToken } from "@/recovery/core";
import {
  parseTokenAmount,
  useRecoveryTransfer,
  validateTransfer,
} from "@/recovery/hooks/use-recovery-transfer";
import { createQueryWrapper } from "../helpers/query";

const mocks = vi.hoisted(() => ({ send: vi.fn() }));
vi.mock("@/recovery/core", async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  sendRecoveryTransfer: mocks.send,
}));

const RECIPIENT = "0x00000000000000000000000000000000000000c3";
const SMART_ACCOUNT = "0x00000000000000000000000000000000000000b2";
const token = (over: Partial<RecoveryToken> = {}): RecoveryToken => ({
  symbol: "TKN",
  name: "Token",
  address: "0x00000000000000000000000000000000000000d4",
  decimals: 18,
  balance: 10n ** 18n,
  formatted: "1",
  ...over,
});

describe("parseTokenAmount", () => {
  it.each([
    ["1", 18, 10n ** 18n],
    ["0", 18, 0n],
    ["0.000000000000000001", 18, 1n], // 18-decimal precision, one wei
    [
      "123456789012345678901234567890.123456789012345678",
      18,
      123456789012345678901234567890123456789012345678n,
    ],
    ["1.5", 6, 1_500_000n],
    [".5", 18, 5n * 10n ** 17n],
    ["  2.25  ", 6, 2_250_000n],
    ["007", 6, 7_000_000n],
    ["1.000000", 6, 1_000_000n],
  ])("parses %j with %i decimals", (input, decimals, expected) => {
    expect(parseTokenAmount(input, decimals)).toBe(expected);
  });

  it.each([
    [""],
    ["   "],
    ["."],
    ["1."], // trailing dot is rejected, not truncated
    ["-1"],
    ["-0.5"],
    ["+1"],
    ["1e3"],
    ["1E-2"],
    ["0x10"],
    ["1,5"],
    ["1.2.3"],
    ["1 000"],
    ["NaN"],
    ["Infinity"],
    ["१२३"], // Devanagari digits
    ["１２"], // full-width digits
    ["1\n2"],
    ["\u{1F4B0}"],
  ])("returns null for %j", (input) => {
    expect(parseTokenAmount(input, 18)).toBeNull();
  });

  it("throws a TypeError for undefined (callers are typed to pass a string)", () => {
    expect(() => parseTokenAmount(undefined as never, 18)).toThrow();
  });

  // Regression (fixed in use-recovery-transfer.ts): viem's parseUnits ROUNDS
  // extra fractional digits instead of failing, so the amount that is sent is
  // not the amount that was typed (and 0.0000005 USDC becomes 0.000001).
  it("rejects an amount with more decimals than the token has", () => {
    expect(parseTokenAmount("1.0000005", 6)).toBeNull();
  });

  it("does not round a sub-unit amount up to one base unit", () => {
    expect(parseTokenAmount("0.0000005", 6)).not.toBe(1n);
  });

  it("rejects extra digits even when they would round down", () => {
    expect(parseTokenAmount("1.0000004", 6)).toBeNull();
    expect(parseTokenAmount("0.0000004", 6)).toBeNull();
  });

  it("accepts exactly as many decimals as the token has", () => {
    expect(parseTokenAmount("1.000001", 6)).toBe(1_000_001n);
  });
});

describe("validateTransfer", () => {
  const ok = (over: object = {}) =>
    validateTransfer({
      token: token(),
      recipient: RECIPIENT,
      amount: "0.5",
      ...over,
    });

  it("accepts a valid transfer and returns the parsed recipient and base units", () => {
    expect(ok()).toEqual({
      ok: true,
      recipient: RECIPIENT,
      amount: 5n * 10n ** 17n,
    });
  });

  it("trims the recipient", () => {
    expect(ok({ recipient: `  ${RECIPIENT}\n` })).toMatchObject({
      ok: true,
      recipient: RECIPIENT,
    });
  });

  it("accepts a correctly checksummed recipient", () => {
    const checksummed = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";
    expect(ok({ recipient: checksummed })).toMatchObject({
      ok: true,
      recipient: checksummed,
    });
  });

  it.each([
    [""],
    ["0x"],
    ["0x123"],
    ["not an address"],
    [RECIPIENT.slice(0, -1)],
    [`${RECIPIENT}0`],
    ["A0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48"], // no 0x
    ["0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eb48"], // bad checksum
    ["vitalik.eth"],
  ])("rejects recipient %j", (recipient) => {
    expect(ok({ recipient })).toEqual({
      ok: false,
      reason: "InvalidRecipient",
    });
  });

  it.each([[""], ["0"], ["0.000"], ["-1"], ["abc"], ["1e2"], ["1."]])(
    "rejects amount %j as InvalidAmount",
    (amount) => {
      expect(ok({ amount })).toEqual({ ok: false, reason: "InvalidAmount" });
    },
  );

  it("allows exactly the balance", () => {
    expect(ok({ amount: "1" })).toEqual({
      ok: true,
      recipient: RECIPIENT,
      amount: 10n ** 18n,
    });
  });

  it("rejects one base unit more than the balance as Insufficient", () => {
    expect(ok({ amount: "1.000000000000000001" })).toEqual({
      ok: false,
      reason: "Insufficient",
    });
  });

  it("is exact for 18-decimal balances that floats cannot represent", () => {
    const t = token({ balance: 123456789012345678n });
    expect(ok({ token: t, amount: "0.123456789012345678" })).toMatchObject({
      ok: true,
    });
    expect(ok({ token: t, amount: "0.123456789012345679" })).toEqual({
      ok: false,
      reason: "Insufficient",
    });
  });

  it("respects the token's decimals", () => {
    const usdc = token({ decimals: 6, balance: 2_500_000n });
    expect(ok({ token: usdc, amount: "2.5" })).toMatchObject({
      ok: true,
      amount: 2_500_000n,
    });
    expect(ok({ token: usdc, amount: "2.500001" })).toEqual({
      ok: false,
      reason: "Insufficient",
    });
  });

  it("with a zero balance, any positive amount is Insufficient", () => {
    expect(
      ok({ token: token({ balance: 0n }), amount: "0.000000000000000001" }),
    ).toEqual({
      ok: false,
      reason: "Insufficient",
    });
  });

  it("reports the recipient problem before the amount problem", () => {
    expect(ok({ recipient: "x", amount: "bad" })).toEqual({
      ok: false,
      reason: "InvalidRecipient",
    });
  });
});

describe("useRecoveryTransfer", () => {
  const wallet = { id: "wallet" } as unknown as Wallet;
  const input = (over: object = {}) => ({
    smartAccount: SMART_ACCOUNT as `0x${string}`,
    token: token(),
    recipient: RECIPIENT,
    amount: "0.5",
    ...over,
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  beforeEach(() => {
    mocks.send
      .mockReset()
      .mockResolvedValue({ status: "confirmed", txHash: "0xabc" });
    vi.spyOn(thirdwebReact, "useActiveWallet").mockReturnValue(wallet);
  });

  it("rejects with WalletNotConnected when logged out", async () => {
    vi.spyOn(thirdwebReact, "useActiveWallet").mockReturnValue(undefined);
    const { Wrapper } = createQueryWrapper();
    const { result } = renderHook(() => useRecoveryTransfer("optimism"), {
      wrapper: Wrapper,
    });
    const err = await act(() =>
      result.current.mutateAsync(input()).catch((e) => e),
    );
    expect(err).toBeInstanceOf(RecoveryError);
    expect(err.code).toBe("WalletNotConnected");
    expect(mocks.send).not.toHaveBeenCalled();
  });

  it("rejects invalid input before sending anything", async () => {
    const { Wrapper } = createQueryWrapper();
    const { result } = renderHook(() => useRecoveryTransfer("optimism"), {
      wrapper: Wrapper,
    });
    const err = await act(() =>
      result.current.mutateAsync(input({ amount: "5" })).catch((e) => e),
    );
    expect(err.code).toBe("Unknown");
    expect(err.message).toBe("Insufficient");
    expect(mocks.send).not.toHaveBeenCalled();
  });

  it("sends the validated recipient and base-unit amount, then invalidates recovery queries", async () => {
    const { Wrapper, queryClient } = createQueryWrapper();
    const invalidate = vi.spyOn(queryClient, "invalidateQueries");
    const { result } = renderHook(() => useRecoveryTransfer("optimism"), {
      wrapper: Wrapper,
    });

    const sent = token();
    await act(() =>
      result.current.mutateAsync(
        input({ token: sent, recipient: ` ${RECIPIENT} ` }),
      ),
    );

    expect(mocks.send).toHaveBeenCalledWith({
      wallet,
      network: "optimism",
      smartAccount: SMART_ACCOUNT,
      token: sent,
      recipient: RECIPIENT,
      amount: 5n * 10n ** 17n,
    });
    await waitFor(() =>
      expect(invalidate).toHaveBeenCalledWith({ queryKey: ["recovery"] }),
    );
  });

  it("surfaces InsufficientGas with the funding address and does not invalidate", async () => {
    mocks.send.mockRejectedValue(
      new RecoveryError("InsufficientGas", "fund", {
        fundingAddress: SMART_ACCOUNT,
      }),
    );
    const { Wrapper, queryClient } = createQueryWrapper();
    const invalidate = vi.spyOn(queryClient, "invalidateQueries");
    const { result } = renderHook(() => useRecoveryTransfer("optimism"), {
      wrapper: Wrapper,
    });
    const err = await act(() =>
      result.current.mutateAsync(input()).catch((e) => e),
    );
    expect(err.code).toBe("InsufficientGas");
    expect(err.fundingAddress).toBe(SMART_ACCOUNT);
    expect(invalidate).not.toHaveBeenCalled();
  });
});
