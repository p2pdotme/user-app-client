import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { splitGraphemes, useTypewriter } from "@/hooks/use-typewriter";

function mockReducedMotion(matches: boolean) {
  vi.stubGlobal(
    "matchMedia",
    vi.fn().mockReturnValue({ matches }) as unknown as typeof matchMedia,
  );
}

describe("splitGraphemes", () => {
  it("keeps combining marks attached to their base character", () => {
    expect(splitGraphemes("काम")).toEqual(["का", "म"]);
  });
});

describe("useTypewriter", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    mockReducedMotion(false);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("types the text one character at a time, then starts over", () => {
    const { result } = renderHook(() => useTypewriter("abc"));
    expect(result.current).toBe("");

    act(() => vi.advanceTimersByTime(500));
    expect(result.current).toBe("a");
    act(() => vi.advanceTimersByTime(70));
    expect(result.current).toBe("ab");
    act(() => vi.advanceTimersByTime(70));
    expect(result.current).toBe("abc");

    // Holds the full text, then clears and retypes.
    act(() => vi.advanceTimersByTime(2599));
    expect(result.current).toBe("abc");
    act(() => vi.advanceTimersByTime(1));
    expect(result.current).toBe("");
  });

  it("returns the full text at once when reduced motion is preferred", () => {
    mockReducedMotion(true);
    const { result } = renderHook(() => useTypewriter("abc"));
    expect(result.current).toBe("abc");
  });
});
