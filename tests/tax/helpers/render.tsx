import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { type RenderResult, render } from "@testing-library/react";
import type { ReactElement, ReactNode } from "react";
import { MemoryRouter, Route, Routes } from "react-router";
import { Toaster } from "sonner";
import { vi } from "vitest";
import { TaxSettingsProvider } from "@/tax/contexts";
import { Config } from "@/tax/pages/config";

// The report screens are driven end to end with userEvent (typing, tabs,
// popovers), which takes several seconds a test on a busy machine.
vi.setConfig({ testTimeout: 30_000 });

export interface RenderWithProvidersOptions {
  /** Initial history entry for the MemoryRouter. Defaults to "/". */
  route?: string;
  /**
   * Wrap the tree in a TaxSettingsProvider. Turn off when rendering the real
   * entry components from "@/tax", which bring their own.
   */
  withSettings?: boolean;
}

/** Renders `ui` inside the providers the tax screens need. */
export function renderWithProviders(
  ui: ReactElement,
  options: RenderWithProvidersOptions = {},
): RenderResult {
  const { route = "/", withSettings = true } = options;
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={[route]}>
          <Toaster />
          {withSettings ? (
            <TaxSettingsProvider>{children}</TaxSettingsProvider>
          ) : (
            children
          )}
        </MemoryRouter>
      </QueryClientProvider>
    );
  }

  return render(ui, { wrapper: Wrapper });
}

/**
 * Renders the report at /tax next to the settings page at /tax/config, under
 * one settings provider, so a test can open Settings and come back.
 */
export function renderReport(report: ReactElement): RenderResult {
  return renderWithProviders(
    <Routes>
      <Route path="/tax" element={report} />
      <Route path="/tax/config" element={<Config />} />
    </Routes>,
    { route: "/tax" },
  );
}
