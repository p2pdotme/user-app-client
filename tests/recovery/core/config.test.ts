import { afterEach, describe, expect, it, vi } from "vitest";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
  vi.useRealTimers();
});

async function loadConfig(_key?: string) {
  vi.resetModules();
  return import("@/recovery/core/config");
}

describe("bundler URLs", () => {
  it("builds Thirdweb's bundler URL from the chain id", async () => {
    const config = await loadConfig(undefined);
    expect(config.getThirdwebBundlerUrl(8453)).toBe(
      "https://8453.bundler.thirdweb.com/v2",
    );
  });

  it("builds Pimlico's bundler URL from the chain id and the built-in key", async () => {
    const config = await loadConfig();
    expect(config.getPimlicoBundlerUrl(10)).toMatch(
      /^https:\/\/api\.pimlico\.io\/v2\/10\/rpc\?apikey=pim_\w+$/,
    );
  });
});

describe("polling constants", () => {
  it("match the original app: 30 x 2s receipts, 10 x 2s code", async () => {
    const config = await loadConfig(undefined);
    expect(config.RECEIPT_POLL_ATTEMPTS).toBe(30);
    expect(config.RECEIPT_POLL_DELAY_MS).toBe(2000);
    expect(config.CODE_POLL_ATTEMPTS).toBe(10);
    expect(config.CODE_POLL_DELAY_MS).toBe(2000);
  });
});

describe("sleep", () => {
  it("resolves only after the delay", async () => {
    vi.useFakeTimers();
    const config = await loadConfig(undefined);
    let done = false;
    const p = config.sleep(500).then(() => {
      done = true;
    });
    await vi.advanceTimersByTimeAsync(499);
    expect(done).toBe(false);
    await vi.advanceTimersByTimeAsync(1);
    await p;
    expect(done).toBe(true);
  });
});
