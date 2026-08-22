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
    onChatWithUs: noop,
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
