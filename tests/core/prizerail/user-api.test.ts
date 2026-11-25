import { describe, expect, it, vi } from "vitest";
import {
  fetchCampaignDetails,
  fetchUserPrizeSummary,
  fetchUserPublicityLinks,
  winnerLinkMessage,
} from "@/core/prizerail/user-api";

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

const DETAILS = {
  slug: "p2p-ramp",
  name: "p2p-ramp",
  status: "active",
  page: "https://www.prizerail.com/campaigns/p2p-ramp",
  termsUrl: null,
  privacyUrl: null,
  schedule: {
    cadence: "hourly",
    timezone: "Asia/Kolkata",
    drawHour: 0,
    drawMinute: 0,
    drawWeekday: null,
    drawDayOfMonth: null,
    cutoffMinutes: 15,
    startsAt: "2026-10-29T10:45:03.467Z",
    endsAt: null,
  },
  winnersPerDraw: 3,
  prizes: {
    tiers: [
      { amountCents: 100, odds: 0.1 },
      { amountCents: 50, odds: 0.4 },
      { amountCents: 25, odds: 0.5 },
    ],
    averagePrizeCents: 42,
  },
  guarantee: { amountCents: 10000, thresholdCents: 10000, periodDays: 30 },
  largePrizeThresholdCents: 60000,
  nextDrawing: null,
  currentDrawing: null,
  stats: {
    drawingsScanned: 119,
    drawingsHeld: 8,
    drawingsSkipped: 64,
    winnersCount: 10,
    uniqueWinnersCount: 3,
    totalPrizesCents: 6250,
    totalPrizesUsdc: 62.5,
    biggestPrizeCents: 1500,
    firstDrawAt: "2026-10-29T10:48:25.108Z",
    lastDrawAt: "2026-10-31T17:30:00.000Z",
  },
  recentDrawings: [],
};

describe("fetchCampaignDetails", () => {
  it("requests /campaign/details and keeps the prize table and totals", async () => {
    const fetchImpl = vi.fn(async () =>
      jsonResponse(200, { success: true, data: DETAILS }),
    );

    const details = await fetchCampaignDetails({
      baseUrl: "http://localhost:8080/",
      fetchImpl,
    });

    expect(fetchImpl).toHaveBeenCalledTimes(1);
    expect(fetchImpl).toHaveBeenCalledWith(
      "http://localhost:8080/api/v1/prizerail/campaign/details",
      expect.anything(),
    );
    expect(details.winnersPerDraw).toBe(3);
    expect(details.schedule?.cadence).toBe("hourly");
    expect(details.prizes?.tiers).toEqual(DETAILS.prizes.tiers);
    expect(details.prizes?.averagePrizeCents).toBe(42);
    expect(details.stats.totalPrizesCents).toBe(6250);
    expect(details.stats.biggestPrizeCents).toBe(1500);
  });

  it("accepts a campaign with no prize table published", async () => {
    const fetchImpl = vi.fn(async () =>
      jsonResponse(200, {
        success: true,
        data: {
          ...DETAILS,
          prizes: null,
          winnersPerDraw: null,
          schedule: null,
        },
      }),
    );
    const details = await fetchCampaignDetails({
      baseUrl: "http://localhost:8080",
      fetchImpl,
    });
    expect(details.prizes).toBeNull();
    expect(details.winnersPerDraw).toBeNull();
  });

  it("surfaces the API's error envelope", async () => {
    const fetchImpl = vi.fn(async () =>
      jsonResponse(502, {
        success: false,
        data: null,
        error: { code: "upstream_unavailable", message: "Prizerail is down" },
      }),
    );
    await expect(
      fetchCampaignDetails({ baseUrl: "http://localhost:8080", fetchImpl }),
    ).rejects.toMatchObject({
      status: 502,
      code: "upstream_unavailable",
    });
  });

  it("rejects a malformed body", async () => {
    const fetchImpl = vi.fn(async () =>
      jsonResponse(200, { success: true, data: { slug: "x" } }),
    );
    await expect(
      fetchCampaignDetails({ baseUrl: "http://localhost:8080", fetchImpl }),
    ).rejects.toMatchObject({ code: "bad_response" });
  });
});

const WALLET = "0xC173753204F6B8914FCA2FF7FB96005D0B7F6F46";
const REQUEST = {
  drawingId: "g1",
  drawingNumber: 1,
  kind: "guarantee",
  drawAt: "2026-11-25T16:15:00.000Z",
  amountCents: 100_000,
  status: "awaiting",
};
const SUMMARY = {
  wallet: WALLET.toLowerCase(),
  campaign: null,
  currentDrawing: null,
  pendingEntries: null,
  wins: { count: 1, totalCents: 100_000 },
  recentWins: [],
};

describe("fetchUserPrizeSummary", () => {
  it("keeps the wins the wallet still has to share", async () => {
    const fetchImpl = vi.fn(async () =>
      jsonResponse(200, {
        success: true,
        data: { ...SUMMARY, publicityRequests: [REQUEST] },
      }),
    );
    const summary = await fetchUserPrizeSummary(WALLET, {
      baseUrl: "http://localhost:8080",
      fetchImpl,
    });
    expect(summary.publicityRequests).toEqual([REQUEST]);
  });

  it("reads an API from before winner publicity as nothing to share", async () => {
    const fetchImpl = vi.fn(async () =>
      jsonResponse(200, { success: true, data: SUMMARY }),
    );
    const summary = await fetchUserPrizeSummary(WALLET, {
      baseUrl: "http://localhost:8080",
      fetchImpl,
    });
    expect(summary.publicityRequests).toEqual([]);
  });
});

describe("winnerLinkMessage", () => {
  it("is the exact text the API checks, with the wallet lower-cased", () => {
    expect(winnerLinkMessage(WALLET, "2026-11-25T16:19:00.000Z")).toBe(
      "P2P.me prize draw: show my winner link\n" +
        "Wallet: 0xc173753204f6b8914fca2ff7fb96005d0b7f6f46\n" +
        "Time: 2026-11-25T16:19:00.000Z",
    );
  });
});

describe("fetchUserPublicityLinks", () => {
  const PROOF = { signature: "0xabcdef", signedAt: "2026-11-25T16:19:00.000Z" };
  const LINK = { ...REQUEST, url: "https://www.prizerail.com/disclosures/abc" };

  it("sends the wallet proof in headers and returns the links", async () => {
    const fetchImpl = vi.fn(async (_url: string, _init?: RequestInit) =>
      jsonResponse(200, { success: true, data: [LINK] }),
    );
    const links = await fetchUserPublicityLinks(WALLET, PROOF, {
      baseUrl: "http://localhost:8080/",
      fetchImpl: fetchImpl as unknown as typeof fetch,
    });

    expect(links).toEqual([LINK]);
    const [url, init] = fetchImpl.mock.calls[0];
    expect(url).toBe(
      `http://localhost:8080/api/v1/prizerail/users/${WALLET}/publicity`,
    );
    expect(init?.headers).toMatchObject({
      "X-Wallet-Signature": PROOF.signature,
      "X-Wallet-Signed-At": PROOF.signedAt,
    });
  });

  it("refuses a link that is not https", async () => {
    for (const url of ["javascript:alert(1)", "http://www.prizerail.com/x"]) {
      const fetchImpl = vi.fn(async () =>
        jsonResponse(200, { success: true, data: [{ ...LINK, url }] }),
      );
      await expect(
        fetchUserPublicityLinks(WALLET, PROOF, {
          baseUrl: "http://localhost:8080",
          fetchImpl,
        }),
      ).rejects.toMatchObject({ code: "bad_response" });
    }
  });

  it("surfaces a rejected signature", async () => {
    const fetchImpl = vi.fn(async () =>
      jsonResponse(401, {
        success: false,
        data: null,
        error: {
          code: "unauthorized",
          message: "the wallet signature is not valid",
        },
      }),
    );
    await expect(
      fetchUserPublicityLinks(WALLET, PROOF, {
        baseUrl: "http://localhost:8080",
        fetchImpl,
      }),
    ).rejects.toMatchObject({ status: 401, code: "unauthorized" });
  });
});
