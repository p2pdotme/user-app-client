import {
  decodeFunctionData,
  encodeAbiParameters,
  encodeEventTopics,
  type Hex,
} from "viem";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ENTRY_POINT_ABI } from "@/recovery/core/abis";
import {
  DIRECT_GAS_LIMITS,
  getDirectGasFees,
  submitUserOpDirect,
} from "@/recovery/core/direct";
import { RECOVERY_NETWORKS } from "@/recovery/core/networks";
import type { UserOperation } from "@/recovery/core/user-op";
import { SMART_ACCOUNT } from "../helpers/fixtures";

const mocks = vi.hoisted(() => ({
  client: { clientId: "cid" },
  publicClient: {
    getGasPrice: vi.fn(),
    getBalance: vi.fn(),
    readContract: vi.fn(),
  },
  sender: { address: "0x00000000000000000000000000000000000000f6" },
  getDirectSenderAccount: vi.fn(),
  send: vi.fn(),
}));

vi.mock("@/core/adapters/thirdweb/client", () => ({
  thirdwebClient: mocks.client,
}));
vi.mock("@/recovery/core/account", () => ({
  getPublicClient: () => mocks.publicClient,
}));
vi.mock("@/recovery/core/signer", () => ({
  getDirectSenderAccount: mocks.getDirectSenderAccount,
}));
vi.mock("thirdweb", async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  // echo the options so tests can inspect what would have been sent
  prepareTransaction: (options: unknown) => options,
  sendAndConfirmTransaction: mocks.send,
}));

const NETWORK = RECOVERY_NETWORKS.xlayer;
const USER_OP_HASH = `0x${"11".repeat(32)}` as Hex;

const OP: UserOperation = {
  sender: SMART_ACCOUNT,
  nonce: 0n,
  initCode: "0x",
  callData: "0x",
  callGasLimit: 1_500_000n,
  verificationGasLimit: 1_500_000n,
  preVerificationGas: 0n,
  maxFeePerGas: 1_000n,
  maxPriorityFeePerGas: 1_000n,
  paymasterAndData: "0x",
  signature: `0x${"5a".repeat(65)}`,
};
const REQUIRED = 3_000_000n * 1_000n;

function receipt(
  success: boolean | "noEvent",
  status: "success" | "reverted" = "success",
) {
  const logs =
    success === "noEvent"
      ? []
      : [
          {
            address: NETWORK.entryPoint,
            topics: encodeEventTopics({
              abi: ENTRY_POINT_ABI,
              eventName: "UserOperationEvent",
              args: {
                userOpHash: USER_OP_HASH,
                sender: SMART_ACCOUNT,
                paymaster: "0x0000000000000000000000000000000000000000",
              },
            }),
            data: encodeAbiParameters(
              [
                { type: "uint256" },
                { type: "bool" },
                { type: "uint256" },
                { type: "uint256" },
              ],
              [0n, success, 1n, 1n],
            ),
            blockNumber: 1n,
            blockHash: `0x${"22".repeat(32)}`,
            transactionHash: `0x${"33".repeat(32)}`,
            transactionIndex: 0,
            logIndex: 0,
            removed: false,
          },
        ];
  return { status, transactionHash: `0x${"33".repeat(32)}` as Hex, logs };
}

function arrange({
  deposit = 0n,
  balance = 0n,
}: {
  deposit?: bigint;
  balance?: bigint;
}) {
  mocks.publicClient.readContract.mockResolvedValue(deposit);
  mocks.publicClient.getBalance.mockResolvedValue(balance);
}

beforeEach(() => {
  for (const fn of Object.values(mocks.publicClient)) fn.mockReset();
  mocks.getDirectSenderAccount.mockReset().mockResolvedValue(mocks.sender);
  mocks.send.mockReset().mockResolvedValue(receipt(true));
  arrange({ deposit: REQUIRED });
});

describe("DIRECT_GAS_LIMITS", () => {
  it("keeps the generous limits of the original app", () => {
    expect(DIRECT_GAS_LIMITS).toEqual({
      callGasLimit: 1_500_000n,
      verificationGasLimit: 1_500_000n,
      deployVerificationGasLimit: 4_000_000n,
      preVerificationGas: 0n,
    });
  });
});

describe("getDirectGasFees", () => {
  it("doubles the chain's gas price for both fee fields", async () => {
    mocks.publicClient.getGasPrice.mockResolvedValue(7n);
    expect(await getDirectGasFees("xlayer")).toEqual({
      maxFeePerGas: 14n,
      maxPriorityFeePerGas: 14n,
    });
  });

  it("propagates RPC failures", async () => {
    mocks.publicClient.getGasPrice.mockRejectedValue(new Error("down"));
    await expect(getDirectGasFees("xlayer")).rejects.toThrow("down");
  });
});

describe("submitUserOpDirect", () => {
  it("submits handleOps([op], sender) to the EntryPoint with no top-up when the prefund is covered", async () => {
    const result = await submitUserOpDirect({} as never, OP, "xlayer");

    expect(result).toEqual({ txHash: `0x${"33".repeat(32)}` });
    expect(mocks.send).toHaveBeenCalledTimes(1);
    const [{ account, transaction }] = mocks.send.mock.calls[0];
    expect(account).toBe(mocks.sender);
    expect(transaction.to).toBe(NETWORK.entryPoint);
    expect(transaction.chain).toBe(NETWORK.thirdwebChain);
    expect(transaction.value).toBeUndefined();
    const decoded = decodeFunctionData({
      abi: ENTRY_POINT_ABI,
      data: transaction.data,
    });
    expect(decoded.functionName).toBe("handleOps");
    const [ops, beneficiary] = decoded.args as [UserOperation[], string];
    expect(ops).toHaveLength(1);
    expect(ops[0]).toEqual(OP);
    expect(beneficiary).toBe(mocks.sender.address);
  });

  it("reads the deposit of the op's sender on this network's EntryPoint", async () => {
    await submitUserOpDirect({} as never, OP, "xlayer");
    expect(mocks.publicClient.readContract).toHaveBeenCalledWith(
      expect.objectContaining({
        address: NETWORK.entryPoint,
        functionName: "balanceOf",
        args: [SMART_ACCOUNT],
      }),
    );
    expect(mocks.publicClient.getBalance).toHaveBeenCalledWith({
      address: SMART_ACCOUNT,
    });
  });

  it("counts the account's own balance towards the prefund", async () => {
    arrange({ deposit: 1n, balance: REQUIRED - 1n });
    await submitUserOpDirect({} as never, OP, "xlayer");
    expect(mocks.send).toHaveBeenCalledTimes(1);
  });

  it("tops up exactly the shortfall via depositTo(sender) when short by one unit", async () => {
    arrange({ deposit: 5n, balance: REQUIRED - 6n });
    await submitUserOpDirect({} as never, OP, "xlayer");

    expect(mocks.send).toHaveBeenCalledTimes(2);
    const [{ transaction: topUp }] = mocks.send.mock.calls[0];
    expect(topUp.to).toBe(NETWORK.entryPoint);
    expect(topUp.value).toBe(1n);
    const decoded = decodeFunctionData({
      abi: ENTRY_POINT_ABI,
      data: topUp.data,
    });
    expect(decoded.functionName).toBe("depositTo");
    expect(decoded.args).toEqual([SMART_ACCOUNT]);
    // handleOps goes second
    const [{ transaction: handle }] = mocks.send.mock.calls[1];
    expect(
      decodeFunctionData({ abi: ENTRY_POINT_ABI, data: handle.data })
        .functionName,
    ).toBe("handleOps");
  });

  it("sizes the prefund from all three gas limits times maxFeePerGas", async () => {
    const op = {
      ...OP,
      callGasLimit: 10n,
      verificationGasLimit: 20n,
      preVerificationGas: 30n,
      maxFeePerGas: 100n,
    };
    arrange({ deposit: 0n, balance: 0n });
    await submitUserOpDirect({} as never, op, "xlayer");
    expect(mocks.send.mock.calls[0][0].transaction.value).toBe(6_000n);
  });

  it("reports InsufficientGas with the paying address when the top-up fails", async () => {
    arrange({ deposit: 0n, balance: 0n });
    const cause = new Error("insufficient funds for gas");
    mocks.send.mockRejectedValueOnce(cause);

    const err = await submitUserOpDirect({} as never, OP, "xlayer").catch(
      (e) => e,
    );
    expect(err.code).toBe("InsufficientGas");
    expect(err.fundingAddress).toBe(mocks.sender.address);
    expect(err.cause).toBe(cause);
    expect(err.message).toContain("OKB");
    expect(err.message).toContain("X Layer");
    expect(err.message).toContain(mocks.sender.address);
    expect(mocks.send).toHaveBeenCalledTimes(1);
  });

  it("fails with ExecutionFailed when the handleOps transaction reverted", async () => {
    mocks.send.mockResolvedValue(receipt(true, "reverted"));
    await expect(
      submitUserOpDirect({} as never, OP, "xlayer"),
    ).rejects.toMatchObject({
      code: "ExecutionFailed",
      message: expect.stringContaining("reverted"),
    });
  });

  it("fails when the op itself reverted although handleOps succeeded", async () => {
    mocks.send.mockResolvedValue(receipt(false));
    await expect(
      submitUserOpDirect({} as never, OP, "xlayer"),
    ).rejects.toMatchObject({
      code: "ExecutionFailed",
      message: expect.stringContaining("UserOperation execution failed"),
    });
  });

  it("fails when no UserOperationEvent was emitted", async () => {
    mocks.send.mockResolvedValue(receipt("noEvent"));
    await expect(
      submitUserOpDirect({} as never, OP, "xlayer"),
    ).rejects.toMatchObject({
      code: "ExecutionFailed",
    });
  });

  it("does not wrap a failing handleOps send", async () => {
    mocks.send.mockRejectedValue(new Error("nonce too low"));
    await expect(submitUserOpDirect({} as never, OP, "xlayer")).rejects.toThrow(
      "nonce too low",
    );
  });

  it("asks the signer module for the sender on this network", async () => {
    const wallet = { id: "w" } as never;
    await submitUserOpDirect(wallet, OP, "xlayer");
    expect(mocks.getDirectSenderAccount).toHaveBeenCalledWith(wallet, "xlayer");
  });
});
