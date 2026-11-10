import { describe, expect, it, vi } from "vitest";
import { fetchTokenTransfers, USDC_BASE } from "@/tax/core/onchain";

const W = `0x${"ab".repeat(20)}`;
const X = `0x${"cd".repeat(20)}`;

const row = (i: number) => ({
  hash: `0x${i.toString(16).padStart(64, "0")}`,
  timeStamp: String(1_780_000_000 + i),
  from: X,
  to: W,
  value: "1500000",
  contractAddress: USDC_BASE.toUpperCase().replace("0X", "0x"),
  tokenDecimal: "6",
  tokenSymbol: "USDC",
});

describe("block explorer fetch", () => {
  it("pages until a short page and scales by token decimals", async () => {
    const fetchPage = vi.fn(async (url: string) => {
      const page = Number(new URL(url).searchParams.get("page"));
      const count = page === 1 ? 1000 : 3;
      return {
        status: "1",
        message: "OK",
        result: Array.from({ length: count }, (_, i) => row(page * 10_000 + i)),
      };
    });
    const r = await fetchTokenTransfers(W, {
      fetchPage,
      baseUrl: "https://x.test/api",
    });
    const list = r._unsafeUnwrap().transfers;
    expect(fetchPage).toHaveBeenCalledTimes(2);
    expect(list).toHaveLength(1003);
    expect(list[0].amount.toString()).toBe("1.5");
    expect(list[0].token).toBe(USDC_BASE);
    const url = new URL(fetchPage.mock.calls[0][0]);
    expect(url.searchParams.get("action")).toBe("tokentx");
    expect(url.searchParams.get("address")).toBe(W);
  });

  it("treats status 0 with no rows as an empty history", async () => {
    const r = await fetchTokenTransfers(W, {
      fetchPage: async () => ({
        status: "0",
        message: "No token transfers found",
        result: [],
      }),
    });
    expect(r._unsafeUnwrap()).toEqual({ transfers: [], skipped: 0 });
  });

  it("reports network and shape errors with their own codes", async () => {
    const down = await fetchTokenTransfers(W, {
      fetchPage: async () => {
        throw new Error("offline");
      },
    });
    expect(down._unsafeUnwrapErr().code).toBe("OCNetworkError");
    const odd = await fetchTokenTransfers(W, {
      fetchPage: async () => ({
        status: "0",
        message: "NOTOK",
        result: "rate limit",
      }),
    });
    expect(odd._unsafeUnwrapErr().code).toBe("OCParseError");
  });

  it("counts rows that are not ERC-20 transfers instead of failing", async () => {
    const nft = { ...row(1), tokenDecimal: "" };
    const r = await fetchTokenTransfers(W, {
      fetchPage: async () => ({
        status: "1",
        message: "OK",
        result: [nft, row(2)],
      }),
    });
    expect(r._unsafeUnwrap().transfers).toHaveLength(1);
    expect(r._unsafeUnwrap().skipped).toBe(1);
  });

  it("rejects an invalid address without fetching", async () => {
    const fetchPage = vi.fn();
    const r = await fetchTokenTransfers("0x12", { fetchPage });
    expect(r.isErr()).toBe(true);
    expect(fetchPage).not.toHaveBeenCalled();
  });
});
