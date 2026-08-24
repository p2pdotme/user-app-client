import { screen } from "@testing-library/react";
import { useActiveAccount, useActiveWalletChain } from "thirdweb/react";
import { describe, expect, it, vi } from "vitest";
import { useRaiseDispute } from "@/hooks/use-raise-dispute";
import { HelpDrawer } from "@/pages/order/help-drawer";
import { HelpListView } from "@/pages/order/help-drawer/help-list-view";
import { makeOrder } from "./factories";
import { renderWithProviders } from "./render";
import { mockActiveAccount, mockActiveWalletChain } from "./thirdweb";

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

function WalletProbe() {
  const account = useActiveAccount();
  const chain = useActiveWalletChain();
  return (
    <div>
      <span data-testid="address">{account?.address ?? "no account"}</span>
      <span data-testid="chain">{chain?.id ?? "no chain"}</span>
    </div>
  );
}

describe("renderWithProviders", () => {
  it("renders the real help drawer and its list", () => {
    renderWithProviders(
      <HelpDrawer open onOpenChange={() => {}} order={makeOrder()} />,
    );

    expect(screen.getByText("Help & Support")).toBeInTheDocument();
    expect(screen.getByText("Raise a Dispute")).toBeInTheDocument();
    expect(screen.getByText("Buy USDC FAQs")).toBeInTheDocument();
    expect(screen.getByText("Browse Help Center")).toBeInTheDocument();
  });

  it("renders the help list on its own with withDrawer", () => {
    renderWithProviders(
      <HelpListView
        onRaiseDispute={() => {}}
        onBrowseHelpCenter={() => {}}
        onOrderTypeFAQs={() => {}}
        onChatOnTelegram={() => {}}
      />,
      { withDrawer: true },
    );

    expect(screen.getByText("Help & Support")).toBeInTheDocument();
  });
});

describe("the use-raise-dispute stub", () => {
  it("forwards to the onSuccess the caller passes", async () => {
    const onSuccess = vi.fn();
    const { raiseDisputeMutation } = useRaiseDispute();

    await raiseDisputeMutation.mutateAsync(
      { orderId: 1234, redactTransId: 1n },
      { onSuccess },
    );

    expect(onSuccess).toHaveBeenCalledTimes(1);
  });
});

describe("thirdweb hook mocks", () => {
  it("starts every test with no account and chain 8453", () => {
    renderWithProviders(<WalletProbe />);

    expect(screen.getByTestId("address")).toHaveTextContent("no account");
    expect(screen.getByTestId("chain")).toHaveTextContent("8453");
  });

  it("can change the wallet between two renders of one test", () => {
    mockActiveAccount({
      address: "0x1111111111111111111111111111111111111111",
      signMessage: async () => "0xsignature",
    });
    mockActiveWalletChain({ id: 8453 });

    const { rerender } = renderWithProviders(<WalletProbe />);
    expect(screen.getByTestId("address")).toHaveTextContent(
      "0x1111111111111111111111111111111111111111",
    );
    expect(screen.getByTestId("chain")).toHaveTextContent("8453");

    mockActiveAccount(undefined);
    mockActiveWalletChain(undefined);
    rerender(<WalletProbe />);

    expect(screen.getByTestId("address")).toHaveTextContent("no account");
    expect(screen.getByTestId("chain")).toHaveTextContent("no chain");
  });

  it("does not inherit the previous test's cleared wallet", () => {
    renderWithProviders(<WalletProbe />);

    expect(screen.getByTestId("address")).toHaveTextContent("no account");
    expect(screen.getByTestId("chain")).toHaveTextContent("8453");
  });
});
