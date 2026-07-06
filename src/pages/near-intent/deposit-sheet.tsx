import { CopyIcon, TriangleAlertIcon } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { Trans, useTranslation } from "react-i18next";
import { toast } from "sonner";
import { TokenIcon } from "@/components/token-icon";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import type { PendingBridge } from "@/core/near-intents";
import {
  getChainIconUrl,
  useOneClickTokens,
  useTokenIcons,
} from "@/hooks/use-oneclick";

type DepositSheetProps = {
  bridge: PendingBridge;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

/**
 * Zashi-style deposit bottom sheet: amount + token icon, QR code, address,
 * copy/share actions and a wrong-asset warning.
 */
export function DepositSheet({ bridge, open, onOpenChange }: DepositSheetProps) {
  const { t } = useTranslation();
  const { tokens } = useOneClickTokens();
  const { getTokenIconUrl } = useTokenIcons(tokens);
  const token = tokens.find((item) => item.assetId === bridge.originAsset);

  const usdValue =
    token?.price && Number(bridge.amountInFormatted) > 0
      ? new Intl.NumberFormat("en-US", {
          style: "currency",
          currency: "USD",
        }).format(token.price * Number(bridge.amountInFormatted))
      : null;

  const copyAddress = async () => {
    await navigator.clipboard.writeText(bridge.depositAddress);
    toast.success(t("ADDRESS_COPIED"));
  };

  const copyAmount = async () => {
    await navigator.clipboard.writeText(bridge.amountInFormatted);
    toast.success(t("BRIDGE_AMOUNT_COPIED"));
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent
        className="h-[90vh] data-[vaul-drawer-direction=bottom]:max-h-[90vh]"
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DrawerHeader>
          <DrawerTitle className="flex items-center justify-center gap-1.5 text-center">
            {t("BRIDGE_DEPOSIT_AMOUNT")}
            <button
              type="button"
              aria-label={t("BRIDGE_COPY_AMOUNT")}
              onClick={copyAmount}
            >
              <CopyIcon className="size-4 text-muted-foreground" />
            </button>
          </DrawerTitle>
        </DrawerHeader>
        <div className="no-scrollbar container-narrow flex min-h-0 flex-1 flex-col items-center gap-4 overflow-y-auto pb-8">
          <button
            type="button"
            aria-label={t("BRIDGE_COPY_AMOUNT")}
            className="flex items-center gap-3"
            onClick={copyAmount}
          >
            <TokenIcon
              symbol={bridge.originSymbol}
              iconUrl={token ? getTokenIconUrl(token) : undefined}
              chainIconUrl={
                token ? getChainIconUrl(token.blockchain) : undefined
              }
            />
            <span className="font-bold text-4xl">
              {bridge.amountInFormatted}
            </span>
            {usdValue && (
              <span className="self-end pb-1 text-lg text-muted-foreground">
                ({usdValue})
              </span>
            )}
          </button>

          <div className="bg-white p-3 mt-4">
            <QRCodeSVG value={bridge.depositAddress} size={150} level="L" />
          </div>

          <button
            type="button"
            aria-label={t("BRIDGE_COPY_ADDRESS")}
            className="flex items-center gap-2 rounded-xl bg-muted px-4 py-2 transition-colors hover:bg-muted/80"
            onClick={copyAddress}
          >
            <code className="break-all text-center text-sm">
              {bridge.depositAddress}
            </code>

            <CopyIcon className="size-4 shrink-0 text-muted-foreground" />
          </button>
          {bridge.depositMemo && (
            <p className="text-sm">
              {t("BRIDGE_MEMO")}: <code>{bridge.depositMemo}</code>
            </p>
          )}

          <div className="flex w-full items-start gap-2 rounded-xl bg-yellow-500/10 p-3 mt-4">
            <TriangleAlertIcon className="mt-0.5 size-4 shrink-0 text-yellow-600 dark:text-yellow-500" />
            <p className="text-sm text-yellow-600 dark:text-yellow-500">
              <Trans
                i18nKey="BRIDGE_SEND_ONLY_WARNING"
                values={{
                  token: bridge.originSymbol,
                  network: token?.blockchain ?? "origin",
                }}
              >
                <span className="font-medium capitalize" />
              </Trans>
            </p>
          </div>
        </div>

        {/* Fixed footer */}
        <div className="container-narrow flex shrink-0 flex-col gap-3 pt-3 pb-6">
          <Button className="w-full p-6" onClick={() => onOpenChange(false)}>
            {t("BRIDGE_SENT_FUNDS")}
          </Button>
          <Button
            variant="outline"
            className="w-full p-6"
            onClick={() => onOpenChange(false)}
          >
            {t("CANCEL")}
          </Button>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
