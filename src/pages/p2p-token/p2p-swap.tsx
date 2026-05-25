import { useTranslation } from "react-i18next";
import { NonHomeHeader } from "@/components";
import { P2PSwapMain } from "@/components/p2p-token";

export function P2PSwap() {
  const { t } = useTranslation();

  return (
    <>
      <NonHomeHeader title={t("P2P_SWAP")} />
      <main className="no-scrollbar container-narrow flex h-full w-full flex-col gap-2 overflow-y-auto py-8">
        <P2PSwapMain />
      </main>
    </>
  );
}
