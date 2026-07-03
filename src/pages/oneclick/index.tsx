import { ExternalLinkIcon } from "lucide-react";
import { useMemo } from "react";
import { NonHomeHeader } from "@/components";
import { Skeleton } from "@/components/ui/skeleton";
import {
  BASE_USDC_ASSET_ID,
  ONECLICK_EXPLORER_URL,
} from "@/core/near-intents";
import { useThirdweb } from "@/hooks";
import { useOneClickTokens, usePendingBridges } from "@/hooks/use-oneclick";
import { BridgeCard } from "./bridge-card";
import { SwapForm } from "./swap-form";

const EXPLORER_STATUSES = [
  "FAILED",
  "INCOMPLETE_DEPOSIT",
  "PENDING_DEPOSIT",
  "PROCESSING",
  "REFUNDED",
  "SUCCESS",
];

function getExplorerHistoryUrl(address: string): string {
  const statusParams = EXPLORER_STATUSES.map(
    (status) => `status=${status}`,
  ).join("&");
  return `${ONECLICK_EXPLORER_URL}/?search=${encodeURIComponent(address)}&${statusParams}`;
}

/**
 * POC: raw NEAR Intents 1Click API bridge (quote → deposit address → status),
 * per nearintent.md. Base USDC is the hub asset on both flows.
 */
export function OneClick() {
  const { account } = useThirdweb();
  const { tokens, isLoading, error } = useOneClickTokens();
  const { bridges, addBridge } = usePendingBridges(account?.address);

  // The hub asset itself isn't a valid counter-asset
  const selectableTokens = useMemo(
    () => tokens.filter((token) => token.assetId !== BASE_USDC_ASSET_ID),
    [tokens],
  );

  return (
    <>
      <NonHomeHeader title="BRIDGE" />
      <main className="no-scrollbar container-narrow flex h-full w-full flex-col gap-6 overflow-y-auto py-8">
        {!account ? (
          <p className="text-muted-foreground text-sm">
            Connect your wallet to use the bridge.
          </p>
        ) : isLoading ? (
          <Skeleton className="h-64 w-full" />
        ) : error ? (
          <p className="text-destructive text-sm">
            Failed to load supported assets: {error.message}
          </p>
        ) : (
          <SwapForm
            account={account}
            tokens={selectableTokens}
            onBridgeCreated={addBridge}
          />
        )}

        {account && (
          <p className="text-center text-muted-foreground text-sm">
            To see your full swap history, visit the{" "}
            <a
              href={getExplorerHistoryUrl(account.address)}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-primary underline"
            >
              NEAR Intents explorer
              <ExternalLinkIcon className="size-3.5" />
            </a>
          </p>
        )}

        {bridges.length > 0 && (
          <section className="flex flex-col gap-3 mt-6">
            <div className="flex flex-col gap-1">
            <h2 className="font-medium text-lg">Bridge History</h2>
            <p className="text-muted-foreground text-sm">
              Recent bridges stored on this device. For your complete history,
              visit the NEAR Intents explorer.
            </p>
            </div>
            {bridges.map((bridge) => (
              <BridgeCard key={bridge.depositAddress} bridge={bridge} />
            ))}
          </section>
        )}
      </main>
    </>
  );
}
