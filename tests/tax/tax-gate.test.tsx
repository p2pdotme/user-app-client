import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "@tests/tax/helpers/render";
import { ResultAsync } from "neverthrow";
import { Route, Routes } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Tax, TaxConfig, TaxSources } from "@/tax";
import type { RawOrder } from "@/tax/core/types";

const ADDRESS = `0x${"ab".repeat(20)}`;

const OTHER = `0x${"cd".repeat(20)}`;

const state = vi.hoisted(() => ({
  account: "",
  currency: "INR",
  isLoading: false,
  fetch: vi.fn<(address: string) => Promise<RawOrder[]>>(),
}));

vi.mock("@/contexts/settings", () => ({
  useSettings: () => ({
    settings: { currency: { currency: state.currency } },
    isLoading: state.isLoading,
  }),
}));

vi.mock("@/hooks/use-thirdweb", () => ({
  useThirdweb: () => ({ account: { address: state.account } }),
}));

vi.mock("@/tax/core/subgraph/client", async (orig) => {
  const actual = await orig<typeof import("@/tax/core/subgraph/client")>();
  return {
    ...actual,
    fetchAllOrders: (address: string) =>
      ResultAsync.fromPromise(state.fetch(address), (cause) => ({
        domain: "Subgraph" as const,
        code: "SGNetworkError" as const,
        message: "mock failure",
        cause,
      })),
  };
});

function renderAt(route: string) {
  return renderWithProviders(
    <Routes>
      <Route path="/" element={<p>Home screen</p>} />
      <Route path="/tax" element={<Tax />} />
      <Route path="/tax/config" element={<TaxConfig />} />
      <Route path="/tax/sources" element={<TaxSources />} />
    </Routes>,
    { route, withSettings: false },
  );
}

beforeEach(() => {
  state.account = ADDRESS;
  state.currency = "INR";
  state.isLoading = false;
  state.fetch.mockReset();
  state.fetch.mockResolvedValue([]);
});

describe("tax screens are for India (INR) only", () => {
  it("opens the report on the connected wallet for an INR user", async () => {
    renderAt("/tax");
    expect(screen.getByText("Tax report")).toBeInTheDocument();
    await waitFor(() => expect(state.fetch).toHaveBeenCalledWith(ADDRESS));
  });

  it("opens the legal sources for an INR user", () => {
    renderAt("/tax/sources");
    expect(screen.getByText("Legal sources")).toBeInTheDocument();
  });

  it.each(["/tax", "/tax/config", "/tax/sources"])(
    "sends a non-INR user home from %s",
    (route) => {
      state.currency = "ARS";
      renderAt(route);
      expect(screen.getByText("Home screen")).toBeInTheDocument();
      expect(state.fetch).not.toHaveBeenCalled();
    },
  );

  it("waits for settings before deciding", () => {
    state.currency = "ARS";
    state.isLoading = true;
    renderAt("/tax");
    expect(screen.queryByText("Home screen")).not.toBeInTheDocument();
    expect(screen.queryByText("Tax report")).not.toBeInTheDocument();
  });
});

describe("tax settings stay with the account that entered them", () => {
  const otherIncome = () =>
    screen.getByLabelText(/Other total income/) as HTMLInputElement;

  async function openSettings() {
    const user = userEvent.setup();
    await user.click(screen.getByRole("link", { name: "Tax profile" }));
    await screen.findByRole("main", { name: "Tax profile" });
    return user;
  }

  it("keeps them when the same account comes back to the screen", async () => {
    const first = renderAt("/tax");
    const user = await openSettings();
    await user.clear(otherIncome());
    await user.type(otherIncome(), "750000");
    first.unmount();

    renderAt("/tax");
    await openSettings();
    expect(otherIncome()).toHaveValue("750000");
  });

  it("starts empty for another account on the same tab", async () => {
    const first = renderAt("/tax");
    const user = await openSettings();
    await user.clear(otherIncome());
    await user.type(otherIncome(), "750000");
    first.unmount();

    state.account = OTHER;
    renderAt("/tax");
    await waitFor(() => expect(state.fetch).toHaveBeenCalledWith(OTHER));
    expect(state.fetch).toHaveBeenCalledTimes(2);
    await openSettings();
    expect(otherIncome()).not.toHaveValue("750000");
  });
});
