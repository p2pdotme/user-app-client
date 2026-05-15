import { useTranslation } from "react-i18next";
import { NonHomeHeader } from "@/components";
// import { P2pBridge as P2pBridgeWidget } from "@/components/p2p-bridge";
import { P2pSolBridge } from "@/components/p2p-sol-bridge";
import { SolSepoliaBridge } from "@/components/sol-sepolia-bridge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ConnectSourceWallet } from "./connect-source-wallet";

export function P2pBridge() {
  const { t } = useTranslation();

  return (
    <>
      <NonHomeHeader title={t("P2P_BRIDGE")} />
      <main className="no-scrollbar container-narrow flex h-full w-full flex-col gap-4 overflow-y-auto py-8">
        <ConnectSourceWallet />
        <Tabs defaultValue="sol-to-eth">
          <TabsList className="w-full">
            <TabsTrigger value="sol-to-eth" className="flex-1">
              Solana → Eth Sepolia
            </TabsTrigger>
            <TabsTrigger value="eth-to-sol" className="flex-1">
              Eth Sepolia → Solana
            </TabsTrigger>
          </TabsList>
          <TabsContent value="sol-to-eth">
            <P2pSolBridge />
          </TabsContent>
          <TabsContent value="eth-to-sol">
            <SolSepoliaBridge />
          </TabsContent>
        </Tabs>
      </main>
    </>
  );
}
