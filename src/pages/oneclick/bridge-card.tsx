import { ArrowRightIcon, ExternalLinkIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  ONECLICK_EXPLORER_URL,
  type PendingBridge,
} from "@/core/near-intents";
import {
  getChainIconUrl,
  useOneClickTokens,
  useTokenIcons,
} from "@/hooks/use-oneclick";
import { DepositSheet } from "./deposit-sheet";
import { TokenIcon } from "./token-selector";

const STATUS_LABELS: Record<string, string> = {
  PENDING_DEPOSIT: "Waiting for deposit",
  KNOWN_DEPOSIT_TX: "Deposit detected",
  PROCESSING: "Processing",
  SUCCESS: "Completed",
  INCOMPLETE_DEPOSIT: "Incomplete deposit",
  REFUNDED: "Refunded",
  FAILED: "Failed",
};

// On withdraw the app sends the USDC itself — no user action needed
const WITHDRAW_STATUS_LABELS: Record<string, string> = {
  ...STATUS_LABELS,
  PENDING_DEPOSIT: "Sending USDC…",
  KNOWN_DEPOSIT_TX: "USDC sent",
};

function statusVariant(
  status: string,
): "default" | "secondary" | "destructive" {
  if (status === "SUCCESS") return "default";
  if (["INCOMPLETE_DEPOSIT", "REFUNDED", "FAILED"].includes(status))
    return "destructive";
  return "secondary";
}

type BridgeCardProps = {
  bridge: PendingBridge;
};

/** One in-flight (or finished) 1Click bridge: status, deposit sheet, links. */
export function BridgeCard({ bridge }: BridgeCardProps) {
  // A deposit that never arrived within 30 min is treated as expired:
  // no deposit sheet, "Expired" badge.
  const expired =
    bridge.direction === "deposit" &&
    bridge.status === "PENDING_DEPOSIT" &&
    Date.now() - bridge.createdAt > 30 * 60_000;
  const awaitingDeposit =
    bridge.direction === "deposit" &&
    bridge.status === "PENDING_DEPOSIT" &&
    !expired;
  const [sheetOpen, setSheetOpen] = useState(false);

  const { tokens } = useOneClickTokens();
  const { getTokenIconUrl } = useTokenIcons(tokens);
  const originToken = tokens.find(
    (token) => token.assetId === bridge.originAsset,
  );
  const destinationToken = tokens.find(
    (token) => token.assetId === bridge.destinationAsset,
  );

  // Auto-open the sheet only for a just-created bridge (from "Get a quote"),
  // not for existing bridges restored on page load. Mounted closed then
  // opened in an effect so vaul runs its full open/close lifecycle
  // (starting with open=true leaves the page unclickable after closing).
  useEffect(() => {
    const justCreated = Date.now() - bridge.createdAt < 5_000;
    if (awaitingDeposit && justCreated) setSheetOpen(true);
    // biome-ignore lint/correctness/useExhaustiveDependencies: open once on mount
  }, []);

  return (
    <Card className="py-0">
      <CardContent
        className={`flex flex-col gap-3 p-4 ${awaitingDeposit ? "cursor-pointer" : ""}`}
        onClick={awaitingDeposit ? () => setSheetOpen(true) : undefined}
      >
        <div className="flex items-center gap-3">
          {/* Overlapping origin → destination token icons */}
          <span className="flex shrink-0 items-center">
            <TokenIcon
              symbol={bridge.originSymbol}
              iconUrl={originToken ? getTokenIconUrl(originToken) : undefined}
              chainIconUrl={
                originToken
                  ? getChainIconUrl(originToken.blockchain)
                  : undefined
              }
              className="size-9"
            />
            <TokenIcon
              symbol={bridge.destinationSymbol}
              iconUrl={
                destinationToken ? getTokenIconUrl(destinationToken) : undefined
              }
              chainIconUrl={
                destinationToken
                  ? getChainIconUrl(destinationToken.blockchain)
                  : undefined
              }
              className="-ml-3 size-9 rounded-full ring-2 ring-card"
            />
          </span>

          <span className="flex min-w-0 flex-1 flex-col leading-tight">
            <span className="font-semibold text-sm capitalize">
              {bridge.direction}
            </span>
            <span className="flex items-center gap-1 truncate text-muted-foreground text-xs">
              {bridge.amountInFormatted} {bridge.originSymbol}
              <ArrowRightIcon className="size-3 shrink-0" />~
              {bridge.amountOutFormatted} {bridge.destinationSymbol}
            </span>
          </span>

          <div className="flex shrink-0 items-center gap-1">
            <Badge variant={expired ? "destructive" : statusVariant(bridge.status)}>
              {expired
                ? "Expired"
                : ((bridge.direction === "withdraw"
                    ? WITHDRAW_STATUS_LABELS
                    : STATUS_LABELS)[bridge.status] ?? bridge.status)}
            </Badge>
          </div>
        </div>

        <div className="border-t pt-3">
          <a
            href={`${ONECLICK_EXPLORER_URL}/transactions/${bridge.depositAddress}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-primary text-xs underline"
            onClick={(e) => e.stopPropagation()}
          >
            View on NEAR Intents explorer
            <ExternalLinkIcon className="size-3" />
          </a>
        </div>
      </CardContent>

      {awaitingDeposit && (
        <DepositSheet
          bridge={bridge}
          open={sheetOpen}
          onOpenChange={setSheetOpen}
        />
      )}
    </Card>
  );
}
