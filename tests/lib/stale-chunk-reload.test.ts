import { describe, expect, it, vi } from "vitest";
import {
  isStaleChunkError,
  reloadForStaleChunk,
} from "@/lib/stale-chunk-reload";

function memoryStorage() {
  const data = new Map<string, string>();
  return {
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => void data.set(key, value),
  };
}

describe("stale chunk reload", () => {
  it("recognises chunk-load failures from each browser", () => {
    for (const message of [
      "Failed to fetch dynamically imported module: https://p2p.me/assets/a.js",
      "error loading dynamically imported module",
      "Importing a module script failed.",
      "Unable to preload CSS for /assets/b.css",
    ]) {
      expect(isStaleChunkError(new Error(message))).toBe(true);
    }
    expect(
      isStaleChunkError(new Error("Cannot read properties of undefined")),
    ).toBe(false);
    expect(isStaleChunkError(undefined)).toBe(false);
  });

  it("reloads once, then not again within 30 s (no reload loop)", () => {
    const storage = memoryStorage();
    const reload = vi.fn();
    expect(reloadForStaleChunk({ storage, now: 1_000_000, reload })).toBe(true);
    expect(reloadForStaleChunk({ storage, now: 1_010_000, reload })).toBe(
      false,
    );
    expect(reload).toHaveBeenCalledTimes(1);
    expect(reloadForStaleChunk({ storage, now: 1_031_000, reload })).toBe(true);
    expect(reload).toHaveBeenCalledTimes(2);
  });

  it("never reloads while offline", () => {
    const reload = vi.fn();
    expect(
      reloadForStaleChunk({ storage: memoryStorage(), online: false, reload }),
    ).toBe(false);
    expect(reload).not.toHaveBeenCalled();
  });

  it("never reloads when the loop guard can't be stored", () => {
    const reload = vi.fn();
    expect(reloadForStaleChunk({ storage: null, reload })).toBe(false);
    const throwing = {
      getItem: () => null,
      setItem: () => {
        throw new DOMException("QuotaExceededError");
      },
    };
    expect(reloadForStaleChunk({ storage: throwing, reload })).toBe(false);
    expect(reload).not.toHaveBeenCalled();
  });
});
