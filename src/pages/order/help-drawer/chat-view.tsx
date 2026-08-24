import {
  fromThirdwebAccount,
  themeToCssVars,
  UserSupportPanel,
} from "@p2pdotme/widgets/support";
import { ArrowLeftCircle } from "lucide-react";
import { motion } from "motion/react";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import type { Account } from "thirdweb/wallets";
import { Button } from "@/components/ui/button";
import {
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { SUPPORT_THEME } from "@/lib/support-theme";

interface ChatViewProps {
  orderId: string;
  /** Titles the panel to match the row that opened it. */
  isSettled: boolean;
  account: Account;
  chainId: number;
  bridgeUrl: string;
  onBack: () => void;
}

export function ChatView({
  orderId,
  isSettled,
  account,
  chainId,
  bridgeUrl,
  onBack,
}: ChatViewProps) {
  const { t } = useTranslation();

  // Built here rather than in a hook so that @p2pdotme/widgets/support is
  // imported by exactly one module, which is lazily loaded. A hook in
  // src/hooks would be re-exported through the barrel that auth-guard pulls
  // in, and the whole widget would land in the entry chunk again.
  //
  // No fallback chain id. The adapter throws rather than guess when it cannot
  // resolve one, and the caller already refuses to render this component
  // until the wallet reports a chain, so an unresolved chain means Telegram
  // rather than a sign-in message claiming a chain the wallet is not on.
  const signer = useMemo(
    () =>
      fromThirdwebAccount({
        address: account.address,
        getChain: () => ({ id: chainId }),
        signMessage: (args) => account.signMessage(args),
      }),
    [account, chainId],
  );

  return (
    <motion.div
      key="support-chat"
      initial={{ x: "100%", opacity: 0.5 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: "100%", opacity: 0.5 }}
      transition={{ duration: 0.2, ease: "easeInOut" }}
      layout
      className="w-full">
      <DrawerHeader className="w-full text-center">
        <div className="flex w-full items-center justify-between">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeftCircle className="size-6" />
          </Button>
          <div className="flex flex-col gap-2">
            <DrawerTitle className="flex-1">
              {isSettled
                ? t("DISPUTE_RESOLVED_CHAT_TITLE")
                : t("DISPUTE_RAISED_CHAT_TITLE")}
            </DrawerTitle>
            <DrawerDescription>
              {t("HELP_AND_SUPPORT_DESCRIPTION")}
            </DrawerDescription>
          </div>
          <div className="w-6" />
        </div>
      </DrawerHeader>

      <div
        className="h-[60svh] px-4 pb-2"
        style={themeToCssVars(SUPPORT_THEME)}>
        <UserSupportPanel
          orderId={orderId}
          signer={signer}
          bridgeUrl={bridgeUrl}
        />
      </div>
    </motion.div>
  );
}
