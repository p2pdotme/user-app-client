import { screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { makeDisputedOrder } from "@/test/factories";
import { renderWithProviders } from "@/test/render";
import { mockActiveAccount, mockActiveWalletChain } from "@/test/thirdweb";
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
    // clearAllMocks in src/test/setup.ts clears call history but leaves a spy
    // installed, so a failing assertion before a manual mockRestore would leak
    // the stub into every later test in this file.
    vi.restoreAllMocks();
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
    //
    // The marker has to be list-only AND has to survive every state the list
    // can be in for this order. "Raise a Dispute" fails the second half: this
    // order is disputed and the gate is open, so the list swaps that row for
    // the dispute chat row and the string is never on screen at all. The wait
    // would then resolve on its first tick with the list still up. Browse Help
    // Center renders unconditionally in help-list-view and appears nowhere in
    // chat-view, so it goes away exactly when the list does.
    await waitFor(() => {
      expect(screen.queryByText("Browse Help Center")).not.toBeInTheDocument();
    });

    // ChatView is lazy, so the wait above only proves the list left, not that
    // the chat page arrived. This description is rendered by both views, so it
    // is unambiguous exactly once the list has exited, and seeing it proves the
    // lazy chunk resolved and ChatView mounted with a defined account.
    await screen.findByText("Get assistance with P2P-ing");

    mockActiveAccount(undefined);
    rerender(<HelpDrawer open onOpenChange={() => {}} order={order} />);

    await waitFor(() => {
      expect(screen.getByText("Help & Support")).toBeInTheDocument();
    });
  });

  it("shows the dispute chat row on the list once the gate is open", () => {
    // The only test of the wiring in index.tsx,
    // onOpenDisputeChat={canChatInApp ? handleChatWithUs : undefined}.
    // help-list-view.test.tsx passes that prop by hand, so nothing there can
    // tell whether the drawer actually supplies it. This is the line that
    // decides whether any real user ever sees the row.
    vi.stubEnv("VITE_SUPPORT_BRIDGE_URL", "https://bridge.test");
    mockActiveAccount({
      address: "0x1111111111111111111111111111111111111111",
      signMessage: async () => "0xsignature",
    });

    renderWithProviders(
      <HelpDrawer open onOpenChange={() => {}} order={makeDisputedOrder()} />,
    );

    expect(screen.getByText("Dispute raised")).toBeInTheDocument();
    expect(screen.queryByText("Raise a Dispute")).not.toBeInTheDocument();
  });

  it("sends chat to Telegram when the wallet reports no chain", () => {
    // The chain id is bound into the bridge sign-in message and picks the
    // chain the bridge runs ERC-1271 verification on, so an unresolved chain
    // must mean Telegram rather than a sign-in claiming a chain the wallet
    // may not be on. The gate requires a resolved chain for that reason, and
    // there is no fallback to the configured one.
    //
    // Asserted through the Telegram call rather than through the chat page
    // staying shut, because the transition is asynchronous and "the chat page
    // did not appear yet" is true one tick after any click.
    vi.stubEnv("VITE_SUPPORT_BRIDGE_URL", "https://bridge.test");
    mockActiveAccount({
      address: "0x1111111111111111111111111111111111111111",
      signMessage: async () => "0xsignature",
    });
    mockActiveWalletChain(undefined);
    const open = vi.spyOn(window, "open").mockReturnValue(null);
    const onOpenChange = vi.fn();

    renderWithProviders(
      <HelpDrawer
        open
        onOpenChange={onOpenChange}
        order={makeDisputedOrder()}
      />,
    );
    screen.getByText("Chat with us").click();

    expect(open).toHaveBeenCalledTimes(1);
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});
