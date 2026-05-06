import { useTranslation } from "react-i18next";
import { NonHomeHeader } from "@/components";
import { P2pBridge as P2pBridgeWidget } from "@/components/p2p-bridge";
import { ConnectSourceWallet } from "./connect-source-wallet";

export function P2pBridge() {
  const { t } = useTranslation();

  return (
    <>
      <NonHomeHeader title={t("P2P_BRIDGE")} />
      <main className="no-scrollbar container-narrow flex h-full w-full flex-col gap-4 overflow-y-auto py-8">
        <ConnectSourceWallet />
        <P2pBridgeWidget />
      </main>
    </>
  );
}
