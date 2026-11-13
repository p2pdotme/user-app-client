import type { Wallet } from "thirdweb/wallets";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { RecoveryError } from "@/recovery/core/errors";
import { RECOVERY_NETWORKS } from "@/recovery/core/networks";
import {
  getDirectSenderAccount,
  getOwnerAccount,
  getOwnerAddress,
  signUserOpHash,
} from "@/recovery/core/signer";
import { OWNER, SIGNATURE } from "../helpers/fixtures";

const mocks = vi.hoisted(() => ({
  client: { clientId: "cid" },
  isZkSyncChain: vi.fn(),
  connect: vi.fn(),
  smartWallet: vi.fn(),
}));

vi.mock("@/core/adapters/thirdweb/client", () => ({
  thirdwebClient: mocks.client,
}));
vi.mock("thirdweb/utils", async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  isZkSyncChain: mocks.isZkSyncChain,
}));
vi.mock("thirdweb/wallets", async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  smartWallet: mocks.smartWallet,
}));

const account = (address: string) => ({
  address,
  signMessage: vi.fn().mockResolvedValue(SIGNATURE),
});

function smartWalletLike() {
  const admin = account(OWNER);
  const active = account("0x00000000000000000000000000000000000000b2");
  const wallet = {
    getAccount: vi.fn(() => active),
    getAdminAccount: vi.fn(() => admin),
  } as unknown as Wallet;
  return { wallet, admin, active };
}

beforeEach(() => {
  mocks.isZkSyncChain.mockReset().mockResolvedValue(false);
  mocks.connect.mockReset();
  mocks.smartWallet.mockReset().mockReturnValue({ connect: mocks.connect });
});

describe("getOwnerAccount / getOwnerAddress", () => {
  it("prefers the admin account of a smart wallet", () => {
    const { wallet, admin } = smartWalletLike();
    expect(getOwnerAccount(wallet)).toBe(admin);
    expect(getOwnerAddress(wallet)).toBe(OWNER);
  });

  it("uses the connected account when the wallet has no admin concept", () => {
    const plain = account("0x00000000000000000000000000000000000000d4");
    const wallet = { getAccount: () => plain } as unknown as Wallet;
    expect(getOwnerAccount(wallet)).toBe(plain);
  });

  it("falls back to the connected account when the admin account is undefined", () => {
    const plain = account("0x00000000000000000000000000000000000000d4");
    const wallet = {
      getAccount: () => plain,
      getAdminAccount: () => undefined,
    } as unknown as Wallet;
    expect(getOwnerAccount(wallet)).toBe(plain);
  });

  it("throws WalletNotConnected when there is no signer at all", () => {
    const wallet = { getAccount: () => undefined } as unknown as Wallet;
    try {
      getOwnerAccount(wallet);
      expect.unreachable();
    } catch (err) {
      expect(err).toBeInstanceOf(RecoveryError);
      expect((err as RecoveryError).code).toBe("WalletNotConnected");
    }
  });
});

describe("signUserOpHash", () => {
  it("signs the hash as raw bytes (EIP-191) with the owner, not the smart account", async () => {
    const { wallet, admin, active } = smartWalletLike();
    const hash = `0x${"ab".repeat(32)}` as const;
    expect(await signUserOpHash(wallet, hash)).toBe(SIGNATURE);
    expect(admin.signMessage).toHaveBeenCalledWith({ message: { raw: hash } });
    expect(active.signMessage).not.toHaveBeenCalled();
  });

  it("propagates signer failures", async () => {
    const { wallet, admin } = smartWalletLike();
    admin.signMessage.mockRejectedValue(new Error("user rejected"));
    await expect(signUserOpHash(wallet, "0x00")).rejects.toThrow(
      "user rejected",
    );
  });
});

describe("getDirectSenderAccount", () => {
  it("returns the plain account for a non-smart wallet on any network", async () => {
    const plain = account(OWNER);
    const wallet = { getAccount: () => plain } as unknown as Wallet;
    expect(await getDirectSenderAccount(wallet, "xlayer")).toBe(plain);
    expect(await getDirectSenderAccount(wallet, "optimism")).toBe(plain);
    expect(mocks.smartWallet).not.toHaveBeenCalled();
  });

  it("uses the owner EOA on a chain with no bundler that is not zkSync (X Layer)", async () => {
    const { wallet, admin } = smartWalletLike();
    expect(await getDirectSenderAccount(wallet, "xlayer")).toBe(admin);
    expect(mocks.isZkSyncChain).toHaveBeenCalledWith(
      RECOVERY_NETWORKS.xlayer.thirdwebChain,
    );
    expect(mocks.smartWallet).not.toHaveBeenCalled();
  });

  it("uses a detached sponsored smart wallet on zkSync, without switching the active wallet", async () => {
    const { wallet, admin } = smartWalletLike();
    const detached = account("0x00000000000000000000000000000000000000e5");
    mocks.isZkSyncChain.mockResolvedValue(true);
    mocks.connect.mockResolvedValue(detached);

    expect(await getDirectSenderAccount(wallet, "zksync")).toBe(detached);
    expect(mocks.smartWallet).toHaveBeenCalledWith({
      chain: RECOVERY_NETWORKS.zksync.thirdwebChain,
      sponsorGas: true,
    });
    expect(mocks.connect).toHaveBeenCalledWith({
      client: mocks.client,
      personalAccount: admin,
    });
  });

  it("uses a detached sponsored smart wallet on bundler networks without asking about zkSync", async () => {
    const { wallet, admin } = smartWalletLike();
    const detached = account("0x00000000000000000000000000000000000000e5");
    mocks.connect.mockResolvedValue(detached);

    expect(await getDirectSenderAccount(wallet, "optimism")).toBe(detached);
    expect(mocks.smartWallet).toHaveBeenCalledWith({
      chain: RECOVERY_NETWORKS.optimism.thirdwebChain,
      sponsorGas: true,
    });
    expect(mocks.connect).toHaveBeenCalledWith({
      client: mocks.client,
      personalAccount: admin,
    });
    expect(mocks.isZkSyncChain).not.toHaveBeenCalled();
  });

  it("throws WalletNotConnected before touching the network when there is no signer", async () => {
    const wallet = { getAccount: () => undefined } as unknown as Wallet;
    await expect(
      getDirectSenderAccount(wallet, "zksync"),
    ).rejects.toMatchObject({
      code: "WalletNotConnected",
    });
    expect(mocks.smartWallet).not.toHaveBeenCalled();
  });
});
