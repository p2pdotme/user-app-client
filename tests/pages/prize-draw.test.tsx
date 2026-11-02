import { screen } from "@testing-library/react";
import { renderWithProviders } from "@tests/helpers/render";
import { afterEach, describe, expect, it, vi } from "vitest";
import { PrizeDraw } from "@/pages/prize-draw";

// The page reads the selected market from settings; each case picks one.
const settingsState = { currency: { currency: "NGN" } };

vi.mock("@/contexts", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/contexts")>()),
  useSettings: () => ({ settings: settingsState }),
}));

// Keep the page off the network: no wins, no current draw, no history.
vi.mock("@/hooks/use-prizerail-user", () => ({
  usePrizerailUserSummary: () => ({
    data: undefined,
    isLoading: false,
    isError: false,
    refetch: vi.fn(),
  }),
  usePrizerailUserDrawings: () => ({
    data: undefined,
    isLoading: false,
    isError: false,
    refetch: vi.fn(),
  }),
}));

describe("PrizeDraw page", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    settingsState.currency = { currency: "NGN" };
  });

  it("shows the unavailable notice in a 0% market (Venezuela)", () => {
    vi.stubEnv("VITE_PRIZERAIL_CAMPAIGN_SLUG", "p2p-daily");
    vi.stubEnv("VITE_PRIZERAIL_USER_API_URL", "http://localhost:8080");
    settingsState.currency = { currency: "VEN" };

    renderWithProviders(<PrizeDraw />);

    expect(
      screen.getByText(/prize draw isn't available right now/i),
    ).toBeInTheDocument();
    expect(screen.queryByText(/your past draws/i)).not.toBeInTheDocument();
  });

  it("renders the draws page in a market that earns entries", () => {
    vi.stubEnv("VITE_PRIZERAIL_CAMPAIGN_SLUG", "p2p-daily");
    vi.stubEnv("VITE_PRIZERAIL_USER_API_URL", "http://localhost:8080");

    renderWithProviders(<PrizeDraw />);

    expect(screen.getByText(/your past draws/i)).toBeInTheDocument();
    expect(
      screen.queryByText(/prize draw isn't available right now/i),
    ).not.toBeInTheDocument();
  });
});
