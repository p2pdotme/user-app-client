import { fireEvent, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { buy, sell } from "@tests/tax/helpers/factories";
import { renderReport } from "@tests/tax/helpers/render";
import { ResultAsync } from "neverthrow";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { RawOrder } from "@/tax/core/types";
import { Report } from "@/tax/pages/report";

const fetchMock = vi.hoisted(() =>
  vi.fn<(address: string) => Promise<RawOrder[]>>(),
);
vi.mock("@/tax/core/subgraph/client", async (orig) => {
  const actual = await orig<typeof import("@/tax/core/subgraph/client")>();
  return {
    ...actual,
    fetchAllOrders: (address: string) =>
      ResultAsync.fromPromise(fetchMock(address), (cause) => ({
        domain: "Subgraph" as const,
        code: "SGNetworkError" as const,
        message: "mock failure",
        cause,
      })),
  };
});

/** 30 buys + 1 big sale → paginated orders, advance tax and TDS thresholds crossed */
const bigHistory = (): RawOrder[] => [
  ...Array.from({ length: 30 }, (_, i) =>
    buy(`2026-04-${String(i + 1).padStart(2, "0")}T10:00`, 100, 9_000),
  ),
  sell("2026-05-10T10:00", 3000, 3_30_000),
];

async function open(tab?: string) {
  const user = userEvent.setup();
  renderReport(<Report />);
  await user.type(
    screen.getByLabelText("Wallet address"),
    `0x${"cd".repeat(20)}`,
  );
  await user.click(screen.getByRole("button", { name: "Generate report" }));
  await screen.findByTestId("headline-value");
  if (tab)
    await user.click(screen.getByRole("tab", { name: new RegExp(`^${tab}`) }));
  return user;
}

const detailRow = (label: string): HTMLElement =>
  screen.getByText(label, { selector: "dt" }).parentElement as HTMLElement;

beforeEach(() => {
  fetchMock.mockReset();
  fetchMock.mockResolvedValue(bigHistory());
});

describe("orders tab", () => {
  it("shows a paginated, sortable, searchable table", async () => {
    const user = await open("Orders");
    const table = screen.getByRole("table", { name: "Orders" });
    expect(screen.getByText("31 orders")).toBeInTheDocument();
    expect(within(table).getAllByTestId("order-row")).toHaveLength(20);
    expect(
      screen.getByText("Showing 1 to 20 of 31 orders"),
    ).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /Next/ }));
    expect(screen.getByText("Page 2 of 2")).toBeInTheDocument();
    expect(within(table).getAllByTestId("order-row")).toHaveLength(11);

    // sorting by a column header returns to page 1, largest gain first
    await user.click(
      screen.getByRole("button", { name: "Sort by Gain / loss" }),
    );
    expect(screen.getByText("Page 1 of 2")).toBeInTheDocument();
    const first = within(table).getAllByTestId("order-row")[0];
    expect(first).toHaveAttribute("data-kind", "SELL");
    expect(first).toHaveTextContent("+₹60,000.00");
    expect(
      within(first).getByRole("link", { name: /View on Basescan/ }),
    ).toHaveAttribute(
      "href",
      expect.stringMatching(/^https:\/\/basescan\.org\/tx\/0x/),
    );
    expect(
      screen.getByRole("columnheader", { name: /Gain \/ loss/ }),
    ).toHaveAttribute("aria-sort", "descending");

    await user.type(
      screen.getByLabelText("Search by order ID, type or tx hash"),
      "sell",
    );
    expect(screen.getByText("1 orders")).toBeInTheDocument();
    expect(screen.queryByText(/Page \d of/)).not.toBeInTheDocument();
  });
});

describe("advance tax tab", () => {
  it("lists the four instalments when net payable ≥ ₹10,000", async () => {
    await open("Advance tax");
    // gain 3,30,000 − 2,70,000 = 60,000 → total tax 18,720
    expect(screen.getByText(/Net payable is ₹18,720.00/)).toBeInTheDocument();
    expect(screen.getByText("15/06/2026")).toBeInTheDocument();
    expect(screen.getByText("15/03/2027")).toBeInTheDocument();
  });
});

describe("TDS tab", () => {
  it("shows seller TDS (a ceiling when buyers are unknown) and the buyer advisory with Form 141", async () => {
    await open("TDS");
    // one sale of ₹3,30,000 from an unknown buyer: 1% = ₹3,300, labelled a ceiling
    expect(
      detailRow("TDS buyers should have deducted (ceiling)"),
    ).toHaveTextContent("₹3,300.00");
    expect(
      screen.getByText(/grouped together. That makes this figure a ceiling/),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Advisory, not a calculated liability/),
    ).toBeInTheDocument();
    // 30 buys of ₹9,000 in April 2026 (user is a specified person, ₹50,000):
    // crossing at ₹54,000 → ₹540, then ₹90 × 24 → ₹2,700 deducted in April
    const buyer = screen.getByRole("table", { name: "TDS on your purchases" });
    expect(within(buyer).getByText("30/05/2026")).toBeInTheDocument();
    expect(
      within(buyer).getByText("Form 141 (Schedule D)"),
    ).toBeInTheDocument();
    expect(within(buyer).getByText("Form 132")).toBeInTheDocument();
    expect(within(buyer).getAllByText("₹2,700.00").length).toBeGreaterThan(0);
  });
});

describe("rule tooltips", () => {
  it("shows rule text with the 2025 Act citation for FY 2026-27", async () => {
    const user = await open();
    const row = detailRow("Tax (30%)");
    await user.click(
      within(row).getByRole("button", { name: "How this is calculated" }),
    );
    const tip = await screen.findByRole("tooltip");
    expect(tip).toHaveTextContent("flat 30%");
    expect(tip).toHaveTextContent(
      "s.194(1), Table Sl. No. 4, Income-tax Act, 2025",
    );
    const source = within(tip).getByRole("link", {
      name: /Source → Section 115BBH/,
    });
    expect(source).toHaveAttribute(
      "href",
      "https://www.incometaxindia.gov.in/w/section-115bbh",
    );
    expect(source).toHaveAttribute("target", "_blank");
    expect(
      within(tip).getByRole("link", { name: /All legal sources/ }),
    ).toHaveAttribute("href", "/tax/sources");
    fireEvent.keyDown(tip, { key: "Escape" });
    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
  });

  it("cites the 1961 Act for FY 2025-26", async () => {
    fetchMock.mockResolvedValue([
      buy("2025-06-01T10:00", 500, 44_500),
      sell("2025-09-05T10:00", 500, 46_000),
    ]);
    const user = userEvent.setup();
    renderReport(<Report />);
    await user.click(screen.getByRole("combobox", { name: "Financial year" }));
    await user.click(await screen.findByRole("option", { name: "FY 2025-26" }));
    await user.type(
      screen.getByLabelText("Wallet address"),
      `0x${"cd".repeat(20)}`,
    );
    await user.click(screen.getByRole("button", { name: "Generate report" }));
    await screen.findByTestId("headline-value");
    await user.click(
      within(detailRow("Tax (30%)")).getByRole("button", {
        name: "How this is calculated",
      }),
    );
    expect(await screen.findByRole("tooltip")).toHaveTextContent(
      "s.115BBH(1), Income-tax Act, 1961",
    );
  });
});

describe("settings drawer", () => {
  it("adding outside USDC in the tax profile clears the required step", async () => {
    fetchMock.mockResolvedValue([sell("2026-06-02T10:00", 100, 9_500)]);
    const user = userEvent.setup();
    renderReport(<Report />);
    await user.type(
      screen.getByLabelText("Wallet address"),
      `0x${"cd".repeat(20)}`,
    );
    await user.click(screen.getByRole("button", { name: "Generate report" }));
    await screen.findByText("Before we calculate your tax");

    await user.click(screen.getByRole("link", { name: "Tax profile" }));
    const drawer = await screen.findByRole("main", { name: "Tax profile" });
    await user.click(within(drawer).getByLabelText("Weighted average"));
    await user.click(within(drawer).getByLabelText("Old regime"));
    await user.click(
      within(drawer).getByRole("button", { name: /Add opening balance/ }),
    );
    await user.type(
      within(drawer).getByLabelText("Acquisition date"),
      "2025-01-01",
    );
    await user.type(within(drawer).getByLabelText("USDC quantity"), "1x");
    expect(within(drawer).getByText("Invalid value")).toBeInTheDocument();
    await user.clear(within(drawer).getByLabelText("USDC quantity"));
    await user.type(within(drawer).getByLabelText("USDC quantity"), "100");
    await user.type(within(drawer).getByLabelText("Total cost (₹)"), "8600");
    await user.click(screen.getByRole("button", { name: "Go back" }));

    expect(await screen.findByTestId("headline-value")).toBeInTheDocument();
    expect(detailRow("Taxable gains")).toHaveTextContent("₹900.00");
    expect(
      screen.queryByText("Before we calculate your tax"),
    ).not.toBeInTheDocument();
  });

  it("a small gift from a non-relative added in the tax profile has nil cost", async () => {
    fetchMock.mockResolvedValue([sell("2026-06-02T10:00", 100, 9_500)]);
    const user = userEvent.setup();
    renderReport(<Report />);
    await user.type(
      screen.getByLabelText("Wallet address"),
      `0x${"cd".repeat(20)}`,
    );
    await user.click(screen.getByRole("button", { name: "Generate report" }));
    await screen.findByText("Before we calculate your tax");

    await user.click(screen.getByRole("link", { name: "Tax profile" }));
    const drawer = await screen.findByRole("main", { name: "Tax profile" });
    await user.click(
      within(drawer).getByRole("button", { name: /Add external deposit/ }),
    );
    await user.click(
      within(drawer).getByRole("combobox", { name: "How it came in" }),
    );
    await user.click(
      await screen.findByRole("option", {
        name: "Gift from someone who is not a relative",
      }),
    );
    await user.type(
      within(drawer).getByLabelText("Acquisition date"),
      "2026-05-01",
    );
    await user.type(within(drawer).getByLabelText("USDC quantity"), "100");
    await user.type(
      within(drawer).getByLabelText("Total value when received (₹)"),
      "9700",
    );
    await user.click(screen.getByRole("button", { name: "Go back" }));
    // ₹9,700 is within ₹50,000: not taxed on receipt, nil cost
    expect(await screen.findByTestId("headline-value")).toBeInTheDocument();
    expect(detailRow("Taxable gains")).toHaveTextContent("₹9,500.00");
    expect(
      screen.queryByText("Income on receiving USDC"),
    ).not.toBeInTheDocument();
  });

  it("reports an invalid JSON import", async () => {
    const user = await open();
    await user.click(screen.getByRole("link", { name: "Tax profile" }));
    await screen.findByRole("main", { name: "Tax profile" });
    await user.upload(
      screen.getByTestId("import-json"),
      new File(["not json"], "x.json", { type: "application/json" }),
    );
    expect(
      await screen.findByText(/Could not import this file/),
    ).toBeInTheDocument();
  });
});

describe("sell and pay are shown as sales", () => {
  it("filters Sell & Pay together and styles Pay like Sell", async () => {
    fetchMock.mockResolvedValue([
      buy("2026-04-01T10:00", 300, 27_000),
      sell("2026-05-01T10:00", 100, 9_800),
      sell("2026-05-02T10:00", 50, 4_900, { type: 2 }),
    ]);
    const user = await open("Orders");
    expect(screen.getByText("3 orders")).toBeInTheDocument();

    await user.click(screen.getByRole("combobox", { name: "Filter by type" }));
    await user.click(await screen.findByRole("option", { name: "Sell & Pay" }));
    const rows = screen.getAllByTestId("order-row");
    expect(rows.map((r) => r.getAttribute("data-kind")).sort()).toEqual([
      "PAY",
      "SELL",
    ]);
    // same red "sale" badge for both
    for (const r of rows) {
      expect(r.querySelector(".text-red-600")).not.toBeNull();
    }
    // Pay carries the "taxed like a sale" rule
    const pay = rows.find((r) => r.getAttribute("data-kind") === "PAY");
    await user.click(
      within(pay as HTMLElement).getByRole("button", {
        name: "How this is calculated",
      }),
    );
    expect(await screen.findByRole("tooltip")).toHaveTextContent(
      "Taxed exactly like a Sell order.",
    );
  });
});

describe("Schedule VDA pagination", () => {
  it("pages on screen but keeps every sale in the DOM for printing", async () => {
    fetchMock.mockResolvedValue([
      buy("2026-04-01T10:00", 3000, 2_70_000),
      ...Array.from({ length: 25 }, (_, i) =>
        sell(`2026-05-${String(i + 1).padStart(2, "0")}T10:00`, 10, 950),
      ),
    ]);
    const user = await open("Schedule VDA");
    const table = screen.getByRole("table", { name: "Schedule VDA" });
    // 25 rows rendered (print), 5 hidden on screen
    const body = within(table)
      .getAllByRole("row")
      .filter((r) => r.closest("tbody"));
    expect(body).toHaveLength(25);
    expect(body.filter((r) => r.className.includes("hidden"))).toHaveLength(5);
    expect(screen.getByText("Showing 1 to 20 of 25 rows")).toBeInTheDocument();
    // total covers all sales, not just the page: 25 × (950 − 900) = 1,250
    expect(within(table).getByText("₹1,250.00")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /Next/ }));
    expect(screen.getByText("Showing 21 to 25 of 25 rows")).toBeInTheDocument();
  });
});
