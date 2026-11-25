import { fireEvent, screen } from "@testing-library/react";
import { renderWithProviders } from "@tests/helpers/render";
import { afterEach, describe, expect, it, vi } from "vitest";
import { PrizeDraw } from "@/pages/prize-draw";

// The page reads the selected market from settings; each case picks one.
const settingsState = { currency: { currency: "NGN" } };

vi.mock("@/contexts", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/contexts")>()),
  useSettings: () => ({ settings: settingsState }),
}));

// What the winner-link hook answers, and whether it was switched on.
const publicityState: {
  summary: unknown;
  links: { data?: unknown; isLoading: boolean; isFetching: boolean };
  enabled: boolean[];
  refetch: ReturnType<typeof vi.fn>;
} = {
  summary: undefined,
  links: { data: undefined, isLoading: false, isFetching: false },
  enabled: [],
  refetch: vi.fn(),
};

const REQUEST = {
  drawingId: "g1",
  drawingNumber: 1,
  kind: "guarantee",
  drawAt: "2026-11-25T16:15:00.000Z",
  amountCents: 100_000,
  status: "awaiting",
};
const LINK_URL = "https://www.prizerail.com/disclosures/abc";

function summaryWith(requests: unknown[]) {
  return {
    wallet: "0xabc",
    currentDrawing: null,
    wins: { count: requests.length, totalCents: 100_000 },
    recentWins: [],
    publicityRequests: requests,
  };
}

// Keep the page off the network: no wins, no current draw, no history.
vi.mock("@/hooks/use-prizerail-user", () => ({
  usePrizerailUserSummary: () => ({
    data: publicityState.summary,
    isLoading: false,
    isError: false,
    refetch: vi.fn(),
  }),
  usePrizerailPublicityLinks: (enabled: boolean) => {
    publicityState.enabled.push(enabled);
    return { ...publicityState.links, refetch: publicityState.refetch };
  },
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
    publicityState.summary = undefined;
    publicityState.links = {
      data: undefined,
      isLoading: false,
      isFetching: false,
    };
    publicityState.enabled = [];
    publicityState.refetch = vi.fn();
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

  it("links the past draws section to the public campaign page", () => {
    vi.stubEnv("VITE_PRIZERAIL_CAMPAIGN_SLUG", "p2p-ramp");
    vi.stubEnv("VITE_PRIZERAIL_PUBLIC_URL", "https://www.prizerail.com");
    vi.stubEnv("VITE_PRIZERAIL_USER_API_URL", "http://localhost:8080");

    renderWithProviders(<PrizeDraw />);

    const link = screen.getByRole("link", { name: /verify past draws/i });
    expect(link).toHaveAttribute(
      "href",
      "https://www.prizerail.com/campaigns/p2p-ramp",
    );
    expect(link).toHaveAttribute("target", "_blank");
  });

  it("explains draw fairness in the rules drawer with a replay link", () => {
    vi.stubEnv("VITE_PRIZERAIL_CAMPAIGN_SLUG", "p2p-ramp");
    vi.stubEnv("VITE_PRIZERAIL_PUBLIC_URL", "https://www.prizerail.com");
    vi.stubEnv("VITE_PRIZERAIL_USER_API_URL", "http://localhost:8080");

    renderWithProviders(<PrizeDraw />);
    fireEvent.click(
      screen.getByRole("button", { name: /how the prize draw works/i }),
    );

    expect(screen.getByText(/about draw fairness/i)).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /replay every draw/i }),
    ).toHaveAttribute("href", "https://www.prizerail.com/campaigns/p2p-ramp");
  });

  describe("winner publicity", () => {
    const enable = () => {
      vi.stubEnv("VITE_PRIZERAIL_CAMPAIGN_SLUG", "p2p-ramp");
      vi.stubEnv("VITE_PRIZERAIL_USER_API_URL", "http://localhost:8080");
    };

    it("asks for no link and shows no card when there is nothing to share", () => {
      enable();
      publicityState.summary = summaryWith([]);

      renderWithProviders(<PrizeDraw />);

      expect(screen.queryByText(/you won \$/i)).not.toBeInTheDocument();
      expect(publicityState.enabled.every((e) => e === false)).toBe(true);
    });

    it("shows the winner their own link to share the win", () => {
      enable();
      publicityState.summary = summaryWith([REQUEST]);
      publicityState.links.data = [{ ...REQUEST, url: LINK_URL }];

      renderWithProviders(<PrizeDraw />);

      expect(screen.getByText("You won $1,000.00!")).toBeInTheDocument();
      const link = screen.getByRole("link", { name: /share your win/i });
      expect(link).toHaveAttribute("href", LINK_URL);
      expect(link).toHaveAttribute("target", "_blank");
      expect(link).toHaveAttribute("rel", "noopener noreferrer");
      expect(screen.getByText(/only for you/i)).toBeInTheDocument();
      expect(publicityState.enabled).toContain(true);
    });

    it("waits for the link instead of showing a dead button", () => {
      enable();
      publicityState.summary = summaryWith([REQUEST]);
      publicityState.links.isLoading = true;

      renderWithProviders(<PrizeDraw />);

      expect(
        screen.getByRole("button", { name: /getting your link/i }),
      ).toBeDisabled();
      expect(
        screen.queryByRole("link", { name: /share your win/i }),
      ).not.toBeInTheDocument();
    });

    it("offers a retry when the link could not be read", () => {
      enable();
      publicityState.summary = summaryWith([REQUEST]);

      renderWithProviders(<PrizeDraw />);
      expect(screen.getByText(/couldn't load your link/i)).toBeInTheDocument();
      // The page's own load-error card is not showing, so this is the only one.
      fireEvent.click(screen.getByRole("button", { name: /try again/i }));

      expect(publicityState.refetch).toHaveBeenCalledTimes(1);
    });

    it("tells a winner in review, or rejected, what happens next", () => {
      enable();
      publicityState.summary = summaryWith([
        { ...REQUEST, status: "in_review" },
        { ...REQUEST, drawingId: "g2", status: "rejected" },
      ]);
      publicityState.links.data = [
        { ...REQUEST, status: "in_review", url: LINK_URL },
        {
          ...REQUEST,
          drawingId: "g2",
          status: "rejected",
          url: `${LINK_URL}2`,
        },
      ];

      renderWithProviders(<PrizeDraw />);

      expect(
        screen.getByRole("link", { name: /view what i sent/i }),
      ).toHaveAttribute("href", LINK_URL);
      expect(
        screen.getByRole("link", { name: /fix and send again/i }),
      ).toHaveAttribute("href", `${LINK_URL}2`);
    });
  });
});
