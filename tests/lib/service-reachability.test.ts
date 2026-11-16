import { afterEach, describe, expect, it, vi } from "vitest";
import {
  checkAppHost,
  checkBlockchain,
  checkOrders,
  summarizeReachability,
} from "@/hooks/use-service-reachability";

const okResponse = (body: unknown = "") =>
  ({
    ok: true,
    json: async () => body,
  }) as Response;

describe("service reachability checks", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("app host: reachable on 2xx, down on error or non-2xx, never cached", async () => {
    const fetchOk = vi.fn(async () => okResponse());
    expect(await checkAppHost(fetchOk as unknown as typeof fetch)).toBe("ok");
    const [url, init] = fetchOk.mock.calls[0] as unknown as [
      string,
      RequestInit,
    ];
    expect(url).toMatch(/\/robots\.txt\?reachability=\d+$/);
    expect(init.cache).toBe("no-store");

    const fetch404 = vi.fn(async () => ({ ok: false }) as Response);
    expect(await checkAppHost(fetch404 as unknown as typeof fetch)).toBe(
      "down",
    );

    const fetchBlocked = vi.fn(async () => {
      throw new TypeError("Failed to fetch");
    });
    expect(await checkAppHost(fetchBlocked as unknown as typeof fetch)).toBe(
      "down",
    );
  });

  it("blockchain: reachable when a block number comes back, down on RPC error", async () => {
    expect(await checkBlockchain(async () => 123n)).toBe("ok");
    expect(
      await checkBlockchain(async () => {
        throw new Error("rpc error");
      }),
    ).toBe("down");
  });

  it("times out a hanging check instead of spinning forever", async () => {
    vi.useFakeTimers();
    const pending = checkBlockchain(() => new Promise<bigint>(() => {}));
    await vi.advanceTimersByTimeAsync(8_001);
    expect(await pending).toBe("down");
  });

  it("orders (subgraph): needs a real _meta block number", async () => {
    const good = vi.fn(async () =>
      okResponse({ data: { _meta: { block: { number: 42 } } } }),
    );
    expect(
      await checkOrders("https://sg.example", good as unknown as typeof fetch),
    ).toBe("ok");

    const graphError = vi.fn(async () =>
      okResponse({ errors: [{ message: "indexer down" }] }),
    );
    expect(
      await checkOrders(
        "https://sg.example",
        graphError as unknown as typeof fetch,
      ),
    ).toBe("down");

    expect(await checkOrders(undefined)).toBe("down");
  });

  it("summarises the overall state", () => {
    const allOk = { app: "ok", blockchain: "ok", orders: "ok" } as const;
    expect(summarizeReachability(false, allOk)).toBe("offline");
    expect(summarizeReachability(true, undefined)).toBe("checking");
    expect(summarizeReachability(true, allOk)).toBe("connected");
    expect(summarizeReachability(true, { ...allOk, blockchain: "down" })).toBe(
      "degraded",
    );
  });
});
