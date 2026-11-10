/**
 * India tax report (crypto / VDA income tax on P2P.me orders).
 *
 * Self-contained module: the tax engine (core/), its hooks, in-memory settings
 * (contexts/) and screens (pages/) live under src/tax. The rest of the app
 * only mounts the screens below and links to them.
 */
import type { ReactNode } from "react";
import { Navigate } from "react-router";
import { useSettings } from "@/contexts/settings";
import { useThirdweb } from "@/hooks/use-thirdweb";
import { CURRENCY, INTERNAL_HREFS } from "@/lib/constants";
import { TaxSettingsProvider } from "@/tax/contexts";
import { Config } from "@/tax/pages/config";
import { Report } from "@/tax/pages/report";
import { Sources } from "@/tax/pages/sources";

/** The report follows Indian tax law, so it is offered to INR users only. */
export function useIsTaxAvailable(): boolean {
  const { settings } = useSettings();
  return settings.currency.currency === CURRENCY.INR;
}

function IndiaOnly({ children }: { children: ReactNode }) {
  const { isLoading } = useSettings();
  const available = useIsTaxAvailable();
  if (isLoading) return null;
  if (!available) return <Navigate to={INTERNAL_HREFS.HOME} replace />;
  return children;
}

/** The connected account, which owns the in-memory tax session. */
function useTaxOwner(): { address: string | undefined; owner: string } {
  const { account } = useThirdweb();
  return {
    address: account?.address,
    owner: account?.address.toLowerCase() ?? "",
  };
}

export function Tax() {
  const { address, owner } = useTaxOwner();
  return (
    <IndiaOnly>
      {/* Keyed by account: a different login starts from an empty session */}
      <TaxSettingsProvider key={owner} owner={owner}>
        <Report defaultWallet={address} />
      </TaxSettingsProvider>
    </IndiaOnly>
  );
}

export function TaxConfig() {
  const { owner } = useTaxOwner();
  return (
    <IndiaOnly>
      <TaxSettingsProvider key={owner} owner={owner}>
        <Config />
      </TaxSettingsProvider>
    </IndiaOnly>
  );
}

export function TaxSources() {
  return (
    <IndiaOnly>
      <Sources />
    </IndiaOnly>
  );
}
