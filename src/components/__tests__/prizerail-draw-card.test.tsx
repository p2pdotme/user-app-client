import { fireEvent, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "@/test/render";
import { PrizerailDrawCard } from "../prizerail-draw-card";

// The card only reads the public draw feed through this hook; stubbing it
// keeps the test off the network and lets each case shape the feed.
const drawsState: {
  data: unknown;
  isLoading: boolean;
} = { data: undefined, isLoading: false };

vi.mock("@/hooks/use-prizerail-draws", () => ({
  usePrizerailDraws: () => drawsState,
}));

describe("PrizerailDrawCard", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    drawsState.data = undefined;
    drawsState.isLoading = false;
  });

  it("renders nothing when the campaign is not configured", () => {
    vi.stubEnv("VITE_PRIZERAIL_CAMPAIGN_SLUG", "");
    const { container } = renderWithProviders(
      <PrizerailDrawCard currency="NGN" usdcAmount="50" />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("renders nothing for a 0% market", () => {
    vi.stubEnv("VITE_PRIZERAIL_CAMPAIGN_SLUG", "p2p-daily");
    const { container } = renderWithProviders(
      <PrizerailDrawCard currency="VEN" usdcAmount="50" />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("shows the entries earned and opens the public campaign page", () => {
    // vitest loads the project .env; pin the host overrides so a local
    // sandbox setting cannot change the expected URL.
    vi.stubEnv("VITE_PRIZERAIL_PUBLIC_URL", "");
    vi.stubEnv("VITE_PRIZERAIL_CAMPAIGN_URL", "");
    vi.stubEnv("VITE_PRIZERAIL_CAMPAIGN_SLUG", "p2p-daily");
    const open = vi.fn();
    vi.stubGlobal("open", open);

    renderWithProviders(<PrizerailDrawCard currency="ARS" usdcAmount="50" />);

    // $50 at 1% = 50 entries
    expect(screen.getByText(/50 entries/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /view draw/i }));
    expect(open).toHaveBeenCalledWith(
      "https://www.prizerail.com/campaigns/p2p-daily",
      "_blank",
      "noopener,noreferrer",
    );
  });

  it("shows the next draw and pool size when the feed is available", () => {
    vi.stubEnv("VITE_PRIZERAIL_CAMPAIGN_SLUG", "p2p-daily");
    drawsState.data = {
      campaign: { name: "P2P Daily" },
      nextDraw: {
        id: "n",
        drawAt: "2026-11-03T17:00:00.000Z",
        cutoffAt: "2026-11-03T16:30:00.000Z",
        stage: "open",
        entrantCount: 120,
        totalEntries: 4800,
      },
    };

    renderWithProviders(<PrizerailDrawCard currency="NGN" usdcAmount="50" />);

    // The card itself stays to one sentence; draw timing is in the explainer.
    expect(screen.queryByText(/^next draw:/i)).not.toBeInTheDocument();
    fireEvent.click(
      screen.getByRole("button", { name: /about the prize draw/i }),
    );
    expect(screen.getByText(/^next draw:/i)).toBeInTheDocument();
    expect(screen.getByText(/120 players/)).toBeInTheDocument();
    expect(screen.getByText(/4,800 entries/)).toBeInTheDocument();
  });

  it("opens the explainer from the info button", () => {
    vi.stubEnv("VITE_PRIZERAIL_CAMPAIGN_SLUG", "p2p-daily");

    renderWithProviders(<PrizerailDrawCard currency="NGN" usdcAmount="50" />);

    expect(
      screen.queryByText(/how the prize draw works/i),
    ).not.toBeInTheDocument();
    fireEvent.click(
      screen.getByRole("button", { name: /about the prize draw/i }),
    );
    expect(screen.getByText(/how the prize draw works/i)).toBeInTheDocument();
    // Worked example uses this market's rate: $100 at 2% = 200 entries.
    expect(
      screen.getByText(/\$100 order gives you 200 entries/i),
    ).toBeInTheDocument();
  });

  it("skips the next-draw line when drawAt is unparsable", () => {
    vi.stubEnv("VITE_PRIZERAIL_CAMPAIGN_SLUG", "p2p-daily");
    drawsState.data = {
      nextDraw: {
        id: "n",
        drawAt: "not-a-date",
        cutoffAt: null,
        stage: "open",
      },
    };

    renderWithProviders(<PrizerailDrawCard currency="NGN" usdcAmount="50" />);

    expect(screen.queryByText(/^next draw:/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/invalid date/i)).not.toBeInTheDocument();
  });
});
