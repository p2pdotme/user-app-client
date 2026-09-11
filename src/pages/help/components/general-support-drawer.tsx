// General (order-less) human support, opened from the AI widget's "Talk to a
// human" action on the Help page. The AI is the front door; when it can't
// resolve a question the user escalates here to a real support thread — the
// same wallet session, no order required.
//
// Wiring: this drawer registers an open handler with `setSupportEscalateHandler`
// so the (non-React) AI-widget controller can trigger it via `onEscalate`.
// Mounts the widgets `GeneralSupportPanel`, which talks to the bridge
// `/tickets/*` routes and passes the user's currency as the routing hint so the
// right currency ops team sees the thread.

import {
  fromThirdwebAccount,
  GeneralSupportPanel,
  themeToCssVars,
} from "@p2pdotme/widgets/support";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useActiveAccount, useActiveWalletChain } from "thirdweb/react";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { useSettings } from "@/contexts";
import { getSupportBridgeUrl } from "@/lib/support-bridge";
import { setSupportEscalateHandler } from "@/lib/support-chat";
import { SUPPORT_THEME } from "@/lib/support-theme";

export function GeneralSupportDrawer() {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const account = useActiveAccount();
  const activeChain = useActiveWalletChain();
  const {
    settings: { currency },
  } = useSettings();
  const bridgeUrl = getSupportBridgeUrl();

  // Register (and clean up) the escalation target so the AI widget's "Talk to a
  // human" action opens this drawer.
  useEffect(() => {
    setSupportEscalateHandler(() => setOpen(true));
    return () => setSupportEscalateHandler(null);
  }, []);

  const signer = useMemo(() => {
    if (!account || !activeChain) return null;
    return fromThirdwebAccount({
      address: account.address,
      getChain: () => ({ id: activeChain.id }),
      signMessage: (args) => account.signMessage(args),
    });
  }, [account, activeChain]);

  const ready = Boolean(signer && bridgeUrl);

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerContent>
        <DrawerHeader className="text-center">
          <DrawerTitle>{t("GENERAL_SUPPORT_TITLE")}</DrawerTitle>
          <DrawerDescription>
            {t("GENERAL_SUPPORT_DESCRIPTION")}
          </DrawerDescription>
        </DrawerHeader>
        <div
          className="h-[60svh] px-4 pb-4"
          style={themeToCssVars(SUPPORT_THEME)}>
          {ready && signer && bridgeUrl ? (
            <GeneralSupportPanel
              signer={signer}
              bridgeUrl={bridgeUrl}
              currency={currency.currency}
            />
          ) : (
            <p className="pt-8 text-center text-muted-foreground text-sm">
              {t("GENERAL_SUPPORT_CONNECT_WALLET")}
            </p>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
}
