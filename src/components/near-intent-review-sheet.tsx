import { ArrowRightIcon, InfoIcon } from "lucide-react";
import { TokenIcon } from "@/components/token-icon";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";

type ReviewSide = {
  symbol: string;
  blockchain: string;
  iconUrl?: string;
  chainIconUrl?: string;
  amount: string;
  usd: string | null; // raw numeric string from the quote, e.g. "8.08"
};

function formatUsd(value: string | null): string | null {
  if (!value) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? `$${parsed.toFixed(2)}` : null;
}

type NearIntentReviewSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  from: ReviewSide;
  to: ReviewSide;
  slippageBps: number;
  pending: boolean;
  onConfirm: () => void;
};

/** Review Quote bottom sheet shown before executing the bridge. */
export function NearIntentReviewSheet({
  open,
  onOpenChange,
  from,
  to,
  slippageBps,
  pending,
  onConfirm,
}: NearIntentReviewSheetProps) {
  const maxLossUsd =
    to.usd !== null && Number.isFinite(Number(to.usd))
      ? new Intl.NumberFormat("en-US", {
          style: "currency",
          currency: "USD",
        }).format((Number(to.usd) * slippageBps) / 10_000)
      : null;

  const side = (data: ReviewSide, align: "left" | "right") => (
    <div
      className={`flex flex-col gap-3 ${align === "right" ? "items-end" : "items-start"}`}
    >
      <div
        className={`flex items-center gap-2 ${align === "right" ? "flex-row-reverse" : ""}`}
      >
        <TokenIcon
          symbol={data.symbol}
          iconUrl={data.iconUrl}
          chainIconUrl={data.chainIconUrl}
          className="size-10"
        />
        <span
          className={`flex flex-col leading-tight ${align === "right" ? "items-end" : ""}`}
        >
          <span className="font-semibold">{data.symbol}</span>
          <span className="text-muted-foreground text-xs capitalize">
            {data.blockchain}
          </span>
        </span>
      </div>
      <span
        className={`flex flex-col ${align === "right" ? "items-end" : ""}`}
      >
        <span className="font-semibold">{data.amount}</span>
        {formatUsd(data.usd) && (
          <span className="text-muted-foreground text-sm">
            {formatUsd(data.usd)}
          </span>
        )}
      </span>
    </div>
  );

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="pb-[env(safe-area-inset-bottom)]">
        <DrawerHeader>
          <DrawerTitle className="text-center text-2xl">
            Review Quote
          </DrawerTitle>
        </DrawerHeader>

        <div className="container-narrow flex flex-col gap-4 pb-8">
          {/* From → To card */}
          <div className="flex items-center justify-between gap-3 rounded-xl bg-muted p-4">
            {side(from, "left")}
            <span className="rounded-lg bg-background p-2.5">
              <ArrowRightIcon className="size-4" />
            </span>
            {side(to, "right")}
          </div>

          {/* Totals */}
          <div className="flex flex-col">
            <div className="flex items-start justify-between border-b py-3">
              <span className="text-muted-foreground">Total Amount</span>
              <span className="flex flex-col items-end">
                <span className="font-semibold">
                  {from.amount} {from.symbol}
                </span>
                {formatUsd(from.usd) && (
                  <span className="text-muted-foreground text-sm">
                    {formatUsd(from.usd)}
                  </span>
                )}
              </span>
            </div>
            <div className="flex items-center justify-between py-3">
              <span className="text-muted-foreground">Slippage</span>
              <span className="font-semibold">{slippageBps / 100}%</span>
            </div>
          </div>

          {maxLossUsd && (
            <div className="flex items-start gap-2 rounded-xl bg-muted p-3">
              <InfoIcon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
              <p className="text-muted-foreground text-sm">
                You could receive up to {maxLossUsd} less based on the{" "}
                {slippageBps / 100}% slippage you set.
              </p>
            </div>
          )}

          <Button
            className="mt-2 w-full p-6"
            disabled={pending}
            onClick={onConfirm}
          >
            {pending ? "Confirming…" : "Confirm"}
          </Button>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
