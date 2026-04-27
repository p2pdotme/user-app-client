import {
  DynamicConnectButton,
  DynamicWidget,
} from "@dynamic-labs/sdk-react-core";
import { Monitor } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardTitle } from "@/components/ui/card";
import { useSafeDynamicContext } from "@/contexts";
import { bridgeMetaDeposit } from "@/core/rango";

interface ConnectSourceWalletProps {
  disabled?: boolean;
}

function DynamicConnector({ disabled }: { disabled?: boolean }) {
  const { t } = useTranslation();

  // Show disabled button when Dynamic is unavailable
  if (disabled) {
    return (
      <Button disabled className="w-full">
        {t("CONNECT_WALLET")}
      </Button>
    );
  }

  return (
    <DynamicConnectButton
      buttonClassName="w-full bg-primary text-primary-foreground rounded-md p-2 cursor-pointer"
      buttonContainerClassName="w-full">
      <p className="w-full text-center text-sm">{t("CONNECT_WALLET")}</p>
    </DynamicConnectButton>
  );
}

export function ConnectSourceWallet({ disabled }: ConnectSourceWalletProps) {
  const { t } = useTranslation();
  const { primaryWallet } = useSafeDynamicContext();

  if (!primaryWallet?.isConnected) {
    return (
      <section className="flex w-full flex-col gap-4 py-2">
        <Card className="border-none bg-primary/10 shadow-none">
          <div className="-translate-x-2 -translate-y-3 flex items-center gap-2">
            <CardTitle className="flex w-fit items-center gap-1 rounded-sm bg-primary/30 px-2 py-1 font-medium text-xs">
              <Monitor className="size-4" />
              {t("WORKS_ON_DEVICE_ONLY", {
                device: t("PC"),
              })}
            </CardTitle>
          </div>
          <CardContent className="flex flex-col gap-2">
            <p className="text-center">
              {t(
                "CONNECT_YOUR_SOURCE_WALLET_TO_DEPOSIT_FROM_SOLANA_AND_5_EVM_CHAINS",
              )}
            </p>
            <div className="flex items-center justify-center gap-4">
              {bridgeMetaDeposit.map((chain) => (
                <img
                  key={chain.name}
                  src={chain.logo}
                  alt={chain.name}
                  className="size-4"
                />
              ))}
            </div>
          </CardContent>
          <CardFooter>
            <DynamicConnector disabled={disabled} />
          </CardFooter>
        </Card>
      </section>
    );
  }

  // Don't show widget if Dynamic is unavailable
  if (disabled) {
    return null;
  }

  return (
    <section className="flex items-center justify-end gap-4">
      <DynamicWidget />
    </section>
  );
}
