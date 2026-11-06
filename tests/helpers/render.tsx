import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { type RenderResult, render } from "@testing-library/react";
import type { ReactElement, ReactNode } from "react";
import { MemoryRouter } from "react-router";
import { Drawer, DrawerContent } from "@/components/ui/drawer";

export interface RenderWithProvidersOptions {
  /** Initial history entry for the MemoryRouter. Defaults to "/". */
  route?: string;
  /**
   * Wrap the tree in an open vaul Drawer root. Needed only for a component
   * that renders DrawerClose, DrawerTitle or DrawerDescription on its own,
   * without a Drawer of its own.
   */
  withDrawer?: boolean;
}

/**
 * Renders a component with the providers the order help drawer needs.
 *
 * Returns the plain testing-library RenderResult, so rerender keeps the same
 * wrapper and a test can change a mock between renders.
 *
 * A test file that renders HelpDrawer also has to stub the one hook that
 * reaches the wallet. useRaiseDispute calls useThirdweb, which calls
 * useAutoConnect, useConnectModal and useWalletDetailsModal from
 * thirdweb/react plus useFraudEngine from the SDK, and every one of those
 * throws by name without its provider. Stubbing this single hook drops the
 * ThirdwebProvider and SdkProvider requirements together and leaves the
 * router and the query client above as the whole wrapper.
 *
 * Paste this into the test file, below its own import block. Vitest hoists a
 * vi.mock above the imports of the file that contains it, so writing it in
 * the test file works whatever order biome puts the imports in. Do not move
 * it into a shared module: a vi.mock only reaches modules imported after it
 * runs, and from a shared module that depends on import order.
 *
 *     type RaiseDisputeOptions = {
 *       onError?: (error: Error, variables: unknown) => void;
 *       onSuccess?: (data: unknown, variables: unknown) => void;
 *     };
 *
 *     vi.mock("@/hooks/use-raise-dispute", () => ({
 *       useRaiseDispute: () => ({
 *         raiseDisputeMutation: {
 *           isPending: false,
 *           mutateAsync: vi.fn(
 *             async (variables: unknown, options?: RaiseDisputeOptions) => {
 *               options?.onSuccess?.(undefined, variables);
 *               return undefined;
 *             },
 *           ),
 *         },
 *       }),
 *     }));
 *
 * The stub forwards to onSuccess because HelpDrawer fires both of its toasts
 * from the callbacks it passes to mutateAsync, so a stub that ignores its
 * second argument makes the success and error paths untestable. A test of
 * the error path swaps the onSuccess line for an onError one.
 */
export function renderWithProviders(
  ui: ReactElement,
  options: RenderWithProvidersOptions = {},
): RenderResult {
  const { route = "/", withDrawer = false } = options;

  const queryClient = new QueryClient({
    defaultOptions: {
      mutations: { retry: false },
      queries: { retry: false },
    },
  });

  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={[route]}>
          {withDrawer ? (
            <Drawer open>
              <DrawerContent>{children}</DrawerContent>
            </Drawer>
          ) : (
            children
          )}
        </MemoryRouter>
      </QueryClientProvider>
    );
  }

  return render(ui, { wrapper: Wrapper });
}
