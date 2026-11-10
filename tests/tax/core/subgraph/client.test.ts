import fixture from "@tests/tax/fixtures/user-orders-pages.json";
import { rawOrder } from "@tests/tax/helpers/factories";
import { getAddress } from "viem";
import { describe, expect, it, vi } from "vitest";
import {
  fetchAllOrders,
  normalizeAddress,
  type PageFetcher,
  type PageVars,
} from "@/tax/core/subgraph/client";
import { normalizeOrders } from "@/tax/core/subgraph/normalize";
import {
  FORBIDDEN_FIELDS,
  ORDER_FIELDS,
  USER_ORDERS_QUERY,
} from "@/tax/core/subgraph/queries";
import type { RawOrder } from "@/tax/core/types";

describe("address validation", () => {
  it("accepts 0x + 40 hex and lowercases it", () => {
    expect(
      normalizeAddress("  0xA059FEF9E1CD75D7C8D337E620EC3024F08CD3B4 "),
    ).toBe("0xa059fef9e1cd75d7c8d337e620ec3024f08cd3b4");
  });
  it("accepts a valid EIP-55 checksum and rejects a broken one", () => {
    const checksummed = getAddress(`0x${"ab".repeat(20)}`);
    expect(normalizeAddress(checksummed)).toBe(`0x${"ab".repeat(20)}`);
    const broken = `${checksummed.slice(0, -1)}${checksummed.at(-1) === "b" ? "B" : "b"}`;
    expect(normalizeAddress(broken)).toBeNull();
  });
  it.each([
    "",
    "0x123",
    "a059fef9e1cd75d7c8d337e620ec3024f08cd3b4",
    "0xg059fef9e1cd75d7c8d337e620ec3024f08cd3b4",
    `0x${"a".repeat(41)}`,
  ])("rejects %s", (bad) => expect(normalizeAddress(bad)).toBeNull());
});

describe("privacy", () => {
  it("query never requests sensitive fields", () => {
    for (const f of FORBIDDEN_FIELDS)
      expect(USER_ORDERS_QUERY).not.toMatch(new RegExp(`\\b${f}\\b`));
    for (const f of ORDER_FIELDS)
      expect(USER_ORDERS_QUERY).toMatch(new RegExp(`\\b${f}\\b`));
  });
});

describe("pagination with mocked GraphQL pages", () => {
  const makePages = (sizes: number[]): RawOrder[][] =>
    sizes.map((n) => Array.from({ length: n }, () => rawOrder()));

  it("loops with id_gt until a short page, reporting progress", async () => {
    const pages = makePages([1000, 1000, 300]);
    const calls: PageVars[] = [];
    const fetchPage: PageFetcher = async (vars) => {
      calls.push(vars);
      return pages[calls.length - 1];
    };
    const progress = vi.fn();
    const all = (
      await fetchAllOrders(`0x${"A".repeat(40)}`, {
        fetchPage,
        onProgress: progress,
      })
    )._unsafeUnwrap();

    expect(all).toHaveLength(2300);
    expect(calls).toHaveLength(3);
    expect(calls[0]).toEqual({
      address: `0x${"a".repeat(40)}`,
      lastId: "0x",
      first: 1000,
    });
    expect(calls[1].lastId).toBe(pages[0][999].id);
    expect(calls[2].lastId).toBe(pages[1][999].id);
    expect(progress.mock.calls.map((c) => c[0])).toEqual([1000, 2000, 2300]);
  });

  it("stops after an exact-size page followed by an empty page", async () => {
    const pages = makePages([1000, 0]);
    let i = 0;
    const all = (
      await fetchAllOrders(`0x${"b".repeat(40)}`, {
        fetchPage: async () => pages[i++],
      })
    )._unsafeUnwrap();
    expect(all).toHaveLength(1000);
    expect(i).toBe(2);
  });

  it("replays recorded subgraph pages (page size 25)", async () => {
    const calls: PageVars[] = [];
    const fetchPage: PageFetcher = async (vars) => {
      calls.push(vars);
      const page = fixture.pages.find(
        (p) => p.variables.lastId === vars.lastId,
      );
      if (!page) throw new Error(`unexpected lastId ${vars.lastId}`);
      return page.rows as RawOrder[];
    };
    const all = (
      await fetchAllOrders(fixture.address, {
        fetchPage,
        pageSize: fixture.pageSize,
      })
    )._unsafeUnwrap();
    expect(calls.map((c) => c.lastId)).toEqual(
      fixture.pages.map((p) => p.variables.lastId),
    );
    expect(all).toHaveLength(76);

    const { orders, excluded } = normalizeOrders(all);
    expect(orders.length + excluded.length).toBe(76);
    expect(
      orders.every((o) => o.qty.greaterThan(0) && o.inr.greaterThan(0)),
    ).toBe(true);
    expect(excluded.some((e) => e.reason === "CANCELLED")).toBe(true);
  });

  it("returns a typed SGNetworkError for network failures", async () => {
    const fetchPage: PageFetcher = async () => {
      throw new Error("ECONNRESET");
    };
    const result = await fetchAllOrders(`0x${"c".repeat(40)}`, { fetchPage });
    expect(result.isErr()).toBe(true);
    expect(result._unsafeUnwrapErr()).toMatchObject({
      domain: "Subgraph",
      code: "SGNetworkError",
    });
  });

  it.each([
    ["missing fields", [{ foo: 1 }]],
    ["non-numeric amount", [{ ...rawOrder(), usdcAmount: "1.5" }]],
    ["bad tx hash", [{ ...rawOrder(), transactionHash: "0xzz" }]],
    ["not an array", { orders: [] }],
  ])("returns SGParseError for %s", async (_label, page) => {
    const fetchPage: PageFetcher = async () => page;
    const result = await fetchAllOrders(`0x${"c".repeat(40)}`, { fetchPage });
    expect(result._unsafeUnwrapErr().code).toBe("SGParseError");
  });

  it("returns SGTooManyPages when the API never ends", async () => {
    const page = Array.from({ length: 2 }, () => rawOrder());
    const result = await fetchAllOrders(`0x${"c".repeat(40)}`, {
      fetchPage: async () => page,
      pageSize: 2,
      maxPages: 3,
    });
    expect(result._unsafeUnwrapErr().code).toBe("SGTooManyPages");
  });

  it("rejects an invalid address before any request", async () => {
    const fetchPage = vi.fn();
    const result = await fetchAllOrders("0x12", { fetchPage });
    expect(result._unsafeUnwrapErr().code).toBe("SGInvalidAddress");
    expect(fetchPage).not.toHaveBeenCalled();
  });
});
