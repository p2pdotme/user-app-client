import { screen, within } from "@testing-library/react";
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

const MAIN = `0x${"a".repeat(40)}`;
const SECOND = `0x${"b".repeat(40)}`;

/** Wallet A bought, but the USDC went to wallet B, which then sold it */
const ordersFor = (address: string): RawOrder[] =>
  address === MAIN
    ? [
        buy("2026-05-01T10:00", 100, 9_000, {
          userAddress: MAIN,
          usdcRecipientAddress: SECOND,
        }),
      ]
    : [sell("2026-06-02T10:00", 100, 9_800, { userAddress: SECOND })];

async function generate(address = MAIN) {
  const user = userEvent.setup();
  renderReport(<Report />);
  await user.type(screen.getByLabelText("Wallet address"), address);
  await user.click(screen.getByRole("button", { name: "Generate report" }));
  return user;
}

const detailRow = (label: string): HTMLElement =>
  screen.getByText(label, { selector: "dt" }).parentElement as HTMLElement;

beforeEach(() => {
  fetchMock.mockReset();
  fetchMock.mockImplementation(async (a) => ordersFor(a));
});

describe("purchases delivered to another wallet", () => {
  it("asks first, then adds the wallet and computes across both", async () => {
    const user = await generate();
    expect(
      await screen.findByText("Some of your purchases went to another wallet"),
    ).toBeInTheDocument();
    expect(screen.queryByTestId("headline-value")).not.toBeInTheDocument();
    const item = screen.getByTestId("delivered-elsewhere");
    expect(item).toHaveTextContent("0xbbbb…bbbb");
    expect(item).toHaveTextContent("1 purchase(s), 100.000000 USDC");

    await user.click(
      within(item).getByRole("button", { name: /It's my wallet: add it/ }),
    );
    // both wallets fetched, one FIFO pool: 9,800 − 9,000 = 800
    expect(await screen.findByTestId("headline-value")).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith(SECOND);
    expect(screen.getByLabelText("Wallet address 2")).toHaveValue(SECOND);
    expect(detailRow("Taxable gains")).toHaveTextContent("₹800.00");
  });

  it("'someone else' keeps the lot out and moves on to the next question", async () => {
    fetchMock.mockImplementation(async () => [
      buy("2026-05-01T10:00", 100, 9_000, { usdcRecipientAddress: SECOND }),
      sell("2026-06-02T10:00", 50, 4_900),
    ]);
    const user = await generate();
    const item = await screen.findByTestId("delivered-elsewhere");
    await user.click(
      within(item).getByRole("button", { name: /belongs to someone else/ }),
    );
    expect(
      await screen.findByText("Before we calculate your tax"),
    ).toBeInTheDocument();
    expect(screen.getByTestId("missing-usdc")).toHaveTextContent(
      "50.000000 USDC",
    );
  });
});

describe("several wallets", () => {
  it("adds and removes wallets and rejects duplicates", async () => {
    const user = userEvent.setup();
    renderReport(<Report />);
    await user.type(screen.getByLabelText("Wallet address"), MAIN);
    await user.click(
      screen.getByRole("button", { name: /Add another wallet of yours/ }),
    );
    await user.type(screen.getByLabelText("Wallet address 2"), MAIN);
    await user.click(screen.getByRole("button", { name: "Generate report" }));
    expect(
      await screen.findByText("This wallet is already in the list."),
    ).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();

    await user.clear(screen.getByLabelText("Wallet address 2"));
    await user.type(screen.getByLabelText("Wallet address 2"), SECOND);
    await user.click(screen.getByRole("button", { name: "Generate report" }));
    expect(await screen.findByTestId("headline-value")).toBeInTheDocument();
    expect(fetchMock.mock.calls.map((c) => c[0])).toEqual([MAIN, SECOND]);

    await user.click(screen.getByRole("button", { name: "Remove wallet 2" }));
    expect(screen.queryByLabelText("Wallet address 2")).not.toBeInTheDocument();
  });
});

describe("cost method lock", () => {
  it("locks the method so it cannot change", async () => {
    fetchMock.mockImplementation(async () => [
      buy("2026-04-01T10:00", 100, 9_000),
      sell("2026-05-01T10:00", 100, 9_500),
    ]);
    const user = await generate();
    await screen.findByTestId("headline-value");
    await user.click(screen.getByRole("link", { name: "Tax profile" }));
    const drawer = await screen.findByRole("main", { name: "Tax profile" });
    await user.click(
      within(drawer).getByRole("button", { name: /Lock this method/ }),
    );
    expect(within(drawer).getByTestId("method-locked")).toHaveTextContent(
      "Locked to FIFO",
    );
    expect(within(drawer).getByLabelText(/Weighted average/)).toBeDisabled();
  });
});

describe("non-INR orders", () => {
  it("are listed, not silently dropped", async () => {
    fetchMock.mockImplementation(async () => [
      buy("2026-04-01T10:00", 100, 9_000),
      sell("2026-05-01T10:00", 10, 50, {
        currency:
          "0x42524c0000000000000000000000000000000000000000000000000000000000",
      }),
    ]);
    const user = await generate();
    expect(
      await screen.findByText(/1 completed order\(s\) in other currencies/),
    ).toHaveTextContent("BRL: 1");
    await user.click(screen.getByText("Show these orders"));
    expect(screen.getByText(/10.000000 USDC · 50.00 BRL/)).toBeInTheDocument();
  });
});
