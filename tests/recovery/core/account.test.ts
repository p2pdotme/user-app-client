import {
  decodeFunctionData,
  encodeAbiParameters,
  type Hex,
  keccak256,
  pad,
  slice,
  toHex,
  zeroAddress,
} from "viem";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ACCOUNT_FACTORY_ABI } from "@/recovery/core/abis";
import {
  deriveSmartAccountAddress,
  getInitCode,
  getPublicClient,
  hasCode,
  isAccountDeployed,
  isFactoryDeployed,
  waitForAccountDeployment,
  waitForCode,
} from "@/recovery/core/account";
import { RecoveryError } from "@/recovery/core/errors";
import { RECOVERY_NETWORKS } from "@/recovery/core/networks";
import { OWNER, SMART_ACCOUNT } from "../helpers/fixtures";

const mocks = vi.hoisted(() => ({
  client: {
    getCode: vi.fn(),
    readContract: vi.fn(),
  },
  createPublicClient: vi.fn(),
}));

vi.mock("viem", async (importOriginal) => ({
  ...(await importOriginal<typeof import("viem")>()),
  createPublicClient: mocks.createPublicClient,
}));

const FACTORY = RECOVERY_NETWORKS.optimism.factoryAddress;

beforeEach(() => {
  mocks.createPublicClient.mockReturnValue(mocks.client);
  mocks.client.getCode.mockReset();
  mocks.client.readContract.mockReset();
});
afterEach(() => {
  vi.useRealTimers();
});

describe("getPublicClient", () => {
  it("creates one client per network on that network's chain and RPC, then caches it", () => {
    mocks.createPublicClient.mockClear();
    const first = getPublicClient("avax");
    const again = getPublicClient("avax");
    expect(again).toBe(first);
    expect(mocks.createPublicClient).toHaveBeenCalledTimes(1);
    const [options] = mocks.createPublicClient.mock.calls[0];
    expect(options.chain.id).toBe(43114);
    expect(options.chain.rpcUrls.default.http[0]).toBe(
      "https://avax.api.pocket.network",
    );
    expect(options.transport).toBeTypeOf("function");
  });

  it("does not share clients between networks", () => {
    mocks.createPublicClient.mockClear();
    getPublicClient("mantle");
    getPublicClient("celo");
    expect(mocks.createPublicClient).toHaveBeenCalledTimes(2);
  });
});

describe("hasCode / isFactoryDeployed / isAccountDeployed", () => {
  it.each([
    ["0x6080", true],
    ["0x", false],
    [undefined, false],
  ])("code %j -> %s", async (code, expected) => {
    mocks.client.getCode.mockResolvedValue(code);
    expect(await hasCode("optimism", SMART_ACCOUNT)).toBe(expected);
  });

  it("hasCode propagates RPC failures", async () => {
    mocks.client.getCode.mockRejectedValue(new Error("rpc down"));
    await expect(hasCode("optimism", SMART_ACCOUNT)).rejects.toThrow(
      "rpc down",
    );
  });

  it("isFactoryDeployed checks the network's factory address", async () => {
    mocks.client.getCode.mockResolvedValue("0x60");
    expect(await isFactoryDeployed("optimism")).toBe(true);
    expect(mocks.client.getCode).toHaveBeenCalledWith({ address: FACTORY });
  });

  it("isAccountDeployed counts an unreachable RPC as not deployed", async () => {
    mocks.client.getCode.mockRejectedValue(new Error("rpc down"));
    expect(await isAccountDeployed(SMART_ACCOUNT, "optimism")).toBe(false);
    mocks.client.getCode.mockResolvedValue("0x60");
    expect(await isAccountDeployed(SMART_ACCOUNT, "optimism")).toBe(true);
  });
});

describe("waitForCode", () => {
  it("returns true immediately without sleeping", async () => {
    const check = vi.fn().mockResolvedValue(true);
    expect(await waitForCode(check)).toBe(true);
    expect(check).toHaveBeenCalledTimes(1);
  });

  it("polls every 2s and stops as soon as the check passes", async () => {
    vi.useFakeTimers();
    const check = vi
      .fn()
      .mockResolvedValueOnce(false)
      .mockResolvedValueOnce(false)
      .mockResolvedValueOnce(true);
    const p = waitForCode(check);
    await vi.advanceTimersByTimeAsync(0);
    expect(check).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(1999);
    expect(check).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(1);
    expect(check).toHaveBeenCalledTimes(2);
    await vi.advanceTimersByTimeAsync(2000);
    expect(await p).toBe(true);
    expect(check).toHaveBeenCalledTimes(3);
  });

  it("gives up after 10 attempts having slept 9 times (18s)", async () => {
    vi.useFakeTimers();
    const check = vi.fn().mockResolvedValue(false);
    const p = waitForCode(check);
    await vi.advanceTimersByTimeAsync(18_000);
    expect(await p).toBe(false);
    expect(check).toHaveBeenCalledTimes(10);
  });

  it("honours custom attempts and delay", async () => {
    vi.useFakeTimers();
    const check = vi.fn().mockResolvedValue(false);
    const p = waitForCode(check, 3, 100);
    await vi.advanceTimersByTimeAsync(200);
    expect(await p).toBe(false);
    expect(check).toHaveBeenCalledTimes(3);
  });

  it("waitForAccountDeployment polls the account's code", async () => {
    vi.useFakeTimers();
    mocks.client.getCode.mockResolvedValueOnce("0x").mockResolvedValue("0x60");
    const p = waitForAccountDeployment(SMART_ACCOUNT, "optimism", 5, 50);
    await vi.advanceTimersByTimeAsync(50);
    expect(await p).toBe(true);
    expect(mocks.client.getCode).toHaveBeenCalledTimes(2);
  });
});

describe("deriveSmartAccountAddress", () => {
  it("reads getAddress(owner, 0x) from the factory", async () => {
    mocks.client.getCode.mockResolvedValue("0x60");
    mocks.client.readContract.mockResolvedValue(SMART_ACCOUNT);
    expect(await deriveSmartAccountAddress(OWNER, "optimism")).toBe(
      SMART_ACCOUNT,
    );
    expect(mocks.client.readContract).toHaveBeenCalledWith(
      expect.objectContaining({
        address: FACTORY,
        abi: ACCOUNT_FACTORY_ABI,
        functionName: "getAddress",
        args: [OWNER, "0x"],
      }),
    );
  });

  it("throws FactoryNotDeployed when the factory has no code", async () => {
    mocks.client.getCode.mockResolvedValue("0x");
    const err = await deriveSmartAccountAddress(OWNER, "optimism").catch(
      (e) => e,
    );
    expect(err).toBeInstanceOf(RecoveryError);
    expect(err.code).toBe("FactoryNotDeployed");
    expect(mocks.client.readContract).not.toHaveBeenCalled();
  });

  it("throws DeriveFailed (with cause) when the code check cannot reach the RPC", async () => {
    const cause = new Error("rpc down");
    mocks.client.getCode.mockRejectedValue(cause);
    const err = await deriveSmartAccountAddress(OWNER, "optimism").catch(
      (e) => e,
    );
    expect(err.code).toBe("DeriveFailed");
    expect(err.cause).toBe(cause);
  });

  it.each([
    [
      "the call reverts",
      () => mocks.client.readContract.mockRejectedValue(new Error("revert")),
    ],
    [
      "the factory returns the zero address",
      () => mocks.client.readContract.mockResolvedValue(zeroAddress),
    ],
    [
      "the factory returns nothing",
      () => mocks.client.readContract.mockResolvedValue(undefined),
    ],
  ])("throws DeriveFailed when %s", async (_n, arrange) => {
    mocks.client.getCode.mockResolvedValue("0x60");
    arrange();
    const err = await deriveSmartAccountAddress(OWNER, "optimism").catch(
      (e) => e,
    );
    expect(err).toBeInstanceOf(RecoveryError);
    expect(err.code).toBe("DeriveFailed");
  });
});

describe("getInitCode", () => {
  const selector = slice(
    keccak256(toHex("createAccount(address,bytes)")),
    0,
    4,
  );

  it("is factory address ++ createAccount(owner, 0x), laid out by hand", () => {
    const expected =
      `${FACTORY.toLowerCase()}${selector.slice(2)}` +
      pad(OWNER as Hex, { size: 32 }).slice(2) +
      pad("0x40", { size: 32 }).slice(2) + // offset of the bytes argument
      pad("0x00", { size: 32 }).slice(2); // empty bytes
    expect(getInitCode(FACTORY, OWNER)).toBe(expected);
  });

  it("starts with the lowercase factory address and decodes back to (owner, 0x)", () => {
    const initCode = getInitCode(FACTORY, OWNER);
    expect(initCode.startsWith(FACTORY.toLowerCase())).toBe(true);
    expect(initCode.slice(0, 42)).toBe(FACTORY.toLowerCase());
    const decoded = decodeFunctionData({
      abi: ACCOUNT_FACTORY_ABI,
      data: `0x${initCode.slice(42)}`,
    });
    expect(decoded.functionName).toBe("createAccount");
    const [owner, data] = decoded.args as [string, string];
    expect(owner.toLowerCase()).toBe(OWNER);
    expect(data).toBe("0x");
  });

  it("is 20 + 4 + 96 bytes", () => {
    expect((getInitCode(FACTORY, OWNER).length - 2) / 2).toBe(20 + 4 + 96);
  });

  it("uses the owner it is given (checksummed or not)", () => {
    const owner = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48" as const;
    const encoded = encodeAbiParameters([{ type: "address" }], [owner]).slice(
      2,
    );
    expect(getInitCode(FACTORY, owner)).toContain(encoded);
    expect(getInitCode(FACTORY, owner.toLowerCase() as typeof owner)).toContain(
      encoded,
    );
  });
});
