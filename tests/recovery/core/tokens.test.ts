import type { Address } from "viem";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  NATIVE_TOKEN_ADDRESS,
  RECOVERY_NETWORKS,
} from "@/recovery/core/networks";
import { fetchRecoveryTokens, isNativeToken } from "@/recovery/core/tokens";
import { SMART_ACCOUNT } from "../helpers/fixtures";

const mocks = vi.hoisted(() => ({
  client: {
    getBalance: vi.fn(),
    readContract: vi.fn(),
    getBlockNumber: vi.fn(),
    getLogs: vi.fn(),
  },
}));
vi.mock("@/recovery/core/account", () => ({
  getPublicClient: () => mocks.client,
}));

const CELO = RECOVERY_NETWORKS.celo;
const USDC = CELO.usdcAddress;
const USDT = CELO.extraTokens[0].address;
const OTHER_A = "0x00000000000000000000000000000000000000a1" as Address;
const OTHER_B = "0x00000000000000000000000000000000000000b1" as Address;

type TokenState = {
  balance?: bigint | Error;
  symbol?: string | Error;
  name?: string | Error;
  decimals?: number | Error;
};

/** Per-token on-chain state keyed by lowercase address. */
function chain(tokens: Record<string, TokenState>, native = 0n) {
  mocks.client.getBalance.mockResolvedValue(native);
  mocks.client.readContract.mockImplementation(
    async ({
      address,
      functionName,
    }: {
      address: string;
      functionName: string;
    }) => {
      const state = tokens[address.toLowerCase()];
      const key =
        functionName === "balanceOf"
          ? "balance"
          : (functionName as keyof TokenState);
      const value = state?.[key];
      if (value === undefined || value instanceof Error) {
        throw value ?? new Error(`no ${functionName} for ${address}`);
      }
      return value;
    },
  );
}

const logsFor = (...addresses: string[]) =>
  addresses.map((address) => ({ address }));

beforeEach(() => {
  for (const fn of Object.values(mocks.client)) fn.mockReset();
  mocks.client.getBlockNumber.mockResolvedValue(10_000n);
  mocks.client.getLogs.mockResolvedValue([]);
});

describe("isNativeToken", () => {
  it("is true only for the zero address", () => {
    expect(isNativeToken({ address: NATIVE_TOKEN_ADDRESS })).toBe(true);
    expect(isNativeToken({ address: USDC })).toBe(false);
  });
});

describe("fetchRecoveryTokens", () => {
  it("orders native, USDC, extra tokens, then discovered tokens", async () => {
    chain(
      {
        [USDC.toLowerCase()]: { balance: 5_000_000n },
        [USDT.toLowerCase()]: { balance: 1_000_000n },
        [OTHER_A]: {
          balance: 10n ** 18n,
          symbol: "AAA",
          name: "Token A",
          decimals: 18,
        },
      },
      2n * 10n ** 18n,
    );
    mocks.client.getLogs.mockResolvedValue(logsFor(OTHER_A));

    const tokens = await fetchRecoveryTokens("celo", SMART_ACCOUNT);

    expect(tokens.map((t) => t.symbol)).toEqual([
      "CELO",
      "USDC",
      "USDT",
      "AAA",
    ]);
    expect(tokens[0]).toEqual({
      symbol: "CELO",
      name: "Celo",
      address: NATIVE_TOKEN_ADDRESS,
      decimals: 18,
      balance: 2n * 10n ** 18n,
      formatted: "2",
    });
    expect(tokens[1]).toMatchObject({
      address: USDC,
      name: "USD Coin",
      decimals: 6,
      formatted: "5",
    });
    expect(tokens[2]).toMatchObject({
      address: USDT,
      name: "Tether USD",
      formatted: "1",
    });
    expect(tokens[3]).toMatchObject({
      address: OTHER_A,
      name: "Token A",
      balance: 10n ** 18n,
    });
  });

  it("lists native, USDC and extra tokens even at zero balance", async () => {
    chain({
      [USDC.toLowerCase()]: { balance: 0n },
      [USDT.toLowerCase()]: { balance: 0n },
    });
    const tokens = await fetchRecoveryTokens("celo", SMART_ACCOUNT);
    expect(tokens.map((t) => [t.symbol, t.balance, t.formatted])).toEqual([
      ["CELO", 0n, "0"],
      ["USDC", 0n, "0"],
      ["USDT", 0n, "0"],
    ]);
  });

  it("formats USDC with the network's own decimals (BNB uses 18)", async () => {
    chain({
      [RECOVERY_NETWORKS.bnb.usdcAddress.toLowerCase()]: {
        balance: 15n * 10n ** 17n,
      },
    });
    const [, usdc] = await fetchRecoveryTokens("bnb", SMART_ACCOUNT);
    expect(usdc).toMatchObject({ decimals: 18, formatted: "1.5" });
  });

  it("drops discovered tokens with a zero balance", async () => {
    chain({
      [USDC.toLowerCase()]: { balance: 1n },
      [USDT.toLowerCase()]: { balance: 1n },
      [OTHER_A]: { balance: 0n, symbol: "AAA" },
      [OTHER_B]: { balance: 7n, symbol: "BBB", name: "B", decimals: 0 },
    });
    mocks.client.getLogs.mockResolvedValue(logsFor(OTHER_A, OTHER_B));
    const tokens = await fetchRecoveryTokens("celo", SMART_ACCOUNT);
    expect(tokens.map((t) => t.symbol)).toEqual([
      "CELO",
      "USDC",
      "USDT",
      "BBB",
    ]);
    expect(tokens[3]).toMatchObject({ decimals: 0, formatted: "7" });
  });

  it("dedupes repeated log addresses and ignores log-address casing", async () => {
    chain({
      [OTHER_A]: { balance: 3n, symbol: "AAA", name: "A", decimals: 0 },
    });
    mocks.client.getLogs
      .mockResolvedValueOnce(
        logsFor(OTHER_A.toUpperCase().replace("0X", "0x"), OTHER_A),
      )
      .mockResolvedValueOnce(logsFor(OTHER_A));
    const tokens = await fetchRecoveryTokens("celo", SMART_ACCOUNT);
    expect(tokens.filter((t) => t.symbol === "AAA")).toHaveLength(1);
    expect(tokens.find((t) => t.symbol === "AAA")?.address).toBe(OTHER_A);
  });

  it("does not list USDC or an extra token twice when they appear in the logs", async () => {
    chain({
      [USDC.toLowerCase()]: { balance: 1n },
      [USDT.toLowerCase()]: { balance: 1n },
    });
    mocks.client.getLogs.mockResolvedValue(
      logsFor(USDC.toLowerCase(), USDT.toUpperCase().replace("0X", "0x")),
    );
    const tokens = await fetchRecoveryTokens("celo", SMART_ACCOUNT);
    expect(tokens.map((t) => t.symbol)).toEqual(["CELO", "USDC", "USDT"]);
  });

  it("falls back to UNKNOWN / Unknown Token / 18 when metadata cannot be read", async () => {
    chain({ [OTHER_A]: { balance: 10n ** 18n } });
    mocks.client.getLogs.mockResolvedValue(logsFor(OTHER_A));
    const tokens = await fetchRecoveryTokens("celo", SMART_ACCOUNT);
    expect(tokens.at(-1)).toMatchObject({
      address: OTHER_A,
      symbol: "UNKNOWN",
      name: "Unknown Token",
      decimals: 18,
      formatted: "1",
    });
  });

  it("skips a discovered token whose balanceOf fails (not an ERC-20)", async () => {
    chain({ [OTHER_A]: { balance: new Error("not a token") } });
    mocks.client.getLogs.mockResolvedValue(logsFor(OTHER_A));
    const tokens = await fetchRecoveryTokens("celo", SMART_ACCOUNT);
    expect(tokens.map((t) => t.symbol)).toEqual(["CELO"]);
  });

  describe("log scan", () => {
    it("still returns the always-listed tokens when getLogs fails", async () => {
      chain({ [USDC.toLowerCase()]: { balance: 4_000_000n } });
      mocks.client.getLogs.mockRejectedValue(new Error("range too large"));
      const tokens = await fetchRecoveryTokens("celo", SMART_ACCOUNT);
      expect(tokens.map((t) => t.symbol)).toEqual(["CELO", "USDC"]);
      expect(tokens[1].balance).toBe(4_000_000n);
    });

    it("still returns them when the block number cannot be read", async () => {
      chain({ [USDC.toLowerCase()]: { balance: 1n } });
      mocks.client.getBlockNumber.mockRejectedValue(new Error("down"));
      expect(
        (await fetchRecoveryTokens("celo", SMART_ACCOUNT)).map((t) => t.symbol),
      ).toEqual(["CELO", "USDC"]);
    });

    it("scans transfers from and to the account over the network's span", async () => {
      chain({});
      await fetchRecoveryTokens("celo", SMART_ACCOUNT);
      expect(mocks.client.getLogs).toHaveBeenCalledTimes(2);
      const argsOf = mocks.client.getLogs.mock.calls.map(([o]) => o.args);
      expect(argsOf).toContainEqual({ from: SMART_ACCOUNT });
      expect(argsOf).toContainEqual({ to: SMART_ACCOUNT });
      for (const [o] of mocks.client.getLogs.mock.calls) {
        expect(o.fromBlock).toBe(9_500n);
        expect(o.toBlock).toBe(10_000n);
      }
    });

    it("uses the narrower span on X Layer", async () => {
      chain({});
      await fetchRecoveryTokens("xlayer", SMART_ACCOUNT);
      expect(mocks.client.getLogs.mock.calls[0][0].fromBlock).toBe(9_900n);
    });

    it("starts at block 1 on a young chain", async () => {
      chain({});
      mocks.client.getBlockNumber.mockResolvedValue(200n);
      await fetchRecoveryTokens("celo", SMART_ACCOUNT);
      expect(mocks.client.getLogs.mock.calls[0][0].fromBlock).toBe(1n);
      mocks.client.getBlockNumber.mockResolvedValue(500n);
      mocks.client.getLogs.mockClear();
      await fetchRecoveryTokens("celo", SMART_ACCOUNT);
      expect(mocks.client.getLogs.mock.calls[0][0].fromBlock).toBe(1n);
    });
  });

  it("omits a known token whose balance read fails, like the original API route", async () => {
    chain({
      [USDC.toLowerCase()]: { balance: new Error("rpc") },
      [USDT.toLowerCase()]: { balance: 9n },
    });
    const tokens = await fetchRecoveryTokens("celo", SMART_ACCOUNT);
    expect(tokens.map((t) => t.symbol)).toEqual(["CELO", "USDT"]);
  });

  it("fails the whole call when the native balance cannot be read", async () => {
    chain({});
    mocks.client.getBalance.mockRejectedValue(new Error("rpc down"));
    await expect(fetchRecoveryTokens("celo", SMART_ACCOUNT)).rejects.toThrow(
      "rpc down",
    );
  });

  it("handles thousands of distinct log addresses, keeping only funded ones", async () => {
    const funded = "0x0000000000000000000000000000000000001234" as Address;
    chain({ [funded]: { balance: 1n, symbol: "FND", name: "F", decimals: 0 } });
    const many = Array.from({ length: 5_000 }, (_, i) => ({
      address: `0x${(i + 0x10000).toString(16).padStart(40, "0")}`,
    }));
    mocks.client.getLogs.mockResolvedValue([...many, { address: funded }]);
    const tokens = await fetchRecoveryTokens("celo", SMART_ACCOUNT);
    expect(tokens.map((t) => t.symbol)).toEqual(["CELO", "FND"]);
  });

  it("uses the network's configured native symbol (not always ETH)", async () => {
    chain({});
    const [native] = await fetchRecoveryTokens("monad", SMART_ACCOUNT);
    expect(native).toMatchObject({ symbol: "MON", decimals: 18 });
  });
});
