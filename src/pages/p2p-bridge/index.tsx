import { useTranslation } from "react-i18next";
import { NonHomeHeader } from "@/components";
import { ConnectSourceWallet } from "./connect-source-wallet";

export function P2pBridge() {
  const { t } = useTranslation();

  return (
    <>
      <NonHomeHeader title={t("P2P_BRIDGE")} />
      <main className="no-scrollbar container-narrow flex h-full w-full flex-col gap-2 overflow-y-auto py-8">
        <ConnectSourceWallet />
      </main>
    </>
  );
}
