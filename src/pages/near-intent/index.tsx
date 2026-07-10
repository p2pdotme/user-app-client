import { ExternalLinkIcon } from "lucide-react";
import { useMemo } from "react";
import { Trans, useTranslation } from "react-i18next";
import { useSearchParams } from "react-router";
import { NonHomeHeader } from "@/components";
import { Skeleton } from "@/components/ui/skeleton";
import {
  BASE_USDC_ASSET_ID,
  ONECLICK_EXPLORER_URL,
  UNSUPPORTED_CHAINS,
} from "@/core/near-intents";
import { useThirdweb } from "@/hooks";
import { useOneClickTokens, usePendingBridges } from "@/hooks/use-oneclick";
import { BridgeHistoryCard } from "./bridge-history-card";
import { SwapForm } from "./swap-form";

const EXPLORER_STATUSES = [
  "FAILED",
  "INCOMPLETE_DEPOSIT",
  "PENDING_DEPOSIT",
  "PROCESSING",
  "REFUNDED",
  "SUCCESS",
];

/** Skeleton mirroring the swap form layout while tokens load. */
function SwapFormShimmer() {
  return (
    <div className="flex flex-col gap-5 rounded-xl border p-4">
      <div className="flex flex-col gap-3">
        <Skeleton className="h-5 w-16" />
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Skeleton className="size-10 rounded-full" />
            <div className="flex flex-col gap-1">
              <Skeleton className="h-4 w-14" />
              <Skeleton className="h-3 w-10" />
            </div>
          </div>
          <Skeleton className="h-14 w-48 rounded-xl" />
        </div>
      </div>
      <div className="relative flex items-center justify-center">
        <Skeleton className="size-11 rounded-xl" />
      </div>
      <div className="flex flex-col gap-3">
        <Skeleton className="h-5 w-10" />
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Skeleton className="size-10 rounded-full" />
            <div className="flex flex-col gap-1">
              <Skeleton className="h-4 w-14" />
              <Skeleton className="h-3 w-10" />
            </div>
          </div>
          <Skeleton className="h-9 w-24" />
        </div>
        <Skeleton className="h-5 w-20" />
        <Skeleton className="h-12 w-full rounded-xl" />
      </div>
      <div className="flex items-center justify-between pt-2">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-8 w-20 rounded-lg" />
      </div>
      <Skeleton className="h-14 w-full rounded-xl" />
    </div>
  );
}

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
  const { t } = useTranslation();
  const { account } = useThirdweb();
  const { tokens, isLoading, error } = useOneClickTokens();
  const { bridges, addBridge } = usePendingBridges(account?.address);
  const [searchParams] = useSearchParams();
  const mode = searchParams.get("mode");
  const title =
    mode === "deposit"
      ? t("DEPOSIT")
      : mode === "withdraw"
        ? t("WITHDRAW")
        : t("BRIDGE");

  // The hub asset itself isn't a valid counter-asset, and chains 1Click can't
  // bridge yet are hidden so the pickers only show usable options.
  const selectableTokens = useMemo(
    () =>
      tokens.filter(
        (token) =>
          token.assetId !== BASE_USDC_ASSET_ID &&
          !UNSUPPORTED_CHAINS.has(token.blockchain),
      ),
    [tokens],
  );

  return (
    <>
      <NonHomeHeader title={title} />
      <main className="no-scrollbar container-narrow flex h-full w-full flex-col gap-6 overflow-y-auto py-8">
        {!account ? (
          <p className="text-muted-foreground text-sm text-center">
            {t("BRIDGE_CONNECT_WALLET")}
          </p>
        ) : isLoading ? (
          <SwapFormShimmer />
        ) : error ? (
          <p className="text-destructive text-sm">
            {t("BRIDGE_LOAD_ASSETS_FAILED", { message: error.message })}
          </p>
        ) : (
          <SwapForm
            account={account}
            tokens={selectableTokens}
            onBridgeCreated={addBridge}
            initialDirection={mode === "deposit" ? "deposit" : "withdraw"}
          />
        )}

        {account && (
          <p className="text-center text-muted-foreground text-sm">
            <Trans i18nKey="BRIDGE_SWAP_HISTORY_PROMPT">
              <a
                href={getExplorerHistoryUrl(account.address)}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-primary underline"
              >
                NEAR Intents explorer
                <ExternalLinkIcon className="size-3.5" />
              </a>
            </Trans>
          </p>
        )}

        {bridges.length > 0 && (
          <section className="flex flex-col gap-3 mt-6">
            <div className="flex flex-col gap-1">
            <h2 className="font-medium text-lg">{t("BRIDGE_HISTORY_TITLE")}</h2>
            <p className="text-muted-foreground text-sm">
              {t("BRIDGE_HISTORY_DESCRIPTION")}
            </p>
            </div>
            {bridges.map((bridge) => (
              <BridgeHistoryCard key={bridge.depositAddress} bridge={bridge} />
            ))}
          </section>
        )}
      </main>
    </>
  );
}
