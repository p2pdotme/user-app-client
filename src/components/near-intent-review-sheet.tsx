import { ArrowRightIcon, InfoIcon, TriangleAlertIcon } from "lucide-react";
import { useEffect, useId, useState } from "react";
import { useTranslation } from "react-i18next";
import { TokenIcon } from "@/components/token-icon";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Label } from "@/components/ui/label";
import { formatDisplayAmount } from "@/lib/utils";

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

/** External address the user typed; must be shown in full and confirmed. */
type AddressCheck = {
  label: string;
  address: string;
  chainName: string;
};

type NearIntentReviewSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  from: ReviewSide;
  to: ReviewSide;
  slippageBps: number;
  pending: boolean;
  onConfirm: () => void;
  addressCheck?: AddressCheck;
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
  addressCheck,
}: NearIntentReviewSheetProps) {
  const { t } = useTranslation();
  const checkboxId = useId();
  const [addressConfirmed, setAddressConfirmed] = useState(false);
  // Re-confirm every time the sheet opens or the address changes.
  // biome-ignore lint/correctness/useExhaustiveDependencies: reset trigger
  useEffect(() => {
    setAddressConfirmed(false);
  }, [open, addressCheck?.address]);
  const maxLossUsd =
    to.usd !== null && Number.isFinite(Number(to.usd))
      ? new Intl.NumberFormat("en-US", {
          style: "currency",
          currency: "USD",
        }).format((Number(to.usd) * slippageBps) / 10_000)
      : null;

  const side = (data: ReviewSide, align: "left" | "right") => (
    <div
      className={`flex min-w-0 flex-1 flex-col gap-3 ${align === "right" ? "items-end" : "items-start"}`}>
      <div
        className={`flex items-center gap-2 ${align === "right" ? "flex-row-reverse" : ""}`}>
        <TokenIcon
          symbol={data.symbol}
          iconUrl={data.iconUrl}
          chainIconUrl={data.chainIconUrl}
          className="size-10"
        />
        <span
          className={`flex flex-col leading-tight ${align === "right" ? "items-end" : ""}`}>
          <span className="font-semibold">{data.symbol}</span>
          <span className="text-muted-foreground text-xs capitalize">
            {data.blockchain}
          </span>
        </span>
      </div>
      <span
        className={`flex min-w-0 max-w-full flex-col ${align === "right" ? "items-end" : ""}`}>
        <span className="max-w-full truncate font-semibold" title={data.amount}>
          {formatDisplayAmount(data.amount)}
        </span>
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
            {t("BRIDGE_REVIEW_QUOTE")}
          </DrawerTitle>
        </DrawerHeader>

        {/* Scrolls inside the 80dvh drawer so the address check never pushes
            Confirm off-screen on short phones. */}
        <div className="container-narrow flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto overscroll-contain pb-4">
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
              <span className="text-muted-foreground">
                {t("BRIDGE_TOTAL_AMOUNT")}
              </span>
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
              <span className="text-muted-foreground">{t("SLIPPAGE")}</span>
              <span className="font-semibold">{slippageBps / 100}%</span>
            </div>
          </div>

          {addressCheck && (
            <div className="flex flex-col gap-3 rounded-xl border border-warning/50 bg-warning/10 p-4">
              <div className="flex flex-col gap-1">
                <span className="text-muted-foreground text-sm">
                  {addressCheck.label} · {addressCheck.chainName}
                </span>
                <code className="break-all font-mono text-sm">
                  {addressCheck.address}
                </code>
              </div>
              <p className="flex items-start gap-2 text-sm">
                <TriangleAlertIcon className="mt-0.5 size-4 shrink-0 text-warning" />
                {t("PAYF_BRIDGE_ADDRESS_IRREVERSIBLE_WARNING", {
                  chain: addressCheck.chainName,
                })}
              </p>
              <div className="flex items-start gap-3">
                <Checkbox
                  id={checkboxId}
                  checked={addressConfirmed}
                  onCheckedChange={(checked) =>
                    setAddressConfirmed(checked === true)
                  }
                  className="mt-0.5"
                />
                <Label
                  htmlFor={checkboxId}
                  className="font-medium text-sm leading-snug">
                  {t("PAYF_BRIDGE_ADDRESS_CONFIRM_CHECKBOX", {
                    chain: addressCheck.chainName,
                  })}
                </Label>
              </div>
            </div>
          )}

          {maxLossUsd && (
            <div className="flex items-start gap-2 rounded-xl bg-muted p-3">
              <InfoIcon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
              <p className="text-muted-foreground text-sm">
                {t("BRIDGE_SLIPPAGE_LOSS_INFO", {
                  maxLoss: maxLossUsd,
                  percent: slippageBps / 100,
                })}
              </p>
            </div>
          )}
        </div>

        <div className="container-narrow shrink-0 border-t pt-3 pb-6">
          <Button
            className="w-full p-6"
            disabled={pending || (!!addressCheck && !addressConfirmed)}
            onClick={onConfirm}>
            {pending ? t("BRIDGE_CONFIRMING") : t("CONFIRM")}
          </Button>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
