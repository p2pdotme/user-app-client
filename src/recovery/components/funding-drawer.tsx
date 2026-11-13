import { FuelIcon } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { RECOVERY_NETWORKS, type RecoveryNetworkKey } from "@/recovery/core";
import { CopyButton } from "./copy-button";

interface FundingDrawerProps {
  network: RecoveryNetworkKey;
  /** Address that needs native coin; the drawer is open while this is set. */
  fundingAddress: string | null;
  onClose: () => void;
  /** Re-runs the action that ran out of gas. */
  onRetry: () => void;
}

/**
 * Shown when nobody sponsored the network fee: the user has to send a little
 * of the network's native coin to the paying address, then retry.
 */
export function FundingDrawer({
  network,
  fundingAddress,
  onClose,
  onRetry,
}: FundingDrawerProps) {
  const { t } = useTranslation();
  const { label, chain } = RECOVERY_NETWORKS[network];
  const symbol = chain.nativeCurrency.symbol;

  return (
    <Drawer
      open={fundingAddress !== null}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      autoFocus>
      <DrawerContent>
        <div className="mx-auto flex w-full max-w-md flex-col">
          <DrawerHeader className="items-center text-center">
            <div className="rounded-full bg-warning/10 p-3">
              <FuelIcon className="size-6 text-warning" />
            </div>
            <DrawerTitle>{t("RECOVERY_GAS_TITLE", { symbol })}</DrawerTitle>
            <DrawerDescription>
              {t("RECOVERY_GAS_DESCRIPTION", { symbol, network: label })}
            </DrawerDescription>
          </DrawerHeader>
          {fundingAddress && (
            <div className="flex flex-col gap-2 px-4">
              <p className="text-muted-foreground text-sm">
                {t("RECOVERY_GAS_ADDRESS_LABEL", { symbol, network: label })}
              </p>
              <CopyButton
                value={fundingAddress}
                copiedMessage={t("ADDRESS_COPIED")}
                ariaLabel={t("RECOVERY_COPY_ADDRESS")}
              />
            </div>
          )}
          <DrawerFooter>
            <Button
              className="h-12 w-full"
              onClick={() => {
                onClose();
                onRetry();
              }}>
              {t("TRY_AGAIN")}
            </Button>
            <Button variant="ghost" className="h-12 w-full" onClick={onClose}>
              {t("CLOSE")}
            </Button>
          </DrawerFooter>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
