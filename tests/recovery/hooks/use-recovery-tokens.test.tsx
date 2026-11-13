import { renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useRecoveryTokens } from "@/recovery/hooks/use-recovery-tokens";
import { SMART_ACCOUNT } from "../helpers/fixtures";
import { createQueryWrapper } from "../helpers/query";

const mocks = vi.hoisted(() => ({ fetchTokens: vi.fn() }));
vi.mock("@/recovery/core", async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  fetchRecoveryTokens: mocks.fetchTokens,
}));

const TOKENS = [{ symbol: "CELO", balance: 1n }];

beforeEach(() => {
  mocks.fetchTokens.mockReset().mockResolvedValue(TOKENS);
});

describe("useRecoveryTokens", () => {
  it("is idle until the smart account is known", () => {
    const { Wrapper } = createQueryWrapper();
    const { result } = renderHook(() => useRecoveryTokens("celo", undefined), {
      wrapper: Wrapper,
    });
    expect(result.current.fetchStatus).toBe("idle");
    expect(mocks.fetchTokens).not.toHaveBeenCalled();
  });

  it("fetches tokens for the network and account", async () => {
    const { Wrapper } = createQueryWrapper();
    const { result } = renderHook(
      () => useRecoveryTokens("celo", SMART_ACCOUNT),
      {
        wrapper: Wrapper,
      },
    );
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toBe(TOKENS);
    expect(mocks.fetchTokens).toHaveBeenCalledWith("celo", SMART_ACCOUNT);
  });

  it("refetches when the network changes and caches under the shared recovery key", async () => {
    const { Wrapper, queryClient } = createQueryWrapper();
    const { result, rerender } = renderHook(
      ({ network }: { network: "celo" | "mantle" }) =>
        useRecoveryTokens(network, SMART_ACCOUNT),
      { wrapper: Wrapper, initialProps: { network: "celo" } },
    );
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    rerender({ network: "mantle" });
    await waitFor(() =>
      expect(mocks.fetchTokens).toHaveBeenCalledWith("mantle", SMART_ACCOUNT),
    );
    expect(
      queryClient.getQueryData(["recovery", "tokens", "celo", SMART_ACCOUNT]),
    ).toBe(TOKENS);
  });

  it("retries a failed fetch once, then surfaces the error", async () => {
    mocks.fetchTokens.mockRejectedValue(new Error("rpc down"));
    const { Wrapper } = createQueryWrapper();
    const { result } = renderHook(
      () => useRecoveryTokens("celo", SMART_ACCOUNT),
      {
        wrapper: Wrapper,
      },
    );
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(mocks.fetchTokens).toHaveBeenCalledTimes(2);
    expect(result.current.error?.message).toBe("rpc down");
  });
});
