import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  deployFactory,
  getFactoryDeploymentData,
} from "@/recovery/core/factory";
import { RECOVERY_NETWORKS } from "@/recovery/core/networks";

const CREATE2_DEPLOYER = "0x4e59b44847b379578588920cA78FbF26c0B4956C";
const FACTORY = RECOVERY_NETWORKS.optimism.factoryAddress;
const ENTRY_POINT = RECOVERY_NETWORKS.optimism.entryPoint;
const DEPLOY_DATA = `0x${"ab".repeat(80)}` as const;
const SENDER = { address: "0x00000000000000000000000000000000000000f6" };
const OWNER = "0x00000000000000000000000000000000000000a1";
const TX = `0x${"77".repeat(32)}` as const;

const mocks = vi.hoisted(() => ({
  client: { clientId: "cid" },
  isFactoryDeployed: vi.fn(),
  hasCode: vi.fn(),
  waitForCode: vi.fn(),
  getBalance: vi.fn(),
  getDirectSenderAccount: vi.fn(),
  getOwnerAddress: vi.fn(),
  send: vi.fn(),
  getTransaction: vi.fn(),
  createPublicClient: vi.fn(),
  getContractAddress: vi.fn(),
}));

vi.mock("@/core/adapters/thirdweb/client", () => ({
  thirdwebClient: mocks.client,
}));
vi.mock("@/recovery/core/account", () => ({
  getPublicClient: () => ({ getBalance: mocks.getBalance }),
  hasCode: mocks.hasCode,
  isFactoryDeployed: mocks.isFactoryDeployed,
  waitForCode: mocks.waitForCode,
}));
vi.mock("@/recovery/core/signer", () => ({
  getDirectSenderAccount: mocks.getDirectSenderAccount,
  getOwnerAddress: mocks.getOwnerAddress,
}));
vi.mock("thirdweb", async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  prepareTransaction: (options: unknown) => options,
  sendAndConfirmTransaction: mocks.send,
}));
// The real deployment preimage is not available offline, so the CREATE2
// computation is stubbed here; its real behaviour is covered in factory-verify.test.ts.
vi.mock("viem", async (importOriginal) => ({
  ...(await importOriginal<typeof import("viem")>()),
  createPublicClient: mocks.createPublicClient,
  getContractAddress: mocks.getContractAddress,
}));

beforeEach(() => {
  mocks.isFactoryDeployed.mockReset().mockResolvedValue(false);
  mocks.hasCode.mockReset().mockResolvedValue(true);
  mocks.waitForCode.mockReset().mockResolvedValue(true);
  mocks.getBalance.mockReset().mockResolvedValue(10n);
  mocks.getDirectSenderAccount.mockReset().mockResolvedValue(SENDER);
  // By default the sender is a relaying smart wallet, not the owner itself
  mocks.getOwnerAddress.mockReset().mockReturnValue(OWNER);
  mocks.send
    .mockReset()
    .mockResolvedValue({ status: "success", transactionHash: TX });
  mocks.getTransaction.mockReset().mockResolvedValue({ input: DEPLOY_DATA });
  mocks.createPublicClient
    .mockReset()
    .mockReturnValue({ getTransaction: mocks.getTransaction });
  mocks.getContractAddress.mockReset().mockReturnValue(FACTORY);
});

describe("getFactoryDeploymentData", () => {
  it("fetches the original Base deployment tx and returns its input when it hashes to the factory", async () => {
    expect(await getFactoryDeploymentData(FACTORY)).toBe(DEPLOY_DATA);
    expect(mocks.getTransaction).toHaveBeenCalledWith({
      hash: "0x4d6d0a066f13ade9e4fe503f176e58de4261d2e5936a64d58fb10fe8afac8ef0",
    });
    expect(mocks.getContractAddress).toHaveBeenCalledWith(
      expect.objectContaining({ opcode: "CREATE2", from: CREATE2_DEPLOYER }),
    );
  });

  it("refuses data that does not create the factory", async () => {
    mocks.getContractAddress.mockReturnValue(
      "0x00000000000000000000000000000000000000aa",
    );
    await expect(getFactoryDeploymentData(FACTORY)).rejects.toMatchObject({
      code: "FactoryDeployFailed",
    });
  });
});

describe("deployFactory", () => {
  it("does nothing when the factory already exists", async () => {
    mocks.isFactoryDeployed.mockResolvedValue(true);
    expect(await deployFactory({} as never, "optimism")).toEqual({});
    expect(mocks.send).not.toHaveBeenCalled();
  });

  it("replays the CREATE2 deployment through the deployer and waits for code", async () => {
    mocks.waitForCode.mockImplementation(
      async (check: () => Promise<boolean>) => {
        mocks.isFactoryDeployed.mockResolvedValue(true);
        return check();
      },
    );
    const result = await deployFactory({} as never, "optimism");

    expect(result).toEqual({ txHash: TX });
    expect(mocks.send).toHaveBeenCalledTimes(1);
    const [{ account, transaction }] = mocks.send.mock.calls[0];
    expect(account).toBe(SENDER);
    expect(transaction.to).toBe(CREATE2_DEPLOYER);
    expect(transaction.data).toBe(DEPLOY_DATA);
    expect(transaction.chain).toBe(RECOVERY_NETWORKS.optimism.thirdwebChain);
    expect(mocks.waitForCode).toHaveBeenCalledTimes(1);
  });

  it.each([
    ["CREATE2 deployer", CREATE2_DEPLOYER],
    ["EntryPoint", ENTRY_POINT],
  ])(
    "refuses when the %s is missing on the network",
    async (label, address) => {
      mocks.hasCode.mockImplementation(
        async (_k: string, a: string) => a !== address,
      );
      const err = await deployFactory({} as never, "optimism").catch((e) => e);
      expect(err.code).toBe("FactoryDeployFailed");
      expect(err.message).toContain(label);
      expect(err.message).toContain(address);
      expect(err.message).toContain("Optimism");
      expect(mocks.getTransaction).not.toHaveBeenCalled();
      expect(mocks.send).not.toHaveBeenCalled();
    },
  );

  it("verifies the deployment data before sending anything", async () => {
    mocks.getContractAddress.mockReturnValue(
      "0x00000000000000000000000000000000000000aa",
    );
    await expect(deployFactory({} as never, "optimism")).rejects.toMatchObject({
      code: "FactoryDeployFailed",
    });
    expect(mocks.send).not.toHaveBeenCalled();
  });

  it("asks for native coin when the owner pays the gas itself and has none", async () => {
    mocks.getOwnerAddress.mockReturnValue(SENDER.address);
    mocks.getBalance.mockResolvedValue(0n);
    const err = await deployFactory({} as never, "optimism").catch((e) => e);
    expect(err.code).toBe("InsufficientGas");
    expect(err.fundingAddress).toBe(SENDER.address);
    expect(err.message).toContain("ETH");
    expect(mocks.getBalance).toHaveBeenCalledWith({ address: SENDER.address });
    expect(mocks.send).not.toHaveBeenCalled();
  });

  it("fails with FactoryDeployFailed when the deployment transaction reverts", async () => {
    mocks.send.mockResolvedValue({ status: "reverted", transactionHash: TX });
    await expect(deployFactory({} as never, "optimism")).rejects.toMatchObject({
      code: "FactoryDeployFailed",
      message: expect.stringContaining(TX),
    });
  });

  it("fails when the factory code never shows up after a successful transaction", async () => {
    mocks.waitForCode.mockResolvedValue(false);
    await expect(deployFactory({} as never, "optimism")).rejects.toMatchObject({
      code: "FactoryDeployFailed",
      message: expect.stringContaining("after transaction"),
    });
  });

  // Regression (fixed in src/recovery/core/factory.ts):
  // on bundler networks the sender is a *detached, sponsorGas smart wallet*
  // (its address is not the user's account and holds no native coin by design),
  // yet deployFactory demands a non-zero balance on that address first, so a
  // sponsored deployment can never start. The original app sent from the admin EOA.
  it("does not demand native coin from a sponsored smart-wallet sender", async () => {
    mocks.getBalance.mockResolvedValue(0n);
    // getDirectSenderAccount returns the detached sponsored smart wallet here
    // (see signer.test.ts), whose balance is legitimately zero.
    await expect(deployFactory({} as never, "optimism")).resolves.toEqual({
      txHash: TX,
    });
  });
});
