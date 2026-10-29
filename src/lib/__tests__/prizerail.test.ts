import { afterEach, describe, expect, it, vi } from "vitest";
import type { PublicDraw } from "@/core/prizerail/public";
import {
  entriesForOrderUsdc,
  estimateDrawEntries,
  getDrawEntryPercent,
  getPrizerailCampaignSlug,
  getPrizerailCampaignUrl,
  selectDrawWindow,
} from "@/lib/prizerail";

const draw = (over: Partial<PublicDraw>): PublicDraw => ({
  id: "d",
  number: 1,
  drawAt: "2026-11-03T17:00:00.000Z",
  cutoffAt: "2026-11-03T16:30:00.000Z",
  stage: "open",
  winnersCount: null,
  entrantCount: null,
  totalEntries: null,
  proofUrl: null,
  ...over,
});

describe("getDrawEntryPercent", () => {
  it("defaults to 2% and mirrors the per-market overrides", () => {
    expect(getDrawEntryPercent()).toBe(2);
    expect(getDrawEntryPercent("NGN")).toBe(2);
    expect(getDrawEntryPercent("ARS")).toBe(1);
    expect(getDrawEntryPercent("MEX")).toBe(1);
    expect(getDrawEntryPercent("INR")).toBe(0);
  });
});

describe("entriesForOrderUsdc", () => {
  it("gives one entry per cent of the percentage of the order", () => {
    // $50 at 2% = $1.00 = 100 entries
    expect(entriesForOrderUsdc("50", 2)).toBe(100);
    expect(entriesForOrderUsdc(50, 1)).toBe(50);
  });

  it("floors fractional cents and never goes negative", () => {
    expect(entriesForOrderUsdc("0.49", 2)).toBe(0);
    expect(entriesForOrderUsdc("12.345", 2)).toBe(24);
    expect(entriesForOrderUsdc("-5", 2)).toBe(0);
    expect(entriesForOrderUsdc("abc", 2)).toBe(0);
    expect(entriesForOrderUsdc("10", 0)).toBe(0);
  });
});

describe("estimateDrawEntries", () => {
  const order = (over: Record<string, unknown>) =>
    ({
      orderId: "1",
      type: "BUY",
      status: "COMPLETED",
      placedAt: "1000",
      usdcAmount: "100",
      fiatAmount: "1",
      currency: "NGN",
      disputeStatus: "DEFAULT",
      ...over,
      // biome-ignore lint/suspicious/noExplicitAny: test fixture
    }) as any;

  const window = { startSec: 500, endSec: 1500 };

  it("sums completed BUY and SELL orders placed inside the window", () => {
    const orders = [
      order({ orderId: "1", usdcAmount: "100" }), // 200 entries
      order({ orderId: "2", type: "SELL", usdcAmount: "50", currency: "ARS" }), // 50
      order({ orderId: "3", type: "PAY", usdcAmount: "999" }), // excluded
      order({ orderId: "4", status: "CANCELLED", usdcAmount: "999" }), // excluded
      order({ orderId: "5", placedAt: "1500", usdcAmount: "999" }), // end is exclusive
      order({ orderId: "6", placedAt: "499", usdcAmount: "999" }), // before start
      order({ orderId: "7", currency: "INR", usdcAmount: "999" }), // 0% market
    ];
    expect(estimateDrawEntries(orders, window)).toBe(250);
  });

  it("returns zero for no orders", () => {
    expect(estimateDrawEntries([], window)).toBe(0);
  });
});

describe("selectDrawWindow", () => {
  const nowSec = Date.parse("2026-11-03T12:00:00.000Z") / 1000;

  it("uses the next open draw's cutoff and the previous draw's cutoff", () => {
    const draws = [
      draw({ id: "next", stage: "open" }),
      draw({
        id: "prev",
        stage: "paid",
        drawAt: "2026-11-02T17:00:00.000Z",
        cutoffAt: "2026-11-02T16:30:00.000Z",
      }),
    ];
    const w = selectDrawWindow(draws, nowSec);
    expect(w.nextDraw?.id).toBe("next");
    expect(w.startSec).toBe(Date.parse("2026-11-02T16:30:00.000Z") / 1000);
    expect(w.endSec).toBe(Date.parse("2026-11-03T16:30:00.000Z") / 1000);
  });

  it("picks the soonest open draw when several are open", () => {
    const draws = [
      draw({ id: "later", cutoffAt: "2026-11-04T16:30:00.000Z" }),
      draw({ id: "sooner", cutoffAt: "2026-11-03T16:30:00.000Z" }),
    ];
    expect(selectDrawWindow(draws, nowSec).nextDraw?.id).toBe("sooner");
  });

  it("falls back to a 24h window ending at the next cutoff with no history", () => {
    const w = selectDrawWindow([draw({ id: "next" })], nowSec);
    expect(w.endSec - w.startSec).toBe(24 * 60 * 60);
  });

  it("ignores an open draw with no cutoff", () => {
    const w = selectDrawWindow([draw({ id: "x", cutoffAt: null })], nowSec);
    expect(w.nextDraw).toBeNull();
    expect(w.endSec).toBe(nowSec);
  });

  it("falls back to the last 24h when no draw is open", () => {
    const w = selectDrawWindow([draw({ stage: "paid" })], nowSec);
    expect(w.nextDraw).toBeNull();
    expect(w.endSec).toBe(nowSec);
    expect(w.endSec - w.startSec).toBe(24 * 60 * 60);
  });
});

describe("campaign env helpers", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("reads the slug and builds the public campaign url", () => {
    vi.stubEnv("VITE_PRIZERAIL_CAMPAIGN_SLUG", "p2p-daily");
    expect(getPrizerailCampaignSlug()).toBe("p2p-daily");
    expect(getPrizerailCampaignUrl("p2p-daily")).toBe(
      "https://www.prizerail.com/campaigns/p2p-daily",
    );
  });

  it("prefers an explicit campaign url and a sandbox base", () => {
    vi.stubEnv("VITE_PRIZERAIL_PUBLIC_URL", "https://sandbox.prizerail.com/");
    expect(getPrizerailCampaignUrl("x")).toBe(
      "https://sandbox.prizerail.com/campaigns/x",
    );
    vi.stubEnv("VITE_PRIZERAIL_CAMPAIGN_URL", "https://example.test/draw");
    expect(getPrizerailCampaignUrl("x")).toBe("https://example.test/draw");
  });

  it("treats a blank slug as unset", () => {
    vi.stubEnv("VITE_PRIZERAIL_CAMPAIGN_SLUG", "  ");
    expect(getPrizerailCampaignSlug()).toBeUndefined();
  });
});
