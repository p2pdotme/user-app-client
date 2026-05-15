import {
  DynamicConnectButton,
  DynamicWidget,
  type WalletOption,
} from "@dynamic-labs/sdk-react-core";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { TokenSolana } from "@/assets/icons/token-solana";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardTitle } from "@/components/ui/card";
import { useSafeDynamicContext } from "@/contexts";

function solanaOnly(wallets: WalletOption[]) {
  return wallets.filter((w) =>
    (
      w.walletConnector as unknown as { supportedChains?: string[] }
    ).supportedChains?.includes("SOL"),
  );
}

export function ConnectSourceWallet() {
  const { t } = useTranslation();
  const { isAvailable, primaryWallet, setWalletsFilter } =
    useSafeDynamicContext();

  // Apply Solana-only filter while this component is mounted, reset on unmount
  useEffect(() => {
    setWalletsFilter(solanaOnly);
    return () => setWalletsFilter(undefined);
  }, [setWalletsFilter]);

  if (!primaryWallet?.isConnected) {
    return (
      <section className="flex w-full flex-col gap-4 py-2">
        <Card className="border-none bg-primary/10 shadow-none">
          <div className="-translate-x-2 -translate-y-3 flex items-center gap-2">
            <CardTitle className="flex w-fit items-center gap-1 rounded-sm bg-primary/30 px-2 py-1 font-medium text-xs">
              <TokenSolana className="size-4" />
              Solana
            </CardTitle>
          </div>
          <CardContent className="flex flex-col gap-2">
            <p className="text-center">{t("CONNECT_YOUR_SOLANA_WALLET")}</p>
          </CardContent>
          <CardFooter>
            {isAvailable ? (
              <DynamicConnectButton
                buttonClassName="w-full bg-primary text-primary-foreground rounded-md p-2 cursor-pointer"
                buttonContainerClassName="w-full">
                <p className="w-full text-center text-sm">
                  {t("CONNECT_WALLET")}
                </p>
              </DynamicConnectButton>
            ) : (
              <Button disabled className="w-full">
                {t("CONNECT_WALLET")}
              </Button>
            )}
          </CardFooter>
        </Card>
      </section>
    );
  }

  if (!isAvailable) return null;

  return (
    <section className="flex items-center justify-end gap-4">
      <DynamicWidget />
    </section>
  );
}
