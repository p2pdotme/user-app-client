import { screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { makeDisputedOrder, makeOrder } from "@/test/factories";
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
    // Undoes the fetch stub the first test below installs with
    // vi.stubGlobal, or it would leak into every later test in this file.
    vi.unstubAllGlobals();
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
    // The chat page below mounts the real, unmocked UserSupportPanel, which
    // signs itself in against the bridge on mount. Stub fetch so this unit
    // suite never makes a real outbound request; nothing here asserts on
    // that request or its response.
    vi.stubGlobal("fetch", () =>
      Promise.reject(new Error("no network in tests")),
    );
    mockActiveAccount({
      address: "0x1111111111111111111111111111111111111111",
      signMessage: async () => "0xsignature",
    });
    const open = vi.spyOn(window, "open").mockReturnValue(null);

    const order = makeDisputedOrder();
    const { rerender } = renderWithProviders(
      <HelpDrawer open onOpenChange={() => {}} order={order} />,
    );
    // The dispute row is the in-app entry point. The button at the bottom of
    // the list is Telegram and always has been since the two channels were
    // split, so clicking that one would leave the drawer on the list and this
    // test would prove nothing.
    screen.getByText("Dispute raised").click();

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

    // The in-app chat page opened, so the Telegram fallback must not have
    // fired alongside it.
    expect(open).not.toHaveBeenCalled();

    mockActiveAccount(undefined);
    rerender(<HelpDrawer open onOpenChange={() => {}} order={order} />);

    await waitFor(() => {
      expect(screen.getByText("Help & Support")).toBeInTheDocument();
    });
  });

  it("shows the dispute chat row on the list once the gate is open", () => {
    // The only test of the wiring in index.tsx,
    // onOpenDisputeChat={canChatInApp ? handleOpenDisputeChat : undefined}.
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

  it("offers both channels at once when the gate is open", () => {
    // The invariant of the split: on a disputed order with the bridge
    // configured the user sees the in-app row AND the Telegram button, and
    // picks. Previously one control served both and the gate decided, so a
    // failed in-app sign-in left no visible route to support from here.
    vi.stubEnv("VITE_SUPPORT_BRIDGE_URL", "https://bridge.test");
    mockActiveAccount({
      address: "0x1111111111111111111111111111111111111111",
      signMessage: async () => "0xsignature",
    });
    const open = vi.spyOn(window, "open").mockReturnValue(null);

    renderWithProviders(
      <HelpDrawer open onOpenChange={vi.fn()} order={makeDisputedOrder()} />,
    );

    expect(screen.getByText("Dispute raised")).toBeInTheDocument();
    expect(screen.getByText("Chat on Telegram")).toBeInTheDocument();

    // And Telegram still goes to Telegram, rather than being swallowed by the
    // in-app route the way it was when one handler served both.
    screen.getByText("Chat on Telegram").click();
    expect(open).toHaveBeenCalledTimes(1);
  });

  it("keeps the in-app chat shut when the wallet reports no chain", () => {
    // The chain id is bound into the bridge sign-in message and picks the
    // chain the bridge runs ERC-1271 verification on, so an unresolved chain
    // must mean Telegram rather than a sign-in claiming a chain the wallet
    // may not be on. The gate requires a resolved chain for that reason, and
    // there is no fallback to the configured one.
    //
    // Asserted through the absent dispute chat row rather than through a
    // Telegram call. The Telegram button is unconditional now, so clicking it
    // proves nothing about the gate; the row's absence is what proves it.
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

    expect(screen.queryByText("Dispute raised")).not.toBeInTheDocument();

    // ...and the user is still not stranded.
    screen.getByText("Chat on Telegram").click();
    expect(open).toHaveBeenCalledTimes(1);
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("keeps Telegram working when no bridge url is set", () => {
    mockActiveAccount({
      address: "0x1111111111111111111111111111111111111111",
      signMessage: async () => "0xsignature",
    });
    const open = vi.spyOn(window, "open").mockReturnValue(null);
    renderWithProviders(
      <HelpDrawer open onOpenChange={vi.fn()} order={makeDisputedOrder()} />,
    );
    expect(screen.queryByText("Dispute raised")).not.toBeInTheDocument();
    expect(screen.getByText("Raise a Dispute")).toBeInTheDocument();
    screen.getByText("Chat on Telegram").click();
    expect(open).toHaveBeenCalledTimes(1);
  });

  it("keeps the chat row off the list for an undisputed order even with a bridge url", () => {
    // The bridge url and wallet alone are not enough to open in-app chat.
    // Without an actual dispute, hasDispute must keep the gate shut and the
    // list must keep its ordinary "Raise a Dispute" row instead of the
    // dispute chat row.
    vi.stubEnv("VITE_SUPPORT_BRIDGE_URL", "https://bridge.test");
    mockActiveAccount({
      address: "0x1111111111111111111111111111111111111111",
      signMessage: async () => "0xsignature",
    });
    const open = vi.spyOn(window, "open").mockReturnValue(null);

    renderWithProviders(
      <HelpDrawer open onOpenChange={vi.fn()} order={makeOrder()} />,
    );

    expect(screen.queryByText("Dispute raised")).not.toBeInTheDocument();
    expect(screen.getByText("Raise a Dispute")).toBeInTheDocument();

    screen.getByText("Chat on Telegram").click();
    expect(open).toHaveBeenCalledTimes(1);
  });
});
