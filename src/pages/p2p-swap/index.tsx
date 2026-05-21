import { ExternalLink } from "lucide-react";
import { useTranslation } from "react-i18next";
import { NonHomeHeader } from "@/components";
import { P2PSwapMain } from "@/components/p2p-swap";
import { JUP_URL } from "@/components/tge-countdown-banner";

export function P2PSwap() {
  const { t } = useTranslation();

  return (
    <>
      <NonHomeHeader title={t("P2P_SWAP")} />
      <main className="no-scrollbar container-narrow flex h-full w-full flex-col gap-2 overflow-y-auto py-8">
        <P2PSwapMain />
        <a
          href={JUP_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-6 inline-flex items-center justify-center gap-1.5 self-center text-center text-muted-foreground text-xs underline-offset-4 transition-colors hover:text-foreground hover:underline"
        >
          {t("P2P_SWAP_JUPITER_FOOTER")}
          <ExternalLink className="size-3 shrink-0" />
        </a>
      </main>
    </>
  );
}
