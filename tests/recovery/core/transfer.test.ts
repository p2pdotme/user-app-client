import type { Wallet } from "thirdweb/wallets";
import {
  decodeFunctionData,
  encodeFunctionData,
  type Hex,
  maxUint256,
  parseAbi,
} from "viem";
import { getUserOperationHash } from "viem/account-abstraction";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  ACCOUNT_FACTORY_ABI,
  ERC20_ABI,
  SMART_ACCOUNT_ABI,
} from "@/recovery/core/abis";
import { RecoveryError } from "@/recovery/core/errors";
import {
  NATIVE_TOKEN_ADDRESS,
  RECOVERY_NETWORKS,
} from "@/recovery/core/networks";
import {
  deploySmartAccount,
  encodeTransferCall,
  sendRecoveryTransfer,
} from "@/recovery/core/transfer";
import { DUMMY_SIGNATURE } from "@/recovery/core/user-op";
import {
  OWNER,
  RECIPIENT,
  SIGNATURE,
  SMART_ACCOUNT,
} from "../helpers/fixtures";
import { installRpc, type RpcCall, type RpcHandler } from "../helpers/rpc";

// networks.ts reads the key at import time, so it must be set before any import runs
vi.hoisted(() => {
  vi.stubEnv("VITE_PIMLICO_API_KEY", "pim_test");
});

const mocks = vi.hoisted(() => ({
  client: { clientId: "cid-123" },
  chainClient: { readContract: vi.fn() },
  isAccountDeployed: vi.fn(),
  waitForAccountDeployment: vi.fn(),
  getDirectGasFees: vi.fn(),
  submitUserOpDirect: vi.fn(),
}));

vi.mock("@/core/adapters/thirdweb/client", () => ({
  thirdwebClient: mocks.client,
}));
vi.mock("@/recovery/core/account", async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  getPublicClient: () => mocks.chainClient,
  isAccountDeployed: mocks.isAccountDeployed,
  waitForAccountDeployment: mocks.waitForAccountDeployment,
}));
vi.mock("@/recovery/core/direct", async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  getDirectGasFees: mocks.getDirectGasFees,
  submitUserOpDirect: mocks.submitUserOpDirect,
}));

const OP = RECOVERY_NETWORKS.optimism;
const CHAIN_ID = 10;
const THIRDWEB_URL = `https://${CHAIN_ID}.bundler.thirdweb.com/v2`;
const PIMLICO_URL = OP.bundlerUrl as string;
const USER_OP_HASH = `0x${"11".repeat(32)}` as Hex;
const TX = `0x${"33".repeat(32)}` as Hex;
const SPONSORED = `0x${"cc".repeat(60)}` as Hex;
const USDC = OP.usdcAddress;

const signMessage = vi.fn();
function makeWallet({ connected = true } = {}): Wallet {
  const admin = { address: OWNER, signMessage };
  return {
    getAccount: () => (connected ? admin : undefined),
    getAdminAccount: () => (connected ? admin : undefined),
  } as unknown as Wallet;
}

const baseHandlers = (): Record<string, RpcHandler> => ({
  pimlico_getUserOperationGasPrice: () => ({
    standard: { maxFeePerGas: "0x64", maxPriorityFeePerGas: "0xa" },
  }),
  thirdweb_getUserOperationGasPrice: () => ({
    maxFeePerGas: "0x3b9aca00",
    maxPriorityFeePerGas: "0x1dcd6500",
  }),
  eth_sendUserOperation: () => USER_OP_HASH,
  eth_getUserOperationReceipt: () => ({
    success: true,
    receipt: { transactionHash: TX },
  }),
});

const sponsoredWithLimits: RpcHandler = () => ({
  paymasterAndData: SPONSORED,
  callGasLimit: "0x11",
  verificationGasLimit: "0x22",
  preVerificationGas: "0x33",
});

const unsponsored = (): Record<string, RpcHandler> => ({
  ...baseHandlers(),
  pm_sponsorUserOperation: () => null,
  eth_estimateUserOperationGas: () => ({}),
});

/** Drives fake timers until the promise settles; returns it so callers can await or assert. */
function drive<T>(promise: Promise<T>): Promise<T> {
  promise.catch(() => {});
  return vi.advanceTimersByTimeAsync(120_000).then(() => promise);
}

const sentOp = (calls: RpcCall[]) =>
  calls.find((c) => c.method === "eth_sendUserOperation")?.params[0];

/** Hash of an op as the bundler received it, via viem's independent implementation. */
function viemHashOfSent(sent: Record<string, Hex>, chainId = CHAIN_ID) {
  return getUserOperationHash({
    chainId,
    entryPointAddress: OP.entryPoint,
    entryPointVersion: "0.6",
    userOperation: {
      sender: sent.sender,
      nonce: BigInt(sent.nonce),
      initCode: sent.initCode,
      callData: sent.callData,
      callGasLimit: BigInt(sent.callGasLimit),
      verificationGasLimit: BigInt(sent.verificationGasLimit),
      preVerificationGas: BigInt(sent.preVerificationGas),
      maxFeePerGas: BigInt(sent.maxFeePerGas),
      maxPriorityFeePerGas: BigInt(sent.maxPriorityFeePerGas),
      paymasterAndData: sent.paymasterAndData,
      signature: "0x",
    } as never,
  });
}

beforeEach(() => {
  vi.useFakeTimers();
  signMessage.mockReset().mockResolvedValue(SIGNATURE);
  mocks.chainClient.readContract.mockReset().mockResolvedValue(9n);
  mocks.isAccountDeployed.mockReset().mockResolvedValue(true);
  mocks.waitForAccountDeployment.mockReset().mockResolvedValue(true);
  mocks.getDirectGasFees
    .mockReset()
    .mockResolvedValue({ maxFeePerGas: 40n, maxPriorityFeePerGas: 41n });
  mocks.submitUserOpDirect.mockReset().mockResolvedValue({ txHash: TX });
});
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

const transfer = (
  overrides: Partial<Parameters<typeof sendRecoveryTransfer>[0]> = {},
) =>
  sendRecoveryTransfer({
    wallet: makeWallet(),
    network: "optimism",
    smartAccount: SMART_ACCOUNT,
    token: { address: NATIVE_TOKEN_ADDRESS },
    recipient: RECIPIENT,
    amount: 1_000n,
    ...overrides,
  });

describe("encodeTransferCall", () => {
  it("native: execute(recipient, amount, 0x), with the standard execute selector", () => {
    const data = encodeTransferCall(
      { address: NATIVE_TOKEN_ADDRESS },
      RECIPIENT,
      12345n,
    );
    expect(data.slice(0, 10)).toBe("0xb61d27f6"); // execute(address,uint256,bytes)
    const decoded = decodeFunctionData({ abi: SMART_ACCOUNT_ABI, data });
    expect(decoded.functionName).toBe("execute");
    const [dest, value, func] = decoded.args as [string, bigint, string];
    expect(dest.toLowerCase()).toBe(RECIPIENT);
    expect(value).toBe(12345n);
    expect(func).toBe("0x");
  });

  it("ERC-20: execute(token, 0, transfer(recipient, amount))", () => {
    const data = encodeTransferCall({ address: USDC }, RECIPIENT, 2_500_000n);
    const outer = decodeFunctionData({ abi: SMART_ACCOUNT_ABI, data });
    const [dest, value, func] = outer.args as [string, bigint, Hex];
    expect(dest).toBe(USDC);
    expect(value).toBe(0n);
    expect(func.slice(0, 10)).toBe("0xa9059cbb"); // transfer(address,uint256)
    const inner = decodeFunctionData({ abi: ERC20_ABI, data: func });
    expect(inner.functionName).toBe("transfer");
    const [to, amount] = inner.args as [string, bigint];
    expect(to.toLowerCase()).toBe(RECIPIENT);
    expect(amount).toBe(2_500_000n);
  });

  it("matches calldata encoded independently with a different ABI source", () => {
    const abi = parseAbi(["function execute(address,uint256,bytes)"]);
    expect(
      encodeTransferCall({ address: NATIVE_TOKEN_ADDRESS }, RECIPIENT, 7n),
    ).toBe(
      encodeFunctionData({
        abi,
        functionName: "execute",
        args: [RECIPIENT, 7n, "0x"],
      }),
    );
  });

  it("handles amount 0 and uint256 max", () => {
    const zero = decodeFunctionData({
      abi: SMART_ACCOUNT_ABI,
      data: encodeTransferCall(
        { address: NATIVE_TOKEN_ADDRESS },
        RECIPIENT,
        0n,
      ),
    });
    expect((zero.args as readonly unknown[])[1]).toBe(0n);
    const max = decodeFunctionData({
      abi: SMART_ACCOUNT_ABI,
      data: encodeTransferCall(
        { address: NATIVE_TOKEN_ADDRESS },
        RECIPIENT,
        maxUint256,
      ),
    });
    expect((max.args as readonly unknown[])[1]).toBe(maxUint256);
  });

  it("treats the native sentinel as native regardless of case form", () => {
    const upper = "0x0000000000000000000000000000000000000000" as const;
    expect(encodeTransferCall({ address: upper }, RECIPIENT, 1n)).toBe(
      encodeTransferCall({ address: NATIVE_TOKEN_ADDRESS }, RECIPIENT, 1n),
    );
  });

  it("rejects an invalid recipient instead of encoding garbage", () => {
    expect(() =>
      encodeTransferCall({ address: USDC }, "0xnot-an-address" as never, 1n),
    ).toThrow();
  });
});

describe("sendRecoveryTransfer on a bundler network", () => {
  it("builds the op from the chain nonce for the right entry point", async () => {
    const rpc = installRpc({
      ...baseHandlers(),
      pm_sponsorUserOperation: sponsoredWithLimits,
    });
    await drive(transfer());
    expect(mocks.chainClient.readContract).toHaveBeenCalledWith(
      expect.objectContaining({
        address: OP.entryPoint,
        functionName: "getNonce",
        args: [SMART_ACCOUNT, 0n],
      }),
    );
    const sent = sentOp(rpc.calls);
    expect(sent.sender).toBe(SMART_ACCOUNT);
    expect(BigInt(sent.nonce)).toBe(9n);
    expect(rpc.named("eth_sendUserOperation")[0].params[1]).toBe(OP.entryPoint);
    expect(sent.callData).toBe(
      encodeTransferCall({ address: NATIVE_TOKEN_ADDRESS }, RECIPIENT, 1_000n),
    );
  });

  it("sends a sponsored op to Thirdweb's bundler with the x-client-id header", async () => {
    const rpc = installRpc({
      ...baseHandlers(),
      pm_sponsorUserOperation: sponsoredWithLimits,
    });
    const result = await drive(transfer());

    const [send] = rpc.named("eth_sendUserOperation");
    expect(send.url).toBe(THIRDWEB_URL);
    expect(send.headers["x-client-id"]).toBe("cid-123");
    expect(send.params[0].paymasterAndData).toBe(SPONSORED);
    // receipt polling follows the same bundler
    const [receipt] = rpc.named("eth_getUserOperationReceipt");
    expect(receipt.url).toBe(THIRDWEB_URL);
    expect(receipt.headers["x-client-id"]).toBe("cid-123");
    expect(receipt.params).toEqual([USER_OP_HASH]);
    expect(result).toEqual({
      status: "confirmed",
      txHash: TX,
      userOpHash: USER_OP_HASH,
    });
  });

  it("signs the final, post-sponsorship op with the owner (raw hash)", async () => {
    const rpc = installRpc({
      ...baseHandlers(),
      pm_sponsorUserOperation: sponsoredWithLimits,
    });
    await drive(transfer());

    const sent = sentOp(rpc.calls);
    expect(sent.signature).toBe(SIGNATURE);
    expect(signMessage).toHaveBeenCalledTimes(1);
    expect(signMessage).toHaveBeenCalledWith({
      message: { raw: viemHashOfSent(sent) },
    });
    // the paymaster's limits and fees are what was signed
    expect(BigInt(sent.callGasLimit)).toBe(0x11n);
    expect(BigInt(sent.maxFeePerGas)).toBe(0x3b9aca00n);
  });

  it("signs the re-signed op when the paymaster is asked twice", async () => {
    let pmCalls = 0;
    const RESIGNED = `0x${"dd".repeat(60)}` as Hex;
    const rpc = installRpc({
      ...baseHandlers(),
      pm_sponsorUserOperation: () =>
        ++pmCalls === 1
          ? { paymasterAndData: SPONSORED }
          : { paymasterAndData: RESIGNED },
      eth_estimateUserOperationGas: () => ({
        callGasLimit: "0x7a120",
        verificationGasLimit: "0x61a80",
        preVerificationGas: "0x1388",
      }),
    });
    await drive(transfer());
    const sent = sentOp(rpc.calls);
    expect(sent.paymasterAndData).toBe(RESIGNED);
    expect(BigInt(sent.callGasLimit)).toBe(500_000n);
    expect(signMessage).toHaveBeenCalledWith({
      message: { raw: viemHashOfSent(sent) },
    });
  });

  it("sends an unsponsored op to the chain bundler (no Thirdweb header) with bundler-quoted fees", async () => {
    const rpc = installRpc(unsponsored());
    await drive(transfer());

    const [send] = rpc.named("eth_sendUserOperation");
    expect(send.url).toBe(PIMLICO_URL);
    expect(send.headers["x-client-id"]).toBeUndefined();
    expect(send.params[0].paymasterAndData).toBe("0x");
    expect(BigInt(send.params[0].maxFeePerGas)).toBe(100n);
    expect(BigInt(send.params[0].maxPriorityFeePerGas)).toBe(10n);
    expect(rpc.named("eth_getUserOperationReceipt")[0].url).toBe(PIMLICO_URL);
    expect(signMessage).toHaveBeenCalledWith({
      message: { raw: viemHashOfSent(send.params[0]) },
    });
  });

  it("uses the transfer defaults for a deployed account: 300k call, 300k verification, 600k pre-verification", async () => {
    const rpc = installRpc(unsponsored());
    await drive(transfer());
    const sent = sentOp(rpc.calls);
    expect(BigInt(sent.callGasLimit)).toBe(300_000n);
    expect(BigInt(sent.verificationGasLimit)).toBe(300_000n);
    expect(BigInt(sent.preVerificationGas)).toBe(600_000n);
  });

  describe("initCode", () => {
    it("is empty when the account is already deployed", async () => {
      const rpc = installRpc(unsponsored());
      await drive(transfer());
      expect(sentOp(rpc.calls).initCode).toBe("0x");
    });

    it("is factory ++ createAccount(owner EOA, 0x) when the account is not deployed", async () => {
      mocks.isAccountDeployed.mockResolvedValue(false);
      const rpc = installRpc(unsponsored());
      await drive(transfer());

      const { initCode, verificationGasLimit } = sentOp(rpc.calls);
      expect(initCode.slice(0, 42)).toBe(OP.factoryAddress.toLowerCase());
      const decoded = decodeFunctionData({
        abi: ACCOUNT_FACTORY_ABI,
        data: `0x${initCode.slice(42)}`,
      });
      expect(decoded.functionName).toBe("createAccount");
      const [owner, data] = decoded.args as [string, string];
      expect(owner.toLowerCase()).toBe(OWNER);
      expect(data).toBe("0x");
      // deployment needs a larger verification budget
      expect(BigInt(verificationGasLimit)).toBe(1_000_000n);
    });

    it("hashes the initCode into what is signed", async () => {
      mocks.isAccountDeployed.mockResolvedValue(false);
      const rpc = installRpc(unsponsored());
      await drive(transfer());
      const sent = sentOp(rpc.calls);
      expect(signMessage).toHaveBeenCalledWith({
        message: { raw: viemHashOfSent(sent) },
      });
      expect(viemHashOfSent(sent)).not.toBe(
        viemHashOfSent({ ...sent, initCode: "0x" }),
      );
    });
  });

  describe("receipt handling", () => {
    it("waits 2s before the first poll and between polls until a receipt arrives", async () => {
      let polls = 0;
      const rpc = installRpc({
        ...unsponsored(),
        eth_getUserOperationReceipt: () =>
          ++polls < 3
            ? null
            : { success: true, receipt: { transactionHash: TX } },
      });
      const p = transfer();
      p.catch(() => {});
      await vi.advanceTimersByTimeAsync(1_999);
      expect(rpc.named("eth_getUserOperationReceipt")).toHaveLength(0);
      await vi.advanceTimersByTimeAsync(1);
      expect(rpc.named("eth_getUserOperationReceipt")).toHaveLength(1);
      await vi.advanceTimersByTimeAsync(4_000);
      expect(await p).toEqual({
        status: "confirmed",
        txHash: TX,
        userOpHash: USER_OP_HASH,
      });
      expect(rpc.named("eth_getUserOperationReceipt")).toHaveLength(3);
    });

    it("treats a receipt RPC error as 'not ready yet'", async () => {
      let polls = 0;
      installRpc({
        ...unsponsored(),
        eth_getUserOperationReceipt: () => {
          if (++polls === 1) throw new Error("receipt not found");
          return { success: true, receipt: { transactionHash: TX } };
        },
      });
      expect(await drive(transfer())).toMatchObject({
        status: "confirmed",
        txHash: TX,
      });
    });

    it("rejects with ExecutionFailed when the op was mined but reverted", async () => {
      installRpc({
        ...unsponsored(),
        eth_getUserOperationReceipt: () => ({
          success: false,
          receipt: { transactionHash: TX },
        }),
      });
      const err = await drive(transfer()).catch((e) => e);
      expect(err).toBeInstanceOf(RecoveryError);
      expect(err.code).toBe("ExecutionFailed");
      expect(err.message).toContain(USER_OP_HASH);
    });

    it("confirms without a tx hash when the receipt carries none", async () => {
      installRpc({
        ...unsponsored(),
        eth_getUserOperationReceipt: () => ({ success: true }),
      });
      expect(await drive(transfer())).toEqual({
        status: "confirmed",
        txHash: undefined,
        userOpHash: USER_OP_HASH,
      });
    });

    it("confirms when the receipt has no explicit success flag", async () => {
      installRpc({
        ...unsponsored(),
        eth_getUserOperationReceipt: () => ({
          receipt: { transactionHash: TX },
        }),
      });
      expect(await drive(transfer())).toMatchObject({
        status: "confirmed",
        txHash: TX,
      });
    });

    it("returns pending after exactly 30 polls (60s) without a receipt", async () => {
      const rpc = installRpc({
        ...unsponsored(),
        eth_getUserOperationReceipt: () => null,
      });
      const result = await drive(transfer());
      expect(result).toEqual({ status: "pending", userOpHash: USER_OP_HASH });
      expect(rpc.named("eth_getUserOperationReceipt")).toHaveLength(30);
    });
  });

  describe("errors", () => {
    it("maps AA21 from the bundler to InsufficientGas pointing at the smart account", async () => {
      installRpc({
        ...unsponsored(),
        eth_sendUserOperation: () => {
          throw new Error("AA21 didn't pay prefund");
        },
      });
      const err = await drive(transfer()).catch((e) => e);
      expect(err).toBeInstanceOf(RecoveryError);
      expect(err.code).toBe("InsufficientGas");
      expect(err.fundingAddress).toBe(SMART_ACCOUNT);
    });

    it("keeps other bundler errors as Unknown with the bundler's message", async () => {
      installRpc({
        ...unsponsored(),
        eth_sendUserOperation: () => {
          throw new Error("AA33 reverted (or OOG)");
        },
      });
      const err = await drive(transfer()).catch((e) => e);
      expect(err.code).toBe("Unknown");
      expect(err.message).toContain("AA33 reverted");
    });

    it("rejects with WalletNotConnected when the wallet has no signer", async () => {
      installRpc(unsponsored());
      const err = await drive(
        transfer({ wallet: makeWallet({ connected: false }) }),
      ).catch((e) => e);
      expect(err.code).toBe("WalletNotConnected");
    });

    it("rejects with WalletNotConnected on an undeployed account without a signer, before anything is sent", async () => {
      mocks.isAccountDeployed.mockResolvedValue(false);
      const rpc = installRpc(unsponsored());
      const err = await drive(
        transfer({ wallet: makeWallet({ connected: false }) }),
      ).catch((e) => e);
      expect(err.code).toBe("WalletNotConnected");
      expect(rpc.named("eth_sendUserOperation")).toHaveLength(0);
    });

    it("rejects when the signer refuses and sends nothing", async () => {
      signMessage.mockRejectedValue(new Error("User rejected"));
      const rpc = installRpc(unsponsored());
      const err = await drive(transfer()).catch((e) => e);
      expect(err.message).toBe("User rejected");
      expect(rpc.named("eth_sendUserOperation")).toHaveLength(0);
    });

    it("rejects when the nonce cannot be read", async () => {
      mocks.chainClient.readContract.mockRejectedValue(new Error("rpc down"));
      installRpc(unsponsored());
      await expect(drive(transfer())).rejects.toMatchObject({
        code: "Unknown",
        message: "rpc down",
      });
    });
  });

  it("sends ERC-20 transfers through the same path", async () => {
    const rpc = installRpc({
      ...baseHandlers(),
      pm_sponsorUserOperation: sponsoredWithLimits,
    });
    await drive(transfer({ token: { address: USDC }, amount: 5n }));
    expect(sentOp(rpc.calls).callData).toBe(
      encodeTransferCall({ address: USDC }, RECIPIENT, 5n),
    );
  });
});

describe("sendRecoveryTransfer on a chain without a bundler (direct path)", () => {
  const sendDirect = (overrides = {}) =>
    transfer({ network: "xlayer", ...overrides });

  it("never talks to a bundler and returns the direct tx hash as confirmed", async () => {
    const rpc = installRpc({});
    const result = await sendDirect();
    expect(result).toEqual({ status: "confirmed", txHash: TX });
    expect(rpc.calls).toHaveLength(0);
    expect(mocks.submitUserOpDirect).toHaveBeenCalledTimes(1);
    expect(mocks.submitUserOpDirect.mock.calls[0][2]).toBe("xlayer");
  });

  it("uses the generous direct gas limits and chain-derived fees, unsponsored", async () => {
    await sendDirect();
    const op = mocks.submitUserOpDirect.mock.calls[0][1];
    expect(op).toMatchObject({
      sender: SMART_ACCOUNT,
      nonce: 9n,
      initCode: "0x",
      callGasLimit: 1_500_000n,
      verificationGasLimit: 1_500_000n,
      preVerificationGas: 0n,
      maxFeePerGas: 40n,
      maxPriorityFeePerGas: 41n,
      paymasterAndData: "0x",
    });
  });

  it("uses 4M verification gas and an initCode when the account must be deployed", async () => {
    mocks.isAccountDeployed.mockResolvedValue(false);
    await sendDirect();
    const op = mocks.submitUserOpDirect.mock.calls[0][1];
    expect(op.verificationGasLimit).toBe(4_000_000n);
    expect(op.initCode.slice(0, 42)).toBe(
      RECOVERY_NETWORKS.xlayer.factoryAddress.toLowerCase(),
    );
  });

  it("ignores the transfer's callGasLimit default (300k) in favour of the direct 1.5M", async () => {
    await sendDirect();
    expect(mocks.submitUserOpDirect.mock.calls[0][1].callGasLimit).toBe(
      1_500_000n,
    );
  });

  it("signs the op it submits, over the X Layer chain id and entry point", async () => {
    await sendDirect();
    const op = mocks.submitUserOpDirect.mock.calls[0][1];
    expect(op.signature).toBe(SIGNATURE);
    const expected = getUserOperationHash({
      chainId: 196,
      entryPointAddress: RECOVERY_NETWORKS.xlayer.entryPoint,
      entryPointVersion: "0.6",
      userOperation: { ...op, signature: "0x" },
    });
    expect(signMessage).toHaveBeenCalledWith({ message: { raw: expected } });
  });

  it("passes RecoveryErrors from the direct submission through unchanged", async () => {
    const original = new RecoveryError("InsufficientGas", "fund me", {
      fundingAddress: "0xabc",
    });
    mocks.submitUserOpDirect.mockRejectedValue(original);
    await expect(sendDirect()).rejects.toBe(original);
  });

  it("maps a raw prefund error from the direct path to InsufficientGas", async () => {
    mocks.submitUserOpDirect.mockRejectedValue(
      new Error("AA21 didn't pay prefund"),
    );
    await expect(sendDirect()).rejects.toMatchObject({
      code: "InsufficientGas",
      fundingAddress: SMART_ACCOUNT,
    });
  });
});

describe("deploySmartAccount", () => {
  const deploy = (network: "optimism" | "xlayer" = "optimism") =>
    deploySmartAccount(makeWallet(), SMART_ACCOUNT, network);

  beforeEach(() => {
    mocks.isAccountDeployed.mockResolvedValue(false);
  });

  it("refuses with AlreadyDeployed, without any network call, when code exists", async () => {
    mocks.isAccountDeployed.mockResolvedValue(true);
    const rpc = installRpc(unsponsored());
    await expect(deploy()).rejects.toMatchObject({ code: "AlreadyDeployed" });
    expect(rpc.calls).toHaveLength(0);
  });

  it("submits an empty-call op with initCode and the 100k call / 1M verification defaults", async () => {
    const rpc = installRpc(unsponsored());
    const result = await drive(deploy());
    const sent = sentOp(rpc.calls);
    expect(sent.callData).toBe("0x");
    expect(sent.initCode.slice(0, 42)).toBe(OP.factoryAddress.toLowerCase());
    expect(BigInt(sent.callGasLimit)).toBe(100_000n);
    expect(BigInt(sent.verificationGasLimit)).toBe(1_000_000n);
    expect(result).toEqual({
      status: "confirmed",
      txHash: TX,
      userOpHash: USER_OP_HASH,
    });
    expect(mocks.waitForAccountDeployment).not.toHaveBeenCalled();
  });

  it("signs the final op", async () => {
    const rpc = installRpc({
      ...baseHandlers(),
      pm_sponsorUserOperation: sponsoredWithLimits,
    });
    await drive(deploy());
    expect(signMessage).toHaveBeenCalledWith({
      message: { raw: viemHashOfSent(sentOp(rpc.calls)) },
    });
  });

  it("upgrades a pending result to confirmed when the chain shows the code", async () => {
    installRpc({ ...unsponsored(), eth_getUserOperationReceipt: () => null });
    const result = await drive(deploy());
    expect(result).toEqual({ status: "confirmed", userOpHash: USER_OP_HASH });
    expect(mocks.waitForAccountDeployment).toHaveBeenCalledWith(
      SMART_ACCOUNT,
      "optimism",
      5,
    );
  });

  it("stays pending when neither the receipt nor the chain shows the account", async () => {
    mocks.waitForAccountDeployment.mockResolvedValue(false);
    installRpc({ ...unsponsored(), eth_getUserOperationReceipt: () => null });
    expect(await drive(deploy())).toEqual({
      status: "pending",
      userOpHash: USER_OP_HASH,
    });
  });

  it("maps AA21 to InsufficientGas with the smart account as funding address", async () => {
    installRpc({
      ...unsponsored(),
      eth_sendUserOperation: () => {
        throw new Error("AA21 didn't pay prefund");
      },
    });
    await expect(drive(deploy())).rejects.toMatchObject({
      code: "InsufficientGas",
      fundingAddress: SMART_ACCOUNT,
    });
  });

  it("deploys through the direct path on chains without a bundler", async () => {
    const result = await drive(deploy("xlayer"));
    expect(result).toEqual({ status: "confirmed", txHash: TX });
    const op = mocks.submitUserOpDirect.mock.calls[0][1];
    expect(op.callData).toBe("0x");
    expect(op.callGasLimit).toBe(1_500_000n);
    expect(op.verificationGasLimit).toBe(4_000_000n);
  });

  it("surfaces ExecutionFailed for a reverted deployment op", async () => {
    installRpc({
      ...unsponsored(),
      eth_getUserOperationReceipt: () => ({ success: false }),
    });
    await expect(drive(deploy())).rejects.toMatchObject({
      code: "ExecutionFailed",
    });
  });
});

describe("DUMMY_SIGNATURE is never what gets sent", () => {
  it("replaces the placeholder with the owner's signature", async () => {
    const rpc = installRpc(unsponsored());
    await drive(transfer());
    expect(sentOp(rpc.calls).signature).not.toBe(DUMMY_SIGNATURE);
  });
});
