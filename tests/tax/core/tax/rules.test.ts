import { describe, expect, it } from "vitest";
import { RULES, surchargeRateFor } from "@/tax/core/tax/rules";
import { D } from "@/tax/lib/decimal";

const rate = (income: number, regime: "NEW" | "OLD"): string =>
  surchargeRateFor(new D(income), regime).toString();

describe("surcharge slabs", () => {
  it.each([
    [50_00_000, "0", "0"],
    [50_00_001, "0.1", "0.1"],
    [1_00_00_000, "0.1", "0.1"],
    [1_00_00_001, "0.15", "0.15"],
    [2_00_00_001, "0.25", "0.25"],
    [5_00_00_000, "0.25", "0.25"],
    [5_00_00_001, "0.25", "0.37"],
    [50_00_00_000, "0.25", "0.37"],
  ])("total income ₹%i → new %s / old %s", (income, newRate, oldRate) => {
    expect(rate(income, "NEW")).toBe(newRate);
    expect(rate(income, "OLD")).toBe(oldRate);
  });
});

describe("rule citations", () => {
  it("no 2025 Act citation is left as a vague placeholder except TDS credit", () => {
    for (const rule of Object.values(RULES)) {
      if (rule.id === "TDS_CREDIT") continue;
      expect(rule.cite.ITA_2025).not.toMatch(/corresponding provision of the/);
    }
  });

  it("every rule has English text and a citation for both Acts", () => {
    for (const rule of Object.values(RULES)) {
      expect(rule.text.length).toBeGreaterThan(10);
      expect(rule.cite.ITA_1961.length).toBeGreaterThan(3);
      expect(rule.cite.ITA_2025.length).toBeGreaterThan(3);
    }
  });

  it("uses the confirmed section numbers", () => {
    expect(RULES.RATE_30.cite.ITA_1961).toContain("115BBH");
    expect(RULES.RATE_30.cite.ITA_2025).toContain("s.194(1), Table Sl. No. 4");
    expect(RULES.TDS_SELLER.cite.ITA_1961).toContain("194S");
    expect(RULES.TDS_SELLER.cite.ITA_2025).toContain(
      "s.393(1), Table Sl. No. 8(vi)",
    );
    expect(RULES.ADVANCE_TAX.cite.ITA_2025).toContain("ss.403 to 408");
    expect(RULES.ADVANCE_TAX.cite.ITA_2025).toContain("s.425");
    expect(RULES.VDA.cite.ITA_2025).toContain("s.2(111)");
    expect(RULES.SALE_TAXABLE.cite.ITA_2025).toContain("s.2(109)");
    expect(RULES.SURCHARGE.cite.ITA_2025).toContain("s.202");
    expect(RULES.TDS_SELLER.cite.ITA_2025).toContain("s.393(4)");
    expect(RULES.TDS_BUYER.cite.ITA_2025).toContain(
      "Form 141 (Schedule D) and Form 132",
    );
    expect(RULES.FINANCIAL_YEAR.cite.ITA_2025).toContain("s.3 (tax year)");
    expect(RULES.RECEIPT_COST.cite.ITA_2025).toContain("s.92(2)(m)");
  });
});
