import {
  AlertTriangle,
  ArrowLeftCircle,
  ChevronRight,
  Copy,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { QRCodeSVG } from "qrcode.react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import { toast } from "sonner";
import ASSETS from "@/assets";
import { SupportedNetworksMarquee } from "@/components/supported-networks-marquee";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { useThirdweb } from "@/hooks";
import { analytics, EVENTS } from "@/lib/analytics";
import { INTERNAL_HREFS } from "@/lib/constants";

function DirectOrCross({ onReceiveUSDC }: { onReceiveUSDC: () => void }) {
  const { t } = useTranslation();
  return (
    <motion.div
      initial={{ x: 0, opacity: 1 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: "-100%", opacity: 0 }}
      transition={{ duration: 0.2, ease: "easeInOut" }}
      layout>
      <DrawerHeader>
        <DrawerTitle>{t("DEPOSIT")}</DrawerTitle>
        <DrawerDescription>
          {t("RECEIVE_FUNDS_TO_YOUR_P2P_ME_WALLET")}
        </DrawerDescription>
      </DrawerHeader>
      <section className="flex flex-col gap-4 px-4">
        <Card className="cursor-pointer shadow-none" onClick={onReceiveUSDC}>
          <CardContent className="flex items-center justify-between">
            <div className="flex w-[90%] items-start gap-4">
              <div className="flex items-center justify-center rounded-lg bg-primary/20 p-2">
                <ASSETS.ICONS.DepositDirect className="size-6 text-primary" />
              </div>
              <div className="flex flex-col">
                <p className="font-medium">{t("DEPOSIT_BASE_USDC")}</p>
                <p className="text-muted-foreground text-sm">
                  {t("DEPOSIT_USDC_ON_BASE_TO_YOUR_P2P_ME_WALLET")}
                </p>
              </div>
            </div>
            <ChevronRight className="size-6" />
          </CardContent>
        </Card>
        <Link
          to={`${INTERNAL_HREFS.BRIDGE}?mode=deposit`}
          className="cursor-pointer">
          <Card className="gap-0 shadow-none">
            <CardContent className="flex items-center justify-between gap-4">
              <div className="flex min-w-0 flex-1 items-start gap-4">
                <div className="flex items-center justify-center rounded-lg bg-primary/20 p-2">
                  <ASSETS.ICONS.DepositCross className="size-6 text-primary" />
                </div>
                <div className="flex min-w-0 flex-1 flex-col">
                  <p className="font-medium">
                    {t("DEPOSIT_FROM_OTHER_CHAINS")}
                  </p>
                  <p className="text-muted-foreground text-sm">
                    {t("DEPOSIT_USDC_TO_BASE_FROM_SUPPORTED_CHAINS")}
                  </p>
                  <div className="mt-2 flex min-w-0 flex-col items-start gap-1">
                    <p className="text-muted-foreground text-sm">
                      {t("SUPPORTED_NETWORKS")}
                    </p>
                    <SupportedNetworksMarquee />
                  </div>
                </div>
              </div>
              <ChevronRight className="size-6" />
            </CardContent>
          </Card>
        </Link>
      </section>
    </motion.div>
  );
}

function DirectDeposit({ onBack }: { onBack: () => void }) {
  const { t } = useTranslation();
  const { account } = useThirdweb();

  const address = account?.address ?? "";

  const handleAddressCopy = () => {
    if (address) {
      navigator.clipboard.writeText(address);
      toast.success(t("ADDRESS_COPIED_TO_CLIPBOARD"));
      analytics.track(EVENTS.FEATURE, {
        status: "deposit_address_copied",
        location: "deposit_drawer",
      });
    } else {
      toast.error(t("NO_ADDRESS_TO_COPY"));
    }
  };

  return (
    <motion.div
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
          <DrawerTitle>{t("DEPOSIT_USDC")}</DrawerTitle>
          <div className="w-6" />
        </div>
        <DrawerDescription className="hidden">
          {t("DEPOSIT_USDC_ON_BASE_TO_YOUR_P2P_ME_WALLET")}
        </DrawerDescription>
      </DrawerHeader>
      <section className="flex flex-col gap-4 px-4 pb-4">
        <Alert variant="warning" className="w-full border-2 py-3">
          <AlertTriangle className="size-5" />
          <AlertDescription className="flex w-full flex-col gap-1 text-sm">
            <p className="font-semibold text-foreground">
              {t("THIS_ADDRESS_IS_FOR_RECEIVING_USDC_ON_THE_BASE_NETWORK_ONLY")}
            </p>
            <p className="text-foreground/80">
              {t("PAYF_DEPOSIT_BASE_ONLY_WARNING")}
            </p>
          </AlertDescription>
        </Alert>
        {address ? (
          <div className="flex flex-col items-center space-y-6">
            <div className="rounded-xl border-2 border-primary bg-white p-4 shadow-primary-shadow shadow-xl">
              <QRCodeSVG value={address} size={200} level="L" />
            </div>
            <div className="flex w-full flex-col items-center gap-4">
              <p className="text-muted-foreground text-sm">
                {t("YOUR_BASE_ADDRESS")}
              </p>
              <div className="flex w-full items-center justify-between gap-2 rounded-lg bg-primary/10 p-2 px-4 text-sm">
                <p className="min-w-0 break-all font-mono text-foreground">
                  {address}
                </p>
                <Button
                  variant="outline"
                  size="icon"
                  className="shrink-0 border-none"
                  aria-label={t("PAYF_COPY_ADDRESS")}
                  onClick={handleAddressCopy}>
                  <Copy className="size-4" />
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex w-full items-center justify-center">
            <p className="text-destructive text-sm">
              {t("NO_ADDRESS_TO_DEPOSIT")}
            </p>
          </div>
        )}
      </section>
    </motion.div>
  );
}

export function DepositDrawer({
  children,
  triggerAsChild = false,
}: {
  children: React.ReactNode;
  /** Render `children` as the trigger itself (e.g. when it is a Button). */
  triggerAsChild?: boolean;
}) {
  const { t } = useTranslation();
  const [page, setPage] = useState<"directOrCross" | "directDeposit">(
    "directOrCross",
  );

  const handleReceiveUSDC = () => setPage("directDeposit");
  const handleBack = () => setPage("directOrCross");

  return (
    <Drawer autoFocus={true} onClose={() => setPage("directOrCross")}>
      <DrawerTrigger asChild={triggerAsChild}>{children}</DrawerTrigger>
      <DrawerContent>
        {/* Scroll inside the 80dvh drawer; keep the footer visible. */}
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
          <AnimatePresence mode="wait" initial={false}>
            {page === "directOrCross" && (
              <DirectOrCross
                key="direct-or-cross"
                onReceiveUSDC={handleReceiveUSDC}
              />
            )}
            {page === "directDeposit" && (
              <DirectDeposit key="direct-deposit" onBack={handleBack} />
            )}
          </AnimatePresence>
        </div>
        <DrawerFooter className="shrink-0">
          <DrawerClose className="w-full cursor-pointer rounded-lg bg-primary p-4 text-primary-foreground">
            {t("CLOSE")}
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
