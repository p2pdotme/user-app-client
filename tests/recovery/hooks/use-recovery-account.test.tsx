import { act, renderHook, waitFor } from "@testing-library/react";
import * as thirdwebReact from "thirdweb/react";
import type { Wallet } from "thirdweb/wallets";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { RecoveryError } from "@/recovery/core";
import {
  recoveryKeys,
  useDeployFactory,
  useDeploySmartAccount,
  useRecoveryAccount,
  useRecoveryOwner,
} from "@/recovery/hooks/use-recovery-account";
import { OWNER, SMART_ACCOUNT } from "../helpers/fixtures";
import { createQueryWrapper } from "../helpers/query";

const mocks = vi.hoisted(() => ({
  derive: vi.fn(),
  isDeployed: vi.fn(),
  deployFactory: vi.fn(),
  deployAccount: vi.fn(),
  waitDeployment: vi.fn(),
}));
vi.mock("@/recovery/core", async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  deriveSmartAccountAddress: mocks.derive,
  isAccountDeployed: mocks.isDeployed,
  deployFactory: mocks.deployFactory,
  deploySmartAccount: mocks.deployAccount,
  waitForAccountDeployment: mocks.waitDeployment,
}));

function walletWithOwner(address: string = OWNER): Wallet {
  const admin = { address, signMessage: vi.fn() };
  return {
    getAccount: () => admin,
    getAdminAccount: () => admin,
  } as unknown as Wallet;
}
const useWallet = (wallet: Wallet | undefined) =>
  vi.spyOn(thirdwebReact, "useActiveWallet").mockReturnValue(wallet);

beforeEach(() => {
  for (const fn of Object.values(mocks)) fn.mockReset();
  mocks.derive.mockResolvedValue(SMART_ACCOUNT);
  mocks.isDeployed.mockResolvedValue(true);
  useWallet(walletWithOwner());
});
afterEach(() => {
  vi.restoreAllMocks();
});

describe("recoveryKeys", () => {
  it("nests every key under ['recovery'] so one invalidation reaches all", () => {
    expect(recoveryKeys.all).toEqual(["recovery"]);
    expect(recoveryKeys.account("celo", OWNER)).toEqual([
      "recovery",
      "account",
      "celo",
      OWNER,
    ]);
    expect(recoveryKeys.tokens("celo", SMART_ACCOUNT)).toEqual([
      "recovery",
      "tokens",
      "celo",
      SMART_ACCOUNT,
    ]);
  });
});

describe("useRecoveryOwner", () => {
  it("is undefined when logged out", () => {
    useWallet(undefined);
    expect(renderHook(() => useRecoveryOwner()).result.current).toBeUndefined();
  });

  it("is the wallet's admin (owner) address", () => {
    expect(renderHook(() => useRecoveryOwner()).result.current).toBe(OWNER);
  });

  it("is undefined, not a crash, when the wallet exposes no signer", () => {
    useWallet({ getAccount: () => undefined } as unknown as Wallet);
    expect(renderHook(() => useRecoveryOwner()).result.current).toBeUndefined();
  });
});

describe("useRecoveryAccount", () => {
  it("stays idle without a wallet", () => {
    useWallet(undefined);
    const { Wrapper } = createQueryWrapper();
    const { result } = renderHook(() => useRecoveryAccount("celo"), {
      wrapper: Wrapper,
    });
    expect(result.current.fetchStatus).toBe("idle");
    expect(mocks.derive).not.toHaveBeenCalled();
  });

  it("derives the address for the owner and reports whether it is deployed", async () => {
    mocks.isDeployed.mockResolvedValue(false);
    const { Wrapper } = createQueryWrapper();
    const { result } = renderHook(() => useRecoveryAccount("celo"), {
      wrapper: Wrapper,
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual({
      address: SMART_ACCOUNT,
      isDeployed: false,
    });
    expect(mocks.derive).toHaveBeenCalledWith(OWNER, "celo");
    expect(mocks.isDeployed).toHaveBeenCalledWith(SMART_ACCOUNT, "celo");
  });

  it("does not retry FactoryNotDeployed", async () => {
    mocks.derive.mockRejectedValue(
      new RecoveryError("FactoryNotDeployed", "missing"),
    );
    const { Wrapper } = createQueryWrapper();
    const { result } = renderHook(() => useRecoveryAccount("celo"), {
      wrapper: Wrapper,
    });
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error?.code).toBe("FactoryNotDeployed");
    expect(mocks.derive).toHaveBeenCalledTimes(1);
  });

  it("retries DeriveFailed exactly once", async () => {
    mocks.derive.mockRejectedValue(new RecoveryError("DeriveFailed", "rpc"));
    const { Wrapper } = createQueryWrapper();
    const { result } = renderHook(() => useRecoveryAccount("celo"), {
      wrapper: Wrapper,
    });
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(mocks.derive).toHaveBeenCalledTimes(2);
  });

  it("normalises unexpected failures to RecoveryError and does not retry them", async () => {
    mocks.derive.mockRejectedValue(new Error("boom"));
    const { Wrapper } = createQueryWrapper();
    const { result } = renderHook(() => useRecoveryAccount("celo"), {
      wrapper: Wrapper,
    });
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toBeInstanceOf(RecoveryError);
    expect(result.current.error?.code).toBe("Unknown");
    expect(mocks.derive).toHaveBeenCalledTimes(1);
  });

  it("keys the cache per network", async () => {
    const { Wrapper, queryClient } = createQueryWrapper();
    const celo = renderHook(() => useRecoveryAccount("celo"), {
      wrapper: Wrapper,
    });
    const mantle = renderHook(() => useRecoveryAccount("mantle"), {
      wrapper: Wrapper,
    });
    await waitFor(() =>
      expect(
        celo.result.current.isSuccess && mantle.result.current.isSuccess,
      ).toBe(true),
    );
    expect(
      queryClient.getQueryData(recoveryKeys.account("celo", OWNER)),
    ).toBeDefined();
    expect(
      queryClient.getQueryData(recoveryKeys.account("mantle", OWNER)),
    ).toBeDefined();
    expect(mocks.derive).toHaveBeenCalledTimes(2);
  });
});

describe("useDeployFactory", () => {
  it("rejects with WalletNotConnected when logged out", async () => {
    useWallet(undefined);
    const { Wrapper } = createQueryWrapper();
    const { result } = renderHook(() => useDeployFactory("celo"), {
      wrapper: Wrapper,
    });
    const err = await act(() => result.current.mutateAsync().catch((e) => e));
    expect(err.code).toBe("WalletNotConnected");
    expect(mocks.deployFactory).not.toHaveBeenCalled();
  });

  it("deploys with the active wallet and invalidates every recovery query", async () => {
    mocks.deployFactory.mockResolvedValue({ txHash: "0xabc" });
    const wallet = walletWithOwner();
    useWallet(wallet);
    const { Wrapper, queryClient } = createQueryWrapper();
    const invalidate = vi.spyOn(queryClient, "invalidateQueries");
    const { result } = renderHook(() => useDeployFactory("celo"), {
      wrapper: Wrapper,
    });
    expect(await act(() => result.current.mutateAsync())).toEqual({
      txHash: "0xabc",
    });
    expect(mocks.deployFactory).toHaveBeenCalledWith(wallet, "celo");
    await waitFor(() =>
      expect(invalidate).toHaveBeenCalledWith({ queryKey: ["recovery"] }),
    );
  });

  it("keeps RecoveryError codes and normalises other errors", async () => {
    const { Wrapper } = createQueryWrapper();
    const { result } = renderHook(() => useDeployFactory("celo"), {
      wrapper: Wrapper,
    });
    mocks.deployFactory.mockRejectedValueOnce(
      new RecoveryError("InsufficientGas", "fund", { fundingAddress: "0xabc" }),
    );
    const gas = await act(() => result.current.mutateAsync().catch((e) => e));
    expect(gas.code).toBe("InsufficientGas");
    expect(gas.fundingAddress).toBe("0xabc");

    mocks.deployFactory.mockRejectedValueOnce(
      new Error("AA21 didn't pay prefund"),
    );
    const prefund = await act(() =>
      result.current.mutateAsync().catch((e) => e),
    );
    expect(prefund.code).toBe("InsufficientGas");

    mocks.deployFactory.mockRejectedValueOnce(new Error("other"));
    const other = await act(() => result.current.mutateAsync().catch((e) => e));
    expect(other).toBeInstanceOf(RecoveryError);
    expect(other.code).toBe("Unknown");
  });
});

describe("useDeploySmartAccount", () => {
  it("rejects with WalletNotConnected when logged out", async () => {
    useWallet(undefined);
    const { Wrapper } = createQueryWrapper();
    const { result } = renderHook(() => useDeploySmartAccount("celo"), {
      wrapper: Wrapper,
    });
    const err = await act(() =>
      result.current.mutateAsync(SMART_ACCOUNT).catch((e) => e),
    );
    expect(err.code).toBe("WalletNotConnected");
  });

  it("after a confirmed deploy, waits for the code to be visible on the RPC, then invalidates", async () => {
    mocks.deployAccount.mockResolvedValue({
      status: "confirmed",
      txHash: "0x1",
    });
    mocks.waitDeployment.mockResolvedValue(true);
    const wallet = walletWithOwner();
    useWallet(wallet);
    const { Wrapper, queryClient } = createQueryWrapper();
    const invalidate = vi.spyOn(queryClient, "invalidateQueries");
    const { result } = renderHook(() => useDeploySmartAccount("celo"), {
      wrapper: Wrapper,
    });

    const out = await act(() => result.current.mutateAsync(SMART_ACCOUNT));
    expect(out).toEqual({ status: "confirmed", txHash: "0x1" });
    expect(mocks.deployAccount).toHaveBeenCalledWith(
      wallet,
      SMART_ACCOUNT,
      "celo",
    );
    expect(mocks.waitDeployment).toHaveBeenCalledWith(SMART_ACCOUNT, "celo");
    await waitFor(() =>
      expect(invalidate).toHaveBeenCalledWith({ queryKey: ["recovery"] }),
    );
  });

  it("does not wait for code after a pending result", async () => {
    mocks.deployAccount.mockResolvedValue({
      status: "pending",
      userOpHash: "0xdead",
    });
    const { Wrapper } = createQueryWrapper();
    const { result } = renderHook(() => useDeploySmartAccount("celo"), {
      wrapper: Wrapper,
    });
    expect(await act(() => result.current.mutateAsync(SMART_ACCOUNT))).toEqual({
      status: "pending",
      userOpHash: "0xdead",
    });
    expect(mocks.waitDeployment).not.toHaveBeenCalled();
  });

  it("propagates AlreadyDeployed", async () => {
    mocks.deployAccount.mockRejectedValue(
      new RecoveryError("AlreadyDeployed", "x"),
    );
    const { Wrapper } = createQueryWrapper();
    const { result } = renderHook(() => useDeploySmartAccount("celo"), {
      wrapper: Wrapper,
    });
    const err = await act(() =>
      result.current.mutateAsync(SMART_ACCOUNT).catch((e) => e),
    );
    expect(err.code).toBe("AlreadyDeployed");
  });

  // Observation (use-recovery-account.ts:101-106): unlike useDeployFactory and
  // sendRecoveryTransfer, this mutationFn does not run errors through
  // toRecoveryError, so a failure from waitForAccountDeployment would reach the
  // UI as a plain Error, contradicting the declared `RecoveryError` type.
  it("normalises a non-RecoveryError thrown after the deploy", async () => {
    mocks.deployAccount.mockResolvedValue({ status: "confirmed" });
    mocks.waitDeployment.mockRejectedValue(new Error("rpc"));
    const { Wrapper } = createQueryWrapper();
    const { result } = renderHook(() => useDeploySmartAccount("celo"), {
      wrapper: Wrapper,
    });
    const err = await act(() =>
      result.current.mutateAsync(SMART_ACCOUNT).catch((e) => e),
    );
    expect(err).toBeInstanceOf(RecoveryError);
    expect(err.code).toBe("Unknown");
  });
});
