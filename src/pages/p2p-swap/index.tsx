import { useTranslation } from "react-i18next";
import { NonHomeHeader } from "@/components";

export function P2PSwap() {
  const { t } = useTranslation();

  return (
    <>
      <NonHomeHeader title={t("P2P_TOKEN_SWAP")} showHelp />
      <main className="no-scrollbar container-narrow flex h-full w-full flex-col overflow-y-auto" />
    </>
  );
}
