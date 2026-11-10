import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { buy, istDate, sell } from "@tests/tax/helpers/factories";
import { renderReport } from "@tests/tax/helpers/render";
import { ResultAsync } from "neverthrow";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { USDC_BASE } from "@/tax/core/onchain";
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

const WALLET = `0x${"a".repeat(40)}`; // userAddress of the factory orders
const FRIEND = `0x${"f".repeat(40)}`;
const CEX = `0x${"c".repeat(40)}`;

const orders = (): RawOrder[] => [
  buy("2026-06-01T10:00", 500, 44_500),
  buy("2026-07-10T10:00", 500, 45_500),
  sell("2026-09-05T10:00", 700, 65_100),
  buy("2026-09-20T10:00", 100, 9_100),
  sell("2026-12-20T10:00", 300, 27_000),
];

const unix = (local: string) =>
  String(Math.floor(istDate(local).getTime() / 1000));

const csvFile = () =>
  new File(
    [
      [
        "Transaction Hash,UnixTimestamp,From,To,TokenValue,ContractAddress,TokenSymbol",
        // 100 USDC sent to a friend outside P2P.me
        `0x${"1".repeat(64)},${unix("2026-10-01T10:00")},${WALLET},${FRIEND},100,${USDC_BASE},USDC`,
        // 20 USDC withdrawn from an exchange
        `0x${"2".repeat(64)},${unix("2026-10-02T10:00")},${CEX},${WALLET},20,${USDC_BASE},USDC`,
      ].join("\n"),
    ],
    "transfers.csv",
    { type: "text/csv" },
  );

async function openOnchain() {
  const user = userEvent.setup();
  renderReport(<Report />);
  await user.type(screen.getByLabelText("Wallet address"), WALLET);
  await user.click(screen.getByRole("button", { name: "Generate report" }));
  expect(await screen.findByTestId("headline-value")).toHaveTextContent(
    "₹748.80",
  );
  // Nudge in the summary column leads to the tab
  await user.click(
    within(screen.getByTestId("onchain-nudge")).getByRole("button", {
      name: "Check on-chain transfers",
    }),
  );
  return user;
}

beforeEach(() => {
  fetchMock.mockReset();
  fetchMock.mockResolvedValue(orders());
});

describe("on-chain check", () => {
  it("lists transfers outside P2P.me and taxes one marked as sold", async () => {
    const user = await openOnchain();
    await user.upload(screen.getByLabelText("Token transfer CSV"), csvFile());

    expect(await screen.findByTestId("onchain-summary")).toHaveTextContent(
      "2 USDC movement(s)",
    );
    expect(screen.getAllByTestId("outflow-row")).toHaveLength(1);
    expect(screen.getAllByTestId("inflow-row")).toHaveLength(1);
    expect(
      screen.getByText(/1 USDC transfer\(s\) out of your wallet/),
    ).toBeInTheDocument();

    await user.click(
      screen.getByRole("combobox", { name: "What was this transfer" }),
    );
    await user.click(
      await screen.findByRole("option", {
        name: "Sold it, or paid for something with it",
      }),
    );
    // Suggested from the P2P.me rate near that date (₹91 → ₹9,100), but not
    // used until confirmed
    const value = screen.getByLabelText("INR value you received (₹)");
    expect(value).toHaveValue("9100.00");
    expect(screen.getByTestId("headline-value")).toHaveTextContent("₹748.80");
    expect(screen.getByText(/no confirmed INR value/)).toBeInTheDocument();
    await user.clear(value);
    await user.type(value, "9600");
    await user.click(screen.getByRole("button", { name: "Confirm" }));

    // 2,400 on P2P.me + (9,600 − 9,100) outside = 2,900 → tax 870 + cess
    expect(screen.getByTestId("headline-value")).toHaveTextContent("₹904.80");
    expect(
      screen.queryByText(/USDC transfer\(s\) out of your wallet/),
    ).not.toBeInTheDocument();
  });

  it("records the cost of a receipt and links it to the transaction", async () => {
    const user = await openOnchain();
    await user.upload(screen.getByLabelText("Token transfer CSV"), csvFile());
    const row = await screen.findByTestId("inflow-row");
    await user.type(
      within(row).getByLabelText("Price you paid per USDC (₹)"),
      "88",
    );
    await user.click(within(row).getByRole("button", { name: "Save" }));
    expect(
      within(row).getByText(/Recorded: Bought on an exchange/),
    ).toHaveTextContent("₹1,760.00");
  });

  it("explains a CSV that is not a token-transfer export", async () => {
    const user = await openOnchain();
    await user.upload(
      screen.getByLabelText("Token transfer CSV"),
      new File(["a,b\n1,2"], "x.csv", { type: "text/csv" }),
    );
    expect(
      await screen.findByText(/does not look like a token-transfer CSV/),
    ).toBeInTheDocument();
  });
});
