import { describe, expect, it, vi } from "vitest";
import { fetchCampaignDraws } from "@/core/prizerail/public";

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

const DRAW = {
  id: "abc",
  number: 7,
  drawAt: "2026-11-03T17:00:00.000Z",
  cutoffAt: "2026-11-03T16:30:00.000Z",
  stage: "open",
  winners: 3,
  entrants: { count: 120, totalWeight: 4800, list: "/x/entrants.json" },
  proof: "/campaigns/p2p-daily/draws/abc/proof.json",
};

describe("fetchCampaignDraws", () => {
  it("requests the public draws feed and maps the documented fields", async () => {
    const fetchImpl = vi.fn(async () =>
      jsonResponse(200, {
        campaign: {
          name: "P2P Daily",
          status: "active",
          cadence: "daily",
          timezone: "UTC",
          winnersPerDraw: 3,
        },
        draws: [DRAW],
      }),
    );

    const res = await fetchCampaignDraws("p2p-daily", {
      baseUrl: "https://www.prizerail.com",
      fetchImpl,
      limit: 5,
    });

    expect(fetchImpl).toHaveBeenCalledTimes(1);
    const [firstCall] = fetchImpl.mock.calls as unknown as [[string]];
    const url = new URL(firstCall[0]);
    expect(url.origin + url.pathname).toBe(
      "https://www.prizerail.com/campaigns/p2p-daily/draws.json",
    );
    expect(url.searchParams.get("limit")).toBe("5");
    expect(res.campaign.name).toBe("P2P Daily");
    expect(res.campaign.winnersPerDraw).toBe(3);
    expect(res.draws).toHaveLength(1);
    expect(res.draws[0]).toMatchObject({
      id: "abc",
      number: 7,
      stage: "open",
      winnersCount: 3,
      entrantCount: 120,
      totalEntries: 4800,
      proofUrl: "/campaigns/p2p-daily/draws/abc/proof.json",
    });
  });

  it("tolerates winners as an array, a `drawings` key, and missing campaign", async () => {
    const fetchImpl = vi.fn(async () =>
      jsonResponse(200, {
        drawings: [{ ...DRAW, winners: [{}, {}], entrants: undefined }],
      }),
    );
    const res = await fetchCampaignDraws("p2p-daily", {
      baseUrl: "https://www.prizerail.com",
      fetchImpl,
    });
    expect(res.campaign.name).toBeNull();
    expect(res.draws[0]?.winnersCount).toBe(2);
    expect(res.draws[0]?.entrantCount).toBeNull();
  });

  it("drops a malformed draw but keeps the rest", async () => {
    const fetchImpl = vi.fn(async () =>
      jsonResponse(200, { draws: [{ id: 1 }, DRAW] }),
    );
    const res = await fetchCampaignDraws("p2p-daily", {
      baseUrl: "https://www.prizerail.com",
      fetchImpl,
    });
    expect(res.draws.map((d) => d.id)).toEqual(["abc"]);
  });

  it("throws on a non-2xx so react-query can surface the error", async () => {
    const fetchImpl = vi.fn(async () => jsonResponse(404, { error: "nope" }));
    await expect(
      fetchCampaignDraws("missing", {
        baseUrl: "https://www.prizerail.com",
        fetchImpl,
      }),
    ).rejects.toThrow(/404/);
  });

  it("throws when the envelope has no draws array", async () => {
    const fetchImpl = vi.fn(async () => jsonResponse(200, { hello: 1 }));
    await expect(
      fetchCampaignDraws("p2p-daily", {
        baseUrl: "https://www.prizerail.com",
        fetchImpl,
      }),
    ).rejects.toThrow(/draws/);
  });
});
