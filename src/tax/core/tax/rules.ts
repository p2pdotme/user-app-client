/**
 * Indian income-tax rules for Virtual Digital Assets (VDA), as applied to USDC.
 *
 * Law by transaction date:
 *   - up to 31 Mar 2026 → Income-tax Act, 1961
 *   - from  1 Apr 2026 → Income-tax Act, 2025 (same substance; Budget 2026-27
 *     changed no VDA rates)
 *
 * Where a section number of the 2025 Act has not been confirmed, the citation
 * says "corresponding provision of the Income-tax Act, 2025". Section numbers
 * are never guessed.
 *
 * Every rule here is shown in a tooltip next to the number it drives in the UI.
 */

import type { SourceId } from "@/tax/core/tax/sources";
import type { LawVersion, TaxRegime } from "@/tax/core/types";
import { D, type Dec } from "@/tax/lib/decimal";

// ---------------------------------------------------------------------------
// Rates and thresholds
// ---------------------------------------------------------------------------

/**
 * Flat 30% on income from transfer of VDA, irrespective of slab.
 * 1961 Act: s.115BBH(1) | 2025 Act: s.194, Table Sl. No. 4
 */
export const VDA_TAX_RATE: Dec = new D("0.30");

/**
 * Health & Education Cess: 4% on (tax + surcharge).
 * Levied by the annual Finance Act (unchanged by Budget 2026-27).
 */
export const CESS_RATE: Dec = new D("0.04");

/**
 * Surcharge on the income-tax, by total income. Levied by the annual Finance Act.
 * New regime: highest rate capped at 25% (Finance Act, 2023 onwards, for
 * persons taxed under s.115BAC of the 1961 Act; 2025 Act: corresponding provision).
 * Marginal relief is NOT computed by this app (needs full slab computation).
 */
export interface SurchargeSlab {
  /** Applies when total income EXCEEDS this amount (₹). */
  above: Dec;
  rate: Dec;
  /** Only for the old regime (37% slab). */
  oldRegimeOnly: boolean;
}

export const SURCHARGE_SLABS: readonly SurchargeSlab[] = [
  { above: new D(5_00_00_000), rate: new D("0.37"), oldRegimeOnly: true },
  { above: new D(2_00_00_000), rate: new D("0.25"), oldRegimeOnly: false },
  { above: new D(1_00_00_000), rate: new D("0.15"), oldRegimeOnly: false },
  { above: new D(50_00_000), rate: new D("0.10"), oldRegimeOnly: false },
];

export const NEW_REGIME_SURCHARGE_CAP: Dec = new D("0.25");

/**
 * TDS on transfer of VDA: 1% of the consideration.
 * 1961 Act: s.194S | 2025 Act: s.393(1), Table Sl. No. 8(vi)
 */
export const TDS_RATE: Dec = new D("0.01");

/**
 * No TDS while the aggregate consideration paid by the payer in the FY does not
 * exceed: ₹50,000 if the payer is a "specified person", else ₹10,000.
 * Specified person: an individual or HUF with no income from business or
 * profession, or whose business turnover did not exceed ₹1 crore (or gross
 * professional receipts ₹50 lakh) in the preceding year.
 * 1961 Act: s.194S(1) proviso & s.194S(3) | 2025 Act: s.393(1), Table Sl. No. 8(vi)
 */
export const TDS_THRESHOLD_SPECIFIED: Dec = new D(50_000);
export const TDS_THRESHOLD_OTHER: Dec = new D(10_000);

/** Plain-language test for a "specified person" (s.194S(3) / s.393(4)). */
export const SPECIFIED_PERSON_TEST =
  "A specified person is an individual or HUF with no business or professional income, or whose business turnover was ₹1 crore or less, or gross receipts from a profession ₹50 lakh or less, in the previous year.";

/** Buyer deposits TDS via Form 26QE within 30 days from the end of the month of deduction. */
export const TDS_DEPOSIT_DAYS_AFTER_MONTH_END = 30;

/**
 * Advance tax is payable if tax liability (after TDS) for the year is ≥ ₹10,000.
 * 1961 Act: s.208 (liability), s.211 (instalments), s.234B / s.234C (interest)
 * 2025 Act: ss.403 to 408 (liability, instalments), ss.424 / 425 (interest)
 */
/**
 * Gifts from non-relatives are taxed on receipt only if the year's aggregate
 * value exceeds ₹50,000. 1961 Act: s.56(2)(x) | 2025 Act: s.92(2)(m)
 */
export const GIFT_EXEMPT_LIMIT: Dec = new D(50_000);

export const ADVANCE_TAX_THRESHOLD: Dec = new D(10_000);

export interface AdvanceTaxInstalment {
  /** Month (1-12) and day of the due date. Months 1-3 fall in the next calendar year. */
  month: number;
  day: number;
  /** Cumulative share of the year's tax due by this date. */
  cumulative: Dec;
}

export const ADVANCE_TAX_SCHEDULE: readonly AdvanceTaxInstalment[] = [
  { month: 6, day: 15, cumulative: new D("0.15") },
  { month: 9, day: 15, cumulative: new D("0.45") },
  { month: 12, day: 15, cumulative: new D("0.75") },
  { month: 3, day: 15, cumulative: new D("1.00") },
];

/** Pick the surcharge rate for a total income and regime. */
export function surchargeRateFor(totalIncome: Dec, regime: TaxRegime): Dec {
  for (const slab of SURCHARGE_SLABS) {
    if (slab.oldRegimeOnly && regime === "NEW") continue;
    if (totalIncome.greaterThan(slab.above)) {
      return regime === "NEW" && slab.rate.greaterThan(NEW_REGIME_SURCHARGE_CAP)
        ? NEW_REGIME_SURCHARGE_CAP
        : slab.rate;
    }
  }
  return new D(0);
}

// ---------------------------------------------------------------------------
// Rule texts and citations (shown in tooltips)
// ---------------------------------------------------------------------------

export type RuleId =
  | "VDA"
  | "BUY_NOT_TAXABLE"
  | "SALE_TAXABLE"
  | "PAY_IS_TRANSFER"
  | "RATE_30"
  | "COST_ONLY"
  | "FEES_NOT_DEDUCTIBLE"
  | "LOSS_IGNORED"
  | "NO_EXEMPTION"
  | "SURCHARGE"
  | "CESS"
  | "TOTAL_TAX"
  | "TDS_SELLER"
  | "TDS_CREDIT"
  | "TDS_BUYER"
  | "SCHEDULE_VDA"
  | "ADVANCE_TAX"
  | "FINANCIAL_YEAR"
  | "GST"
  | "COST_METHOD"
  | "OVERSELL"
  | "NET_PAYABLE"
  | "RECEIPT_COST"
  | "RECEIPT_INCOME"
  | "DELIVERED_ELSEWHERE"
  | "NON_INR"
  | "ONCHAIN_CHECK"
  | "TRANSFER_OUT"
  | "TOKEN_SWAP";

export interface Rule {
  id: RuleId;
  cite: Record<LawVersion, string>;
  /** Legal sources (sources.ts) the tooltip links to (at least one) */
  sources: readonly SourceId[];
  text: string;
}

const ITA61 = "Income-tax Act, 1961";
const ITA25 = "Income-tax Act, 2025";
const RATE_2025 = `s.194(1), Table Sl. No. 4, ${ITA25}`;

export const RULES: Record<RuleId, Rule> = {
  VDA: {
    id: "VDA",
    sources: ["official-vda-page", "notification-67"],
    cite: {
      ITA_1961: `s.2(47A), ${ITA61}`,
      ITA_2025: `s.2(111), ${ITA25} (limb (d) "crypto-asset" added by the Finance Act, 2025)`,
    },
    text: "USDC is a Virtual Digital Asset (VDA) under Indian income-tax law. Its peg to the US dollar does not take it out of the definition.",
  },
  BUY_NOT_TAXABLE: {
    id: "BUY_NOT_TAXABLE",
    sources: ["section-115bbh", "official-vda-page"],
    cite: { ITA_1961: `s.115BBH, ${ITA61}`, ITA_2025: RATE_2025 },
    text: "Buying USDC with INR is not taxable. The INR price you paid for the USDC becomes your cost of acquisition. The platform fee charged on top is not part of that cost.",
  },
  SALE_TAXABLE: {
    id: "SALE_TAXABLE",
    sources: ["section-115bbh", "official-vda-page"],
    cite: {
      ITA_1961: `s.115BBH read with s.2(47), ${ITA61}`,
      ITA_2025: `s.2(109) and s.194(2)(n), ${ITA25}; rate: s.194(1), Table Sl. No. 4`,
    },
    text: 'Selling USDC for INR is a "transfer of VDA". The income (sale price minus cost) is taxable.',
  },
  PAY_IS_TRANSFER: {
    id: "PAY_IS_TRANSFER",
    sources: ["official-vda-page", "section-115bbh"],
    cite: {
      ITA_1961: `s.115BBH read with s.2(47), ${ITA61}`,
      ITA_2025: `s.2(109) and s.194(2)(n), ${ITA25}`,
    },
    text: 'Paying a UPI merchant with USDC ("Pay") is an exchange, so it is also a transfer of VDA. The INR paid to the merchant is the sale consideration.',
  },
  RATE_30: {
    id: "RATE_30",
    sources: ["section-115bbh", "official-vda-page", "taxguru-2025"],
    cite: { ITA_1961: `s.115BBH(1), ${ITA61}`, ITA_2025: RATE_2025 },
    text: "Income from transfer of VDA is taxed at a flat 30%, whatever your income slab.",
  },
  COST_ONLY: {
    id: "COST_ONLY",
    sources: ["section-115bbh", "official-vda-page"],
    cite: { ITA_1961: `s.115BBH(2)(a), ${ITA61}`, ITA_2025: RATE_2025 },
    text: "The only deduction allowed is the cost of acquisition of the USDC sold.",
  },
  FEES_NOT_DEDUCTIBLE: {
    id: "FEES_NOT_DEDUCTIBLE",
    sources: ["section-115bbh", "official-vda-page"],
    cite: { ITA_1961: `s.115BBH(2)(a), ${ITA61}`, ITA_2025: RATE_2025 },
    text: "Only the cost of acquisition is deductible. The INR platform fee you pay when buying is a charge for the service, not the price of the USDC, so it is kept out of cost. The USDC fee and tips paid when selling are not deducted either.",
  },
  LOSS_IGNORED: {
    id: "LOSS_IGNORED",
    sources: ["section-115bbh", "official-vda-page"],
    cite: {
      ITA_1961: `s.115BBH(1) and (2)(b), ${ITA61}`,
      ITA_2025: RATE_2025,
    },
    text: "Income is worked out for each sale: what you received less the cost of all the USDC sold in it. A sale at a loss is taken at nil. The loss cannot be set off against other sales, other VDA gains or any other income, and cannot be carried forward. Schedule VDA asks for nil income on a loss.",
  },
  NO_EXEMPTION: {
    id: "NO_EXEMPTION",
    sources: ["section-115bbh", "official-vda-page"],
    cite: { ITA_1961: `s.115BBH, ${ITA61}`, ITA_2025: RATE_2025 },
    text: "No basic exemption limit, no section 87A rebate and no Chapter VI-A deductions can be used against VDA income.",
  },
  SURCHARGE: {
    id: "SURCHARGE",
    sources: ["egazette", "official-vda-page"],
    cite: {
      ITA_1961: `Finance Act for the year; 25% cap under the new regime: s.115BAC, ${ITA61}`,
      ITA_2025: `s.202, ${ITA25}, read with the Finance Act, 2026`,
    },
    text: "Surcharge on the 30% tax by total income: above ₹50 lakh 10%, above ₹1 crore 15%, above ₹2 crore 25%, above ₹5 crore 37% (old regime only; the new regime is capped at 25%). The 15% cap for capital gains does not apply to VDA income. Marginal relief is not computed here.",
  },
  CESS: {
    id: "CESS",
    sources: ["egazette", "official-vda-page"],
    cite: {
      ITA_1961: "Health and Education Cess, Finance Act",
      ITA_2025: "Health and Education Cess, Finance Act",
    },
    text: "Health and Education Cess is 4% of (tax plus surcharge). With no surcharge the effective rate is 31.2%.",
  },
  TOTAL_TAX: {
    id: "TOTAL_TAX",
    sources: ["section-115bbh", "egazette"],
    cite: {
      ITA_1961: `s.115BBH, ${ITA61}, and the Finance Act`,
      ITA_2025: `${RATE_2025}, and the Finance Act`,
    },
    text: "Total tax is the tax at 30% plus surcharge plus cess.",
  },
  TDS_SELLER: {
    id: "TDS_SELLER",
    sources: ["circular-13", "circular-14", "tds-vda-official"],
    cite: {
      ITA_1961: `s.194S(1) and (3), ${ITA61}`,
      ITA_2025: `s.393(1), Table Sl. No. 8(vi) and s.393(4), ${ITA25}`,
    },
    text: "The buyer of your USDC (the person paying INR) must deduct 1% TDS. The limit applies to each buyer separately: ₹10,000 a year, or ₹50,000 if that buyer is a specified person. Once one buyer's total crosses the limit, TDS is due on everything that buyer paid you that year. P2P.me buyers usually do not deduct it. If a buyer fails to deduct, the buyer is in default, not you.",
  },
  TDS_CREDIT: {
    id: "TDS_CREDIT",
    sources: ["circular-13", "efiling-portal"],
    cite: {
      ITA_1961: `s.194S read with s.199, ${ITA61}`,
      ITA_2025: `s.393(1), Table Sl. No. 8(vi), ${ITA25}; credit: corresponding provision for credit of tax deducted`,
    },
    text: "You can claim TDS as credit only if it appears in your Form 26AS / AIS. That depends on the buyer depositing it and filing the statement. Default is ₹0 unless you enter it.",
  },
  TDS_BUYER: {
    id: "TDS_BUYER",
    sources: ["circular-13", "circular-14", "tds-vda-official", "form-26qe"],
    cite: {
      ITA_1961: `s.194S, ${ITA61}; Form 26QE and Form 16E (Rules 30(2D) and 31A(4D)); default: s.201(1A) interest, s.271C penalty`,
      ITA_2025: `s.393(1), Table Sl. No. 8(vi) and s.393(4), ${ITA25}; Form 141 (Schedule D) and Form 132 (Rules 218 and 219, Income-tax Rules, 2026); default: s.398(3) interest, s.448 penalty`,
    },
    text: `Advisory, not a calculated liability. When you buy USDC from a person, you are the payer. If your purchases from one seller cross the limit in a year (₹50,000 if you are a specified person, else ₹10,000), deduct 1% on everything paid to that seller. Deposit it within 30 days from the end of the month: Form 26QE up to March 2026, Form 141 (Schedule D) from April 2026. Give the seller Form 16E, or Form 132 from April 2026. ${SPECIFIED_PERSON_TEST} If you are not one, you need a TAN and use Form 26Q (Form 140 from April 2026).`,
  },
  SCHEDULE_VDA: {
    id: "SCHEDULE_VDA",
    sources: ["efiling-portal"],
    cite: {
      ITA_1961: "Schedule VDA and Schedule SI, ITR-2 / ITR-3",
      ITA_2025: `Schedule VDA and Schedule SI, ITR-2 / ITR-3 under the ${ITA25}`,
    },
    text: "Every transfer is reported in Schedule VDA, one row per purchase lot: date of acquisition, date of transfer, head of income, cost of acquisition, consideration received and income. Each sale's income (nil on a loss) is shared across its rows by quantity, so the rows add up to that sale's income. The total goes to Schedule SI at 30%. Use ITR-2, or ITR-3 if you trade as a business.",
  },
  ADVANCE_TAX: {
    id: "ADVANCE_TAX",
    sources: ["efiling-portal"],
    cite: {
      ITA_1961: `ss.208, 211, 234B and 234C, ${ITA61}`,
      ITA_2025: `ss.403 to 408 (liability, threshold, instalments), s.424 (interest for default) and s.425 (interest for deferment), ${ITA25}`,
    },
    text: "If tax payable after TDS is ₹10,000 or more, pay advance tax: 15% by 15 June, 45% by 15 September, 75% by 15 December, 100% by 15 March. Under capital gains, tax on gains that arise after an instalment date can be paid with the next instalment, or by 31 March, without interest, so each instalment is worked out on gains made up to that date. Under business income that relief does not apply: the instalments are on the estimated tax for the whole year.",
  },
  FINANCIAL_YEAR: {
    id: "FINANCIAL_YEAR",
    sources: ["taxguru-2025", "taxscan-2025"],
    cite: {
      ITA_1961: `s.3 (previous year), ${ITA61}`,
      ITA_2025: `s.3 (tax year), ${ITA25}`,
    },
    text: "The year runs from 1 April 00:00 IST to 31 March 23:59:59 IST. Every order time is converted to India time before assigning it to a year. Transfers up to 31 March 2026 fall under the 1961 Act, and from 1 April 2026 under the 2025 Act.",
  },
  GST: {
    id: "GST",
    sources: ["official-vda-page"],
    cite: { ITA_1961: "Outside income-tax", ITA_2025: "Outside income-tax" },
    text: "No GST is charged on your own USDC buy/sell, and GST is never part of these income-tax figures.",
  },
  COST_METHOD: {
    id: "COST_METHOD",
    sources: ["section-115bbh"],
    cite: { ITA_1961: `s.115BBH(2)(a), ${ITA61}`, ITA_2025: RATE_2025 },
    text: "The cost of USDC sold is matched from your purchases by the method you choose: FIFO (oldest first, the default), LIFO (newest first), specific identification (you pick the purchase each sale came from) or weighted average. No method is prescribed for VDAs, and the choice changes the answer. Once adopted, the method must be followed in all later years and across all your wallets.",
  },
  OVERSELL: {
    id: "OVERSELL",
    sources: ["section-115bbh", "official-vda-page"],
    cite: { ITA_1961: `s.115BBH(2)(a), ${ITA61}`, ITA_2025: RATE_2025 },
    text: "You sold more USDC than this app can see you bought. Tell us how the rest came in so its cost can be used.",
  },
  NET_PAYABLE: {
    id: "NET_PAYABLE",
    sources: ["section-115bbh", "circular-13", "efiling-portal"],
    cite: {
      ITA_1961: `s.115BBH and s.194S, ${ITA61}`,
      ITA_2025: `s.194 and s.393(1), ${ITA25}`,
    },
    text: "Net payable is total tax minus TDS credit. If negative, a refund is expected.",
  },
  RECEIPT_COST: {
    id: "RECEIPT_COST",
    sources: ["official-vda-page", "section-115bbh"],
    cite: {
      ITA_1961: `s.115BBH(2)(a); gifts: s.56(2)(x), s.49(1), s.49(4), ${ITA61}`,
      ITA_2025: `${RATE_2025}; gifts: s.92(2)(m)`,
    },
    text: "The cost of USDC that came from outside P2P.me depends on how it came in. Bought on an exchange: the INR you paid. Moved from your own wallet: its original cost. Salary or reward: its INR value when received. Gift from a relative: what the giver paid. Gift from a non-relative: its value when received if all your gifts from non-relatives in the year (money and property, not only USDC) exceed ₹50,000; otherwise what the giver paid, or nil if that is not known.",
  },
  RECEIPT_INCOME: {
    id: "RECEIPT_INCOME",
    sources: ["official-vda-page", "efiling-portal"],
    cite: {
      ITA_1961: `salary or business income; other sources incl. s.56(2)(x), ${ITA61}`,
      ITA_2025: `salary or business income; other sources incl. s.92(2)(m), ${ITA25}`,
    },
    text: "USDC received as salary, a freelance or business payment, a reward or airdrop, or a gift from non-relatives above ₹50,000 in the year, is income when received, at its INR value. It is taxed at your slab rate, not at 30%, and is reported outside Schedule VDA. This app does not compute that tax: add the figure to your other income in your return. It counts towards the surcharge slab here.",
  },
  DELIVERED_ELSEWHERE: {
    id: "DELIVERED_ELSEWHERE",
    sources: ["official-vda-page", "section-115bbh"],
    cite: {
      ITA_1961: `s.2(47) and s.115BBH, ${ITA61}`,
      ITA_2025: `s.2(109) and s.194(2)(n), ${ITA25}`,
    },
    text: "When a purchase is delivered straight to another wallet, that USDC is not available to cost sales from this wallet. If the other wallet is yours, add it so all your wallets are computed together. If it belongs to someone else, the purchase was followed by a transfer to them (a gift or a sale paid off-chain), which may itself be taxable.",
  },
  NON_INR: {
    id: "NON_INR",
    sources: ["official-vda-page", "section-115bbh"],
    cite: { ITA_1961: `s.115BBH, ${ITA61}`, ITA_2025: RATE_2025 },
    text: "A resident of India selling USDC for another currency is still taxable in India, at the INR value on the date of transfer. These orders are not converted here; work them out with your Chartered Accountant.",
  },
  ONCHAIN_CHECK: {
    id: "ONCHAIN_CHECK",
    sources: ["official-vda-page", "section-115bbh"],
    cite: {
      ITA_1961: `s.2(47) and s.115BBH, ${ITA61}`,
      ITA_2025: `s.2(109) and s.194(2)(n), ${ITA25}`,
    },
    text: "Your tax depends on every movement of USDC, not only the orders on P2P.me. USDC sent out of your wallet to someone else is a transfer that may be taxable. USDC that came in from outside needs a cost. Moves between your own wallets are neither.",
  },
  TRANSFER_OUT: {
    id: "TRANSFER_OUT",
    sources: ["official-vda-page", "section-115bbh"],
    cite: {
      ITA_1961: `s.2(47) and s.115BBH; gifts received: s.56(2)(x), ${ITA61}`,
      ITA_2025: `s.2(109), s.194(2)(n) and ${RATE_2025}; gifts received: s.92(2)(m)`,
    },
    text: "USDC sold, or used to pay for goods or services, outside P2P.me is a transfer of VDA, taxed at 30% on the INR value received less its cost, just like a sale here. USDC given away brings the giver no consideration, so there is no income for the giver; the receiver may be taxed on it. Moving USDC to your own wallet or exchange account is not a transfer, but a later sale there is, and must be reported separately.",
  },
  TOKEN_SWAP: {
    id: "TOKEN_SWAP",
    sources: ["circular-13", "official-vda-page"],
    cite: {
      ITA_1961: `s.2(47) and s.115BBH; CBDT Circular No. 13 of 2022, Question 2, ${ITA61}`,
      ITA_2025: `s.2(109) and ${RATE_2025}; CBDT Circular No. 13 of 2022, Question 2`,
    },
    text: "Swapping another token for USDC is a transfer of that token, taxed at 30% on the INR value of the USDC received less the token's cost. This app does not compute tax on other tokens: work it out with your Chartered Accountant. The USDC received is acquired at its INR value on that date, which is its cost here.",
  },
};
