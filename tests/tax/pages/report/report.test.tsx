import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { buy, sell } from "@tests/tax/helpers/factories";
import { renderReport, renderWithProviders } from "@tests/tax/helpers/render";
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

const ADDRESS = `0x${"ab".repeat(20)}`;

const workedExample = (): RawOrder[] => [
  buy("2026-06-01T10:00", 500, 44_500),
  buy("2026-07-10T10:00", 500, 45_500),
  sell("2026-09-05T10:00", 700, 65_100),
  sell("2026-12-20T10:00", 300, 27_000),
  { ...sell("2026-12-21T10:00", 5, 500), status: 4 },
];

async function generate(address = ADDRESS) {
  const user = userEvent.setup();
  renderReport(<Report />);
  const input = screen.getByLabelText("Wallet address");
  await user.clear(input);
  await user.type(input, address);
  await user.click(screen.getByRole("button", { name: "Generate report" }));
  return user;
}

const headline = async () => ({
  label: await screen.findByTestId("headline-label"),
  value: screen.getByTestId("headline-value"),
});

const detailRow = (label: string): HTMLElement =>
  screen.getByText(label, { selector: "dt" }).parentElement as HTMLElement;

beforeEach(() => {
  fetchMock.mockReset();
});

describe("report page", () => {
  it("shows the disclaimer and links to the legal sources", () => {
    renderReport(<Report />);
    expect(screen.getByRole("note")).toHaveTextContent(
      "This is an estimate, not tax advice",
    );
    expect(
      within(screen.getByRole("contentinfo")).getByRole("link", {
        name: /Legal sources/,
      }),
    ).toHaveAttribute("href", "/tax/sources");
  });

  it("opens on the connected wallet without asking for an address", async () => {
    fetchMock.mockResolvedValue(workedExample());
    renderWithProviders(
      <Report defaultWallet={ADDRESS.toUpperCase().replace("0X", "0x")} />,
    );
    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith(ADDRESS));
    expect(screen.getByLabelText("Wallet address")).toHaveValue(ADDRESS);
    expect((await headline()).value).toHaveTextContent("₹748.80");
  });

  it("shows the empty state before any address is entered", () => {
    renderReport(<Report />);
    expect(
      screen.getByText("Enter your wallet address to begin"),
    ).toBeInTheDocument();
  });

  it("rejects an invalid address without fetching", async () => {
    await generate("0x1234");
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Enter a valid wallet address",
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("renders the worked example for FY 2026-27", async () => {
    fetchMock.mockResolvedValue(workedExample());
    await generate(ADDRESS.toUpperCase().replace("0X", "0x"));
    expect(fetchMock).toHaveBeenCalledWith(ADDRESS);

    const h = await headline();
    expect(h.label).toHaveTextContent("Net payable");
    expect(h.value).toHaveTextContent("₹748.80");
    // besides the disclaimer, the report itself names the Act it applied
    expect(screen.getAllByText(/Income-tax Act, 2025/).length).toBeGreaterThan(
      1,
    );

    expect(detailRow("Taxable gains")).toHaveTextContent("₹2,400.00");
    expect(detailRow("Ignored losses")).toHaveTextContent("₹300.00");
    expect(detailRow("Tax (30%)")).toHaveTextContent("₹720.00");
    expect(detailRow("Cess (4%)")).toHaveTextContent("₹28.80");
    expect(detailRow("Total tax")).toHaveTextContent("₹748.80");
  });

  it("lists one Schedule VDA row per sale and leaves cancelled orders out", async () => {
    fetchMock.mockResolvedValue(workedExample());
    const user = await generate();
    await user.click(await screen.findByRole("tab", { name: "Schedule VDA" }));
    const table = screen.getByRole("table", { name: "Schedule VDA" });
    // lot-wise: 700 sold = 500 (1 Jun lot) + 200 (10 Jul lot); 300 sold = 1 row
    expect(within(table).getAllByTestId("vda-row")).toHaveLength(3);
    expect(within(table).getByText("₹44,500.00")).toBeInTheDocument();
    expect(within(table).getByText("₹18,200.00")).toBeInTheDocument();
    // loss row: income nil, loss only as a memo
    expect(within(table).getByText("₹300.00")).toBeInTheDocument();
    expect(within(table).queryByText("−₹300.00")).not.toBeInTheDocument();
    expect(screen.getByTestId("schedule-si")).toHaveTextContent("₹2,400.00");
    expect(screen.getByText("Showing 1 to 3 of 3 rows")).toBeInTheDocument();
    expect(
      screen.getByRole("table", { name: "Quarter-wise accrual" }),
    ).toBeInTheDocument();
    // the cancelled sale in the fixture is neither a row nor a tab
    expect(
      screen.queryByRole("tab", { name: /Excluded/ }),
    ).not.toBeInTheDocument();
    expect(within(table).queryByText("₹500.00")).not.toBeInTheDocument();
  });

  it("shows the error state with retry when the subgraph is down", async () => {
    fetchMock.mockRejectedValue(new Error("down"));
    const user = await generate();
    expect(
      await screen.findByText(
        "Could not load your orders",
        {},
        { timeout: 4000 },
      ),
    ).toBeInTheDocument();
    fetchMock.mockResolvedValue(workedExample());
    await user.click(screen.getByRole("button", { name: "Retry" }));
    expect(await screen.findByTestId("headline-value")).toHaveTextContent(
      "₹748.80",
    );
  });

  it("shows the no-orders state", async () => {
    fetchMock.mockResolvedValue([]);
    await generate();
    expect(
      await screen.findByText("No orders found for this address"),
    ).toBeInTheDocument();
  });

  it("applies TDS entered in the tax profile and shows a refund", async () => {
    fetchMock.mockResolvedValue(workedExample());
    const user = await generate();
    await headline();
    await user.click(screen.getByRole("link", { name: "Tax profile" }));
    const drawer = await screen.findByRole("main", { name: "Tax profile" });
    await user.click(
      within(drawer).getByRole("button", { name: /Add TDS entry/ }),
    );
    await user.type(within(drawer).getByLabelText("Date"), "2026-09-05");
    await user.type(within(drawer).getByLabelText("Amount (₹)"), "921");
    await user.click(screen.getByRole("button", { name: "Go back" }));
    const h = await headline();
    expect(h.label).toHaveTextContent("Refund expected");
    expect(h.value).toHaveTextContent("₹172.20");
  });
});

describe("SWAN re-check: wallet sets and cost methods", () => {
  const OTHER_ADDRESS = `0x${"cd".repeat(20)}`;

  it("a deposit entered for one wallet is not applied to another wallet", async () => {
    fetchMock.mockResolvedValue([
      buy("2026-05-01T10:00", 50, 4_500),
      sell("2026-06-02T10:00", 150, 14_250),
    ]);
    const user = await generate();
    await screen.findByText("Before we calculate your tax");
    await user.type(screen.getByLabelText("Price you paid per USDC (₹)"), "86");
    await user.click(
      screen.getByRole("button", { name: /Show my tax report/ }),
    );
    await headline();

    // another person's wallet: asked again, nothing carried over
    const input = screen.getByLabelText("Wallet address");
    await user.clear(input);
    await user.type(input, OTHER_ADDRESS);
    await user.click(screen.getByRole("button", { name: "Generate report" }));
    expect(
      await screen.findByText("Before we calculate your tax"),
    ).toBeInTheDocument();
    expect(screen.getByTestId("missing-usdc")).toHaveTextContent(
      "100.000000 USDC",
    );
    expect(
      await screen.findByText("Your entries were kept for the other wallet"),
    ).toBeInTheDocument();
  });

  it("offers four cost methods and, for specific identification, a picker per sale", async () => {
    fetchMock.mockResolvedValue(workedExample());
    const user = await generate();
    await headline();
    await user.click(await screen.findByRole("tab", { name: "Schedule VDA" }));
    await user.click(screen.getByRole("link", { name: "Tax profile" }));
    const drawer = await screen.findByRole("main", { name: "Tax profile" });
    for (const name of [
      /^FIFO/,
      /^LIFO/,
      /^Specific identification/,
      /^Weighted average/,
    ]) {
      expect(within(drawer).getByLabelText(name)).toBeInTheDocument();
    }
    expect(within(drawer).getByTestId("method-disclosure")).toHaveTextContent(
      "you must follow it in all later years and for all your wallets",
    );
    await user.click(within(drawer).getByLabelText(/^Specific identification/));
    await user.click(screen.getByRole("button", { name: "Go back" }));
    // back on the report, the Schedule VDA tab is still open and has updated
    expect(
      await screen.findByText("Which purchase did each sale use?"),
    ).toBeInTheDocument();
    expect(screen.getAllByTestId("specific-sale").length).toBeGreaterThan(0);
    expect(screen.getByTestId("vda-method")).toHaveTextContent(
      "Specific identification",
    );
  });
});

describe("required step: cost of USDC from outside P2P.me", () => {
  const outsideOnly = () => [
    buy("2026-05-01T10:00", 50, 4_500),
    sell("2026-06-02T10:00", 150, 14_250),
  ];

  it("hides the tax report and asks first", async () => {
    fetchMock.mockResolvedValue(outsideOnly());
    await generate();
    expect(
      await screen.findByText("Before we calculate your tax"),
    ).toBeInTheDocument();
    expect(screen.getByTestId("missing-usdc")).toHaveTextContent(
      "100.000000 USDC",
    );
    expect(screen.queryByTestId("headline-value")).not.toBeInTheDocument();
    expect(screen.queryByRole("tab")).not.toBeInTheDocument();
    expect(
      screen.getByText(/your average P2P.me buy price is ₹90.00/),
    ).toBeInTheDocument();
  });

  it("uses the price the user enters as the cost", async () => {
    fetchMock.mockResolvedValue(outsideOnly());
    const user = await generate();
    await screen.findByText("Before we calculate your tax");
    await user.click(
      screen.getByRole("button", { name: /Show my tax report/ }),
    );
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Enter the price you paid per USDC",
    );
    await user.type(screen.getByLabelText("Price you paid per USDC (₹)"), "86");
    expect(screen.getByText("₹8,600.00")).toBeInTheDocument();
    await user.click(
      screen.getByRole("button", { name: /Show my tax report/ }),
    );

    await headline();
    // 14,250 − (50 × 90 + 100 × 86) = 14,250 − 13,100 = 1,150
    expect(detailRow("Taxable gains")).toHaveTextContent("₹1,150.00");
    expect(
      screen.queryByText("Before we calculate your tax"),
    ).not.toBeInTheDocument();
  });

  const chooseNonRelativeGift = async (
    user: Awaited<ReturnType<typeof generate>>,
  ) => {
    await screen.findByText("Before we calculate your tax");
    await user.click(screen.getByRole("combobox", { name: "How it came in" }));
    await user.click(
      await screen.findByRole("option", {
        name: "Gift from someone who is not a relative",
      }),
    );
    expect(
      screen.getByText(
        /If all your gifts from non-relatives in the year \(money and property/,
      ),
    ).toBeInTheDocument();
    await user.type(
      screen.getByLabelText("Value per USDC when you received it (₹)"),
      "97",
    );
  };

  it("a small gift from a non-relative, giver's cost unknown: nil cost", async () => {
    fetchMock.mockResolvedValue(outsideOnly());
    const user = await generate();
    await chooseNonRelativeGift(user);
    await user.click(
      screen.getByRole("button", { name: /Show my tax report/ }),
    );
    await headline();
    // ₹9,700 of gifts is within ₹50,000, giver's cost not known → nil cost:
    // 14,250 − 4,500 = 9,750
    expect(detailRow("Taxable gains")).toHaveTextContent("₹9,750.00");
  });

  it("a small gift from a non-relative takes the giver's cost (s.49(1)(ii))", async () => {
    fetchMock.mockResolvedValue(outsideOnly());
    const user = await generate();
    await chooseNonRelativeGift(user);
    await user.type(
      screen.getByLabelText(/What the giver paid per USDC/),
      "90",
    );
    await user.click(
      screen.getByRole("button", { name: /Show my tax report/ }),
    );
    await headline();
    // cost = 100 × ₹90: 14,250 − 4,500 − 9,000 = 750
    expect(detailRow("Taxable gains")).toHaveTextContent("₹750.00");
  });

  it("other gifts in the year count towards ₹50,000: the gift is taxed on receipt", async () => {
    fetchMock.mockResolvedValue(outsideOnly());
    const user = await generate();
    await chooseNonRelativeGift(user);
    await user.type(
      screen.getByLabelText(/Other gifts from non-relatives/),
      "45000",
    );
    await user.click(
      screen.getByRole("button", { name: /Show my tax report/ }),
    );
    await headline();
    // 45,000 + 9,700 > 50,000 → taxed on receipt, cost = 9,700
    expect(detailRow("Taxable gains")).toHaveTextContent("₹50.00");
    expect(screen.getByTestId("receipt-income-note")).toHaveTextContent(
      "add it to your other income in your return",
    );
  });

  it("splits the USDC across several sources and shows income on receipt", async () => {
    fetchMock.mockResolvedValue(outsideOnly());
    const user = await generate();
    await screen.findByText("Before we calculate your tax");
    // first source: 60 USDC bought on an exchange at ₹90
    const qty = screen.getAllByLabelText("USDC amount")[0];
    await user.clear(qty);
    await user.type(qty, "60");
    await user.type(screen.getByLabelText("Price you paid per USDC (₹)"), "90");
    expect(screen.getByTestId("remaining-usdc")).toHaveTextContent(
      "Still to explain: 40.000000 USDC",
    );
    await user.click(
      screen.getByRole("button", { name: /Show my tax report/ }),
    );
    expect(
      screen.getByText(/Tell us how the remaining 40.000000 USDC came in/),
    ).toBeInTheDocument();

    // second source: 40 USDC as a reward worth ₹95 each
    await user.click(screen.getByRole("button", { name: /more than one way/ }));
    const types = screen.getAllByRole("combobox", { name: "How it came in" });
    await user.click(types[1]);
    await user.click(
      await screen.findByRole("option", {
        name: "Reward, referral, cashback or airdrop",
      }),
    );
    await user.type(
      screen.getByLabelText("Value per USDC when you received it (₹)"),
      "95",
    );
    expect(screen.getByTestId("remaining-usdc")).toHaveTextContent(
      "All USDC explained",
    );
    await user.click(
      screen.getByRole("button", { name: /Show my tax report/ }),
    );
    await headline();
    // cost: 50 × 90 (P2P) + 60 × 90 + 40 × 95 = 13,700 → 14,250 − 13,700 = 550
    expect(detailRow("Taxable gains")).toHaveTextContent("₹550.00");
    expect(detailRow("Income on receiving USDC")).toHaveTextContent(
      "₹3,800.00",
    );
  });
});

describe("required step wording", () => {
  it("says the user never bought on P2P.me when nothing was bought", async () => {
    fetchMock.mockResolvedValue([sell("2026-06-02T10:00", 100, 9_500)]);
    await generate();
    const card = (
      await screen.findByText("Before we calculate your tax")
    ).closest("[data-slot=card]") as HTMLElement;
    expect(card).toHaveTextContent(
      "You sold or spent 100.000000 USDC on P2P.me, but you never bought any USDC here. All of it came into your wallet from somewhere else",
    );
    expect(card).not.toHaveTextContent("0.000000 USDC came from");
  });

  it("shows the known amount when some USDC was bought", async () => {
    fetchMock.mockResolvedValue([
      buy("2026-05-01T10:00", 50, 4_500),
      sell("2026-06-02T10:00", 150, 14_250),
    ]);
    await generate();
    const card = (
      await screen.findByText("Before we calculate your tax")
    ).closest("[data-slot=card]") as HTMLElement;
    expect(card).toHaveTextContent(
      "but only 50.000000 USDC came from purchases we know about. The other 100.000000 USDC came into your wallet",
    );
  });
});

describe("required step wording: sold before buying", () => {
  it("explains timing when purchases exceed sales but came later", async () => {
    fetchMock.mockResolvedValue([
      sell("2026-06-02T10:00", 40, 3_800),
      buy("2026-06-05T10:00", 500, 45_000),
      sell("2026-06-10T10:00", 60, 5_700),
    ]);
    await generate();
    const card = (
      await screen.findByText("Before we calculate your tax")
    ).closest("[data-slot=card]") as HTMLElement;
    expect(card).toHaveTextContent(
      "You bought 500.000000 USDC on P2P.me and sold or spent 100.000000 USDC there. But some of your sales happened before the purchases that could cover them, starting on 02/06/2026. So 40.000000 USDC that you sold came into your wallet from somewhere else",
    );
    expect(card).not.toHaveTextContent("we only know where");
  });
});

describe("required step: received-on date", () => {
  const lateDate = () => [
    sell("2025-08-20T10:00", 100, 9_500),
    buy("2026-01-10T10:00", 500, 45_000),
  ];

  it("rejects a date after the first sale that needed the USDC, and adds nothing", async () => {
    fetchMock.mockResolvedValue(lateDate());
    const user = await generate();
    await screen.findByText("Before we calculate your tax");
    await user.type(screen.getByLabelText("Price you paid per USDC (₹)"), "90");
    const date = screen.getByLabelText("Received on");
    await user.clear(date);
    await user.type(date, "2026-10-20");
    await user.click(
      screen.getByRole("button", { name: /Show my tax report/ }),
    );
    expect(screen.getByRole("alert")).toHaveTextContent(
      "This USDC must have reached you by 20/08/2025",
    );
    // clicking again changes nothing: no entries piled up
    await user.click(
      screen.getByRole("button", { name: /Show my tax report/ }),
    );
    expect(screen.getByTestId("missing-usdc")).toHaveTextContent(
      "100.000000 USDC",
    );
    expect(screen.queryByTestId("headline-value")).not.toBeInTheDocument();
  });

  it("says how much was bought on P2P.me, not counting manual entries", async () => {
    fetchMock.mockResolvedValue(lateDate());
    await generate();
    const card = (
      await screen.findByText("Before we calculate your tax")
    ).closest("[data-slot=card]") as HTMLElement;
    expect(card).toHaveTextContent("You bought 500.000000 USDC on P2P.me");
  });
});

describe("tax profile card", () => {
  it("sits in the report footer, sums up the choices and opens the profile page", async () => {
    const user = userEvent.setup();
    renderReport(<Report />);
    expect(screen.queryByRole("button", { name: "Settings" })).toBeNull();
    expect(
      within(screen.getByRole("contentinfo")).getByRole("link", {
        name: "Tax profile",
      }),
    ).toBeInTheDocument();
    expect(screen.getByTestId("tax-profile-summary")).toHaveTextContent(
      "FIFO · New regime · Capital gains",
    );
    await user.click(screen.getByRole("link", { name: "Tax profile" }));
    const page = await screen.findByRole("main", { name: "Tax profile" });
    await user.click(within(page).getByLabelText("Old regime"));
    await user.click(
      within(page).getByRole("button", { name: /Add TDS entry/ }),
    );
    await user.click(screen.getByRole("button", { name: "Go back" }));
    expect(await screen.findByTestId("tax-profile-summary")).toHaveTextContent(
      "FIFO · Old regime · Capital gains · 1 TDS entry",
    );
  });
});

describe("a year with no completed orders", () => {
  const emptyYear = async () => {
    expect(
      await screen.findByText("No completed orders in FY 2026-27"),
    ).toBeInTheDocument();
    expect(screen.queryByTestId("headline-value")).not.toBeInTheDocument();
    expect(screen.queryByRole("tab")).not.toBeInTheDocument();
    expect(screen.queryByText("Tax computation")).not.toBeInTheDocument();
  };

  it("shows a note instead of an all-zero report when every order was cancelled", async () => {
    fetchMock.mockResolvedValue([
      { ...buy("2026-06-01T10:00", 500, 44_500), status: 4 },
      { ...sell("2026-09-05T10:00", 700, 65_100), status: 4 },
    ]);
    await generate();
    await emptyYear();
  });

  it("shows the note when the completed orders are all in another year", async () => {
    fetchMock.mockResolvedValue([
      buy("2025-06-01T10:00", 500, 44_500),
      sell("2025-09-05T10:00", 500, 46_000),
    ]);
    await generate();
    await emptyYear();
  });
});
