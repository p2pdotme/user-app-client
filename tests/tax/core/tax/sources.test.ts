import { describe, expect, it } from "vitest";
import { RULES } from "@/tax/core/tax/rules";
import { SOURCE_CATEGORIES, SOURCES } from "@/tax/core/tax/sources";

const ids = new Set<string>(SOURCES.map((s) => s.id));

describe("legal sources", () => {
  it.each(SOURCES.map((s) => [s.id, s.url]))(
    "%s has a valid https URL",
    (_id, url) => {
      const parsed = new URL(url);
      expect(parsed.protocol).toBe("https:");
      expect(parsed.hostname).toMatch(/\./);
    },
  );

  it("has unique ids and a known category for every source", () => {
    expect(ids.size).toBe(SOURCES.length);
    const categories = new Set(SOURCE_CATEGORIES.map((c) => c.id));
    for (const s of SOURCES) expect(categories.has(s.category)).toBe(true);
  });

  it("every category has at least one source", () => {
    for (const c of SOURCE_CATEGORIES) {
      expect(SOURCES.some((s) => s.category === c.id)).toBe(true);
    }
  });

  it("CBDT circulars link to the official originals", () => {
    for (const id of ["circular-13", "circular-14"]) {
      const s = SOURCES.find((x) => x.id === id);
      expect(s?.isOfficial).toBe(true);
      expect(new URL(s?.url ?? "").hostname).toBe("www.incometaxindia.gov.in");
    }
  });

  it("only government domains are marked official", () => {
    for (const s of SOURCES) {
      const gov = new URL(s.url).hostname.endsWith(".gov.in");
      expect(s.isOfficial).toBe(gov);
    }
  });
});

describe("rule → source mapping", () => {
  it.each(Object.values(RULES).map((r) => [r.id, r.sources]))(
    "%s references at least one existing source",
    (_id, sources) => {
      expect(sources.length).toBeGreaterThan(0);
      for (const id of sources) expect(ids.has(id)).toBe(true);
    },
  );

  it("follows the documented mapping for the key rules", () => {
    expect(RULES.VDA.sources).toEqual(
      expect.arrayContaining(["official-vda-page", "notification-67"]),
    );
    for (const r of [RULES.RATE_30, RULES.COST_ONLY, RULES.LOSS_IGNORED]) {
      expect(r.sources).toEqual(
        expect.arrayContaining(["section-115bbh", "official-vda-page"]),
      );
    }
    expect(RULES.TDS_SELLER.sources).toEqual(
      expect.arrayContaining(["circular-13", "circular-14"]),
    );
    expect(RULES.TDS_BUYER.sources).toEqual(
      expect.arrayContaining(["tds-vda-official", "form-26qe"]),
    );
    expect(RULES.FINANCIAL_YEAR.sources).toEqual(
      expect.arrayContaining(["taxguru-2025", "taxscan-2025"]),
    );
    expect(RULES.SCHEDULE_VDA.sources).toContain("efiling-portal");
  });
});
