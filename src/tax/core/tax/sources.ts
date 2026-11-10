/**
 * Legal sources behind every rule in rules.ts. Shown on /sources and linked
 * from each rule tooltip.
 *
 * Link check (Nov 2026): all URLs below open in a browser. The two
 * incometaxindia.gov.in pages block automated clients (HTTP 403) but load
 * normally for people. Circulars 13/2022 and 14/2022 link to the CBDT
 * originals. Two caalley.com PDF mirrors returned 404 and were left out.
 */

export type SourceCategory = "official" | "cbdt" | "ita-2025" | "filing";

export interface Source {
  id: string;
  title: string;
  description: string;
  url: string;
  category: SourceCategory;
  isOfficial: boolean;
}

export const SOURCE_CATEGORIES: readonly {
  id: SourceCategory;
  title: string;
}[] = [
  { id: "official", title: "Official (Government of India)" },
  { id: "cbdt", title: "CBDT Circulars & Notifications" },
  { id: "ita-2025", title: "Income-tax Act, 2025 (from 1 April 2026)" },
  { id: "filing", title: "File & Check" },
];

export const SOURCES = [
  // 1. Official (Government of India)
  {
    id: "official-vda-page",
    title: "Taxation of Virtual Digital Assets (Income Tax Department)",
    description:
      "The department's guide to how VDAs (crypto, including USDC) are taxed.",
    url: "https://incometaxindia.gov.in/w/taxation-of-virtual-digital-asset-vda-",
    category: "official",
    isOfficial: true,
  },
  {
    id: "section-115bbh",
    title: "Section 115BBH: 30% tax on VDA income",
    description:
      "Flat 30% rate, only cost of acquisition deductible, no set-off or carry-forward of losses.",
    url: "https://www.incometaxindia.gov.in/w/section-115bbh",
    category: "official",
    isOfficial: true,
  },

  // 2. CBDT Circulars & Notifications
  {
    id: "circular-13",
    title: "Circular No. 13/2022: Guidelines on TDS u/s 194S",
    description:
      "CBDT original. Who deducts 1% TDS on VDA transfers, thresholds, and how it works on P2P trades (Question 6 on aggregates).",
    url: "https://www.incometaxindia.gov.in/w/circular-no.-13/2022-guidelines-for-removal-of-difficulties-under-sub-section-6-of-section-194s-of-the-income-tax-act-1961",
    category: "cbdt",
    isOfficial: true,
  },
  {
    id: "circular-14",
    title: "Circular No. 14/2022: TDS u/s 194S outside exchanges",
    description:
      "CBDT original. Order under section 119 on TDS for transactions not on or through an exchange.",
    url: "https://www.incometaxindia.gov.in/w/circular-no.-14/2022-order-under-section-119-of-the-income-tax-act-1961-the-act-in-relation-to-tax-deduction-at-source-under-section-194s-of-the-act-for-transactions-other-than-those-taking-place-on-or-through-an-exchange",
    category: "cbdt",
    isOfficial: true,
  },
  {
    id: "tds-vda-official",
    title: "TDS on payment for the transfer of VDAs (Income Tax Department)",
    description:
      "The department's guide to TDS on VDA transfers, including the deposit forms.",
    url: "https://www.incometaxindia.gov.in/w/tds-on-payment-for-the-transfer-of-virtual-digital-assets-vdas-",
    category: "cbdt",
    isOfficial: true,
  },
  {
    id: "circular-13-summary",
    title: "Circular No. 13/2022: Summary",
    description: "Plain-language summary of the 194S guidelines.",
    url: "https://taxguru.in/income-tax/guidelines-section-194s-tds-payment-virtual-digital-asset.html",
    category: "cbdt",
    isOfficial: false,
  },
  {
    id: "notification-67",
    title: "Notification No. 67/2022: Items excluded from VDA",
    description:
      "Digital assets that are NOT treated as VDA (e.g. gift cards, mileage points).",
    url: "https://taxguru.in/income-tax/exclusion-digital-assets-definition-virtual-digital-asset.html",
    category: "cbdt",
    isOfficial: false,
  },
  {
    id: "rules-19th-amendment",
    title: "Income-tax (19th Amendment) Rules, 2022: Form 26QE & 16E",
    description:
      "Introduces Form 26QE (deposit TDS within 30 days of month end) and Form 16E (TDS certificate).",
    url: "https://taxguru.in/income-tax/income-tax-19th-amendment-rules-2022.html",
    category: "cbdt",
    isOfficial: false,
  },
  {
    id: "form-26qe",
    title: "Form 26QE explained",
    description: "How the buyer pays VDA TDS with the challan-cum-statement.",
    url: "https://www.taxmann.com/post/blog/cbdt-notifies-challan-cum-statement-form-26qe-for-payment-of-tax-deducted-on-vdas/",
    category: "cbdt",
    isOfficial: false,
  },

  // 3. Income-tax Act, 2025 (from 1 April 2026)
  {
    id: "taxguru-2025",
    title: "VDAs under Income-tax Act, 2025 (TaxGuru)",
    description:
      "How VDA taxation carries over to the new Act from 1 April 2026.",
    url: "https://taxguru.in/income-tax/broader-scope-virtual-digital-assets-indias-income-tax-act-2025.html",
    category: "ita-2025",
    isOfficial: false,
  },
  {
    id: "taxscan-2025",
    title: "VDAs under Income-tax Act, 2025 (Taxscan)",
    description: "Complete guide to taxation and compliance under the new Act.",
    url: "https://www.taxscan.in/top-stories/vdas-under-income-tax-act-2025-complete-guide-to-taxation-and-compliance-download-pdf-1449367",
    category: "ita-2025",
    isOfficial: false,
  },

  // 4. File & Check
  {
    id: "efiling-portal",
    title: "Income Tax e-Filing portal",
    description:
      "File your ITR (Schedule VDA), pay via Form 26QE, check Form 26AS / AIS.",
    url: "https://www.incometax.gov.in",
    category: "filing",
    isOfficial: true,
  },
  {
    id: "egazette",
    title: "Gazette of India",
    description: "Official text of Acts, Finance Acts and notifications.",
    url: "https://egazette.gov.in",
    category: "filing",
    isOfficial: true,
  },
] as const satisfies readonly Source[];

export type SourceId = (typeof SOURCES)[number]["id"];

const BY_ID = new Map<string, Source>(SOURCES.map((s) => [s.id, s]));

export function getSource(id: SourceId): Source {
  const source = BY_ID.get(id);
  if (!source) throw new Error(`Unknown source id: ${id}`);
  return source;
}

export function isSourceId(id: string): id is SourceId {
  return BY_ID.has(id);
}
