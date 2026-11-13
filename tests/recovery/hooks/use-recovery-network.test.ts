import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useRecoveryNetwork } from "@/recovery/hooks/use-recovery-network";

const KEY = "p2p_recovery_network";

beforeEach(() => {
  localStorage.clear();
});
afterEach(() => {
  vi.restoreAllMocks();
});

describe("useRecoveryNetwork", () => {
  it("defaults to Monad when nothing is stored", () => {
    const { result } = renderHook(() => useRecoveryNetwork());
    expect(result.current.network).toBe("monad");
  });

  it("restores a stored network", () => {
    localStorage.setItem(KEY, "celo");
    const { result } = renderHook(() => useRecoveryNetwork());
    expect(result.current.network).toBe("celo");
  });

  it.each([[""], ["base"], ["MONAD"], ["{}"], ["null"]])(
    "ignores an unknown stored value %j",
    (stored) => {
      localStorage.setItem(KEY, stored);
      const { result } = renderHook(() => useRecoveryNetwork());
      expect(result.current.network).toBe("monad");
    },
  );

  // BUG, via isRecoveryNetworkKey (see networks.test.ts): inherited property
  // names pass the guard, so a stale/tampered value becomes the "network" and
  // RECOVERY_NETWORKS[network] is then undefined.
  it.each([["constructor"], ["toString"], ["__proto__"]])(
    "falls back to the default for the stored inherited property name %s",
    (stored) => {
      localStorage.setItem(KEY, stored);
      const { result } = renderHook(() => useRecoveryNetwork());
      expect(result.current.network).toBe("monad");
    },
  );

  it("setNetwork updates state and persists it", () => {
    const { result } = renderHook(() => useRecoveryNetwork());
    act(() => result.current.setNetwork("arbitrum"));
    expect(result.current.network).toBe("arbitrum");
    expect(localStorage.getItem(KEY)).toBe("arbitrum");
  });

  it("keeps a stable setNetwork across renders", () => {
    const { result, rerender } = renderHook(() => useRecoveryNetwork());
    const first = result.current.setNetwork;
    act(() => result.current.setNetwork("celo"));
    rerender();
    expect(result.current.setNetwork).toBe(first);
  });

  it("a second hook instance reads what the first persisted", () => {
    const first = renderHook(() => useRecoveryNetwork());
    act(() => first.result.current.setNetwork("mantle"));
    const second = renderHook(() => useRecoveryNetwork());
    expect(second.result.current.network).toBe("mantle");
  });

  it("falls back to the default when reading storage throws", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new DOMException("blocked", "SecurityError");
    });
    const { result } = renderHook(() => useRecoveryNetwork());
    expect(result.current.network).toBe("monad");
  });

  it("still switches network for this visit when writing storage throws", () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new DOMException("quota", "QuotaExceededError");
    });
    const { result } = renderHook(() => useRecoveryNetwork());
    act(() => result.current.setNetwork("celo"));
    expect(result.current.network).toBe("celo");
  });
});
