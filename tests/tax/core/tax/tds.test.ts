import { istDate } from "@tests/tax/helpers/factories";
import { describe, expect, it } from "vitest";
import { advanceTaxPlan } from "@/tax/core/tax/advance-tax";
import {
  applyThreshold,
  buyerAdvisory,
  form26qeDueDate,
  sellerTdsCheck,
  type TdsItem,
  tdsFormsFor,
  tdsThreshold,
} from "@/tax/core/tax/tds";
import { D, type Dec } from "@/tax/lib/decimal";

const item = (
  id: string,
  local: string,
  amount: number,
  counterparty: string | null = "0xmerchant1",
): TdsItem => ({
  id,
  orderId: id,
  date: istDate(local),
  amount: new D(amount),
  counterparty,
});

describe("TDS threshold, per payer and payee", () => {
  it("₹10,000: once crossed, 1% of the whole amount paid by that payer", () => {
    expect(tdsThreshold(false).toString()).toBe("10000");
    const lines = applyThreshold(
      [
        item("a", "2026-04-10T10:00", 6_000),
        item("b", "2026-04-11T10:00", 4_000),
        item("c", "2026-04-12T10:00", 3_000),
        item("d", "2026-04-13T10:00", 2_000),
      ],
      tdsThreshold(false),
    );
    // 6,000 → 10,000 (not exceeding) → 13,000 crosses: 1% of 13,000; then 1% each
    expect(lines.map((l) => l.tds.toFixed(2))).toEqual([
      "0.00",
      "0.00",
      "130.00",
      "20.00",
    ]);
  });

  it("₹50,000 for a specified person", () => {
    const check = sellerTdsCheck(
      [
        item("a", "2026-05-01T10:00", 30_000),
        item("b", "2026-05-02T10:00", 25_000),
        item("c", "2026-05-03T10:00", 10_000),
      ],
      true,
      new D(0),
    );
    expect(check.threshold.toString()).toBe("50000");
    expect(check.lines.map((l) => l.tds.toFixed(2))).toEqual([
      "0.00",
      "550.00",
      "100.00",
    ]);
    expect(check.expected.toFixed(2)).toBe("650.00");
  });

  it("no TDS when sales are spread over many buyers, none above the limit", () => {
    const check = sellerTdsCheck(
      Array.from({ length: 10 }, (_, i) =>
        item(
          `s${i}`,
          `2026-05-${String(i + 1).padStart(2, "0")}T10:00`,
          9_000,
          `0xbuyer${i}`,
        ),
      ),
      false,
      new D(0),
    );
    expect(check.expected.toFixed(2)).toBe("0.00");
    expect(check.byCounterparty).toHaveLength(10);
    expect(check.byCounterparty.every((c) => !c.crossed)).toBe(true);
    expect(check.hasUnknownCounterparty).toBe(false);
  });

  it("groups orders with no known counterparty and flags the figure as a ceiling", () => {
    const check = sellerTdsCheck(
      [
        item("a", "2026-05-01T10:00", 8_000, null),
        item("b", "2026-05-02T10:00", 8_000, null),
      ],
      false,
      new D(0),
    );
    expect(check.hasUnknownCounterparty).toBe(true);
    expect(check.expected.toFixed(2)).toBe("160.00");
  });

  it("compares expected with entered TDS", () => {
    const check = sellerTdsCheck(
      [item("a", "2026-05-01T10:00", 60_000)],
      true,
      new D(600),
    );
    expect(check.expected.toFixed(2)).toBe("600.00");
    expect(check.difference.toFixed(2)).toBe("0.00");
  });
});

describe("buyer-side advisory", () => {
  it("uses the user's own limit per seller and groups deductions by IST month", () => {
    const adv = buyerAdvisory(
      [
        item("a", "2026-04-05T10:00", 9_000),
        item("b", "2026-04-30T23:50", 2_000),
        item("c", "2026-05-01T00:05", 5_000),
      ],
      false,
    );
    // crossing in April on 11,000 → 110; May 5,000 → 50
    expect(
      adv.months.map((m) => [m.month, m.tds.toFixed(2), m.dueDate]),
    ).toEqual([
      ["2026-04", "110.00", "2026-05-30"],
      ["2026-05", "50.00", "2026-06-30"],
    ]);
    expect(adv.total.toFixed(2)).toBe("160.00");
  });

  it("buying ₹20,000 from each of ten sellers needs no deduction", () => {
    const adv = buyerAdvisory(
      Array.from({ length: 10 }, (_, i) =>
        item(`b${i}`, "2026-06-01T10:00", 20_000, `0xseller${i}`),
      ),
      true,
    );
    expect(adv.total.toFixed(2)).toBe("0.00");
  });

  it("uses Form 26QE / 16E up to March 2026 and Form 141 / 132 from April 2026", () => {
    expect(tdsFormsFor("2026-03")).toEqual({
      statement: "Form 26QE",
      certificate: "Form 16E",
    });
    expect(tdsFormsFor("2026-04")).toEqual({
      statement: "Form 141 (Schedule D)",
      certificate: "Form 132",
    });
  });

  it("computes due dates 30 days from month end", () => {
    expect(form26qeDueDate("2027-01")).toBe("2027-03-02");
    expect(form26qeDueDate("2027-02")).toBe("2027-03-30");
    expect(form26qeDueDate("2026-12")).toBe("2027-01-30");
  });
});

describe("advance tax plan, on gains accrued by each date", () => {
  /** Accrued tax that steps up at given IST dates */
  const steps =
    (points: [string, number][]) =>
    (until: Date): Dec =>
      points
        .filter(([d]) => istDate(`${d}T23:59`) < until)
        .reduce((acc, [, v]) => acc.plus(v), new D(0));

  it("splits 15/45/75/100 when gains arose early", () => {
    const plan = advanceTaxPlan({
      fy: 2026,
      netPayable: new D(20_000),
      accruedTax: steps([["2026-05-01", 20_000]]),
      today: new Date("2026-11-06T00:00:00Z"),
    });
    expect(plan.required).toBe(true);
    expect(
      plan.instalments.map((i) => [i.dueDate, i.amount.toFixed(2), i.status]),
    ).toEqual([
      ["2026-06-15", "3000.00", "PAST"],
      ["2026-09-15", "6000.00", "PAST"],
      ["2026-12-15", "6000.00", "UPCOMING"],
      ["2027-03-15", "5000.00", "UPCOMING"],
    ]);
  });

  it("gains only in Q4: nothing due until 15 March, no interest for earlier dates", () => {
    const plan = advanceTaxPlan({
      fy: 2026,
      netPayable: new D(20_000),
      accruedTax: steps([["2027-01-10", 20_000]]),
    });
    expect(plan.instalments.map((i) => i.amount.toFixed(2))).toEqual([
      "0.00",
      "0.00",
      "0.00",
      "20000.00",
    ]);
  });

  it("gains after 15 March are paid by 31 March", () => {
    const plan = advanceTaxPlan({
      fy: 2026,
      netPayable: new D(30_000),
      accruedTax: steps([
        ["2026-05-01", 20_000],
        ["2027-03-20", 10_000],
      ]),
    });
    const last = plan.instalments[plan.instalments.length - 1];
    expect(last.dueDate).toBe("2027-03-31");
    expect(last.yearEnd).toBe(true);
    expect(last.amount.toFixed(2)).toBe("10000.00");
  });

  it("is not required below ₹10,000 or for refunds", () => {
    const flat = () => new D(0);
    expect(
      advanceTaxPlan({
        fy: 2026,
        netPayable: new D(9_999.99),
        accruedTax: flat,
      }).required,
    ).toBe(false);
    expect(
      advanceTaxPlan({ fy: 2026, netPayable: new D(-500), accruedTax: flat })
        .required,
    ).toBe(false);
    expect(
      advanceTaxPlan({ fy: 2026, netPayable: new D(10_000), accruedTax: flat })
        .required,
    ).toBe(true);
  });
});
