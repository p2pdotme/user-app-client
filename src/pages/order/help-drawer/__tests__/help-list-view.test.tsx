import { screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { makeOrder } from "@/test/factories";
import { renderWithProviders } from "@/test/render";
import { HelpListView } from "../help-list-view";

describe("HelpListView dispute row", () => {
  const noop = () => {};
  const base = {
    onRaiseDispute: noop,
    onBrowseHelpCenter: noop,
    onOrderTypeFAQs: noop,
    onChatOnTelegram: noop,
  };

  // HelpListView renders DrawerClose, DrawerTitle and DrawerDescription with
  // no Drawer of its own, and those are Radix Dialog primitives that throw
  // outside a Dialog context. withDrawer supplies the root.

  it("shows the raise row when no dispute exists", () => {
    // The handler is passed so this test can still tell DEFAULT apart from a
    // raised dispute. Without it showDisputeChatRow is false either way and
    // the test would pass even if DEFAULT started counting as a dispute.
    renderWithProviders(
      <HelpListView
        {...base}
        order={makeOrder()}
        disputeStatus="DEFAULT"
        onOpenDisputeChat={noop}
      />,
      { withDrawer: true },
    );
    expect(screen.getByText("Raise a Dispute")).toBeInTheDocument();
    expect(screen.queryByText("Dispute raised")).not.toBeInTheDocument();
  });

  it("notes on the raise row that support chat and details are available (BUY)", () => {
    // The note is not gated on the dispute window being open, so it shows in
    // the pre-raise waiting state too (this order is outside the window). A BUY
    // user paid fiat, so the note points at proof of payment.
    renderWithProviders(
      <HelpListView
        {...base}
        order={makeOrder()}
        disputeStatus="DEFAULT"
        onOpenDisputeChat={noop}
      />,
      { withDrawer: true },
    );
    expect(
      screen.getByText(
        /chat with our support team and share relevant details, like proof of payment/i,
      ),
    ).toBeInTheDocument();
  });

  it("shows BUY dispute copy on the ready raise row", () => {
    // A BUY/PAID order inside the window: the description is the BUY variant.
    renderWithProviders(
      <HelpListView
        {...base}
        order={makeOrder({
          placedTimestamp: String(Math.floor(Date.now() / 1000) - 3600),
        })}
        disputeStatus="DEFAULT"
        onOpenDisputeChat={noop}
      />,
      { withDrawer: true },
    );
    expect(
      screen.getByText(
        "Only raise a dispute if you paid but didn't receive your USDC.",
      ),
    ).toBeInTheDocument();
  });

  it("shows SELL/PAY dispute copy on the raise row (merchant pays fiat)", () => {
    // A SELL/COMPLETED order inside the window: description and note flip to the
    // merchant-pays-fiat wording — the user is owed the payment, not making one.
    renderWithProviders(
      <HelpListView
        {...base}
        order={makeOrder({
          orderType: "SELL",
          status: "COMPLETED",
          placedTimestamp: String(Math.floor(Date.now() / 1000) - 3600),
        })}
        disputeStatus="DEFAULT"
        onOpenDisputeChat={noop}
      />,
      { withDrawer: true },
    );
    expect(
      screen.getByText(
        "Only raise a dispute if you didn't receive the fiat payment.",
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        /chat with our support team and share relevant details, like your payment reference/i,
      ),
    ).toBeInTheDocument();
  });

  it("swaps in a chat row once a dispute is raised", () => {
    const onOpenDisputeChat = vi.fn();
    renderWithProviders(
      <HelpListView
        {...base}
        order={makeOrder()}
        disputeStatus="RAISED"
        onOpenDisputeChat={onOpenDisputeChat}
      />,
      { withDrawer: true },
    );
    expect(screen.queryByText("Raise a Dispute")).not.toBeInTheDocument();
    screen.getByText("Dispute raised").click();
    expect(onOpenDisputeChat).toHaveBeenCalledOnce();
  });

  // No test here for "both channels are offered at once". HelpListView never
  // conflated them: its bottom button has always rendered unconditionally and
  // always called its prop, so a test at this level only asserts the label
  // rename and passes against pre-split source. The conflation lived in
  // index.tsx's handler, so the invariant is tested there instead —
  // help-drawer.test.tsx, "offers both channels at once when the gate is open".

  it("labels a settled dispute as resolved", () => {
    renderWithProviders(
      <HelpListView
        {...base}
        order={makeOrder()}
        disputeStatus="SETTLED"
        onOpenDisputeChat={noop}
      />,
      { withDrawer: true },
    );
    expect(screen.getByText("Dispute resolved")).toBeInTheDocument();
  });

  it("falls back to the raise row when a dispute exists but the gate is shut", () => {
    // The regression this locks: writing the two row conditions separately
    // leaves a disputed order with no handler rendering neither row.
    renderWithProviders(
      <HelpListView {...base} order={makeOrder()} disputeStatus="RAISED" />,
      { withDrawer: true },
    );
    expect(screen.getByText("Raise a Dispute")).toBeInTheDocument();
    expect(screen.queryByText("Dispute raised")).not.toBeInTheDocument();
  });
});
