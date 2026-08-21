import { screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { makeDisputedOrder } from "@/test/factories";
import { renderWithProviders } from "@/test/render";
import { mockActiveAccount } from "@/test/thirdweb";
import { HelpDrawer } from "../index";

// The stub every test file that renders HelpDrawer pastes below its own
// imports. See the doc comment on renderWithProviders for why it belongs
// here and not in a shared module.
type RaiseDisputeOptions = {
  onError?: (error: Error, variables: unknown) => void;
  onSuccess?: (data: unknown, variables: unknown) => void;
};

vi.mock("@/hooks/use-raise-dispute", () => ({
  useRaiseDispute: () => ({
    raiseDisputeMutation: {
      isPending: false,
      mutateAsync: vi.fn(
        async (variables: unknown, options?: RaiseDisputeOptions) => {
          options?.onSuccess?.(undefined, variables);
          return undefined;
        },
      ),
    },
  }),
}));

describe("HelpDrawer chat page", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("falls back to the help list when the chat gate closes mid-session", async () => {
    // canChatInApp also needs a bridge url, which vitest.config.mts does not
    // set globally. Stub it here so the initial click can actually reach the
    // chat page before the gate closes; support-bridge.ts reads it lazily at
    // call time for exactly this reason.
    vi.stubEnv("VITE_SUPPORT_BRIDGE_URL", "https://bridge.test");
    mockActiveAccount({
      address: "0x1111111111111111111111111111111111111111",
      signMessage: async () => "0xsignature",
    });

    const order = makeDisputedOrder();
    const { rerender } = renderWithProviders(
      <HelpDrawer open onOpenChange={() => {}} order={order} />,
    );
    screen.getByText("Chat with us").click();

    // AnimatePresence mode="wait" holds the list view on screen until its
    // exit animation finishes, so the chat page is not actually mounted the
    // instant setPage runs. Wait for the list-only content to be gone before
    // dropping the wallet, or the drop lands before the gate ever opened and
    // the test proves nothing.
    await waitFor(() => {
      expect(screen.queryByText("Raise a Dispute")).not.toBeInTheDocument();
    });

    mockActiveAccount(undefined);
    rerender(<HelpDrawer open onOpenChange={() => {}} order={order} />);

    await waitFor(() => {
      expect(screen.getByText("Help & Support")).toBeInTheDocument();
    });
  });
});
