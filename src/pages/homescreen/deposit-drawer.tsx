import {
  AlertTriangle,
  ArrowLeftCircle,
  ChevronRight,
  Copy,
  Monitor,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { QRCodeSVG } from "qrcode.react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import { toast } from "sonner";
import ASSETS from "@/assets";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
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
import { INTERNAL_HREFS } from "@/lib/constants";
import { truncateAddress } from "@/lib/utils";

const SUPPORTED_NETWORKS = [
  {
    name: "Solana",
    icon: ASSETS.ICONS.NetworkSolana,
  },
  {
    name: "Polygon",
    icon: ASSETS.ICONS.NetworkPolygon,
  },
  {
    name: "Arbitrum",
    icon: ASSETS.ICONS.NetworkArbitrum,
  },
  {
    name: "Ethereum",
    icon: ASSETS.ICONS.NetworkEthereum,
  },
  {
    name: "BSC",
    icon: ASSETS.ICONS.NetworkBsc,
  },
  {
    name: "Optimism",
    icon: ASSETS.ICONS.NetworkOptimism,
  },
];

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
        <Link to={INTERNAL_HREFS.DEPOSIT} className="cursor-pointer">
          <Card className="gap-0 shadow-none">
            <div className="-translate-x-2 -translate-y-3 flex items-center gap-2">
              <CardTitle className="flex w-fit items-center gap-1 rounded-sm bg-primary/30 px-2 py-1 font-medium text-xs">
                <Monitor className="size-4" />
                {t("WORKS_ON_DEVICE_ONLY", {
                  device: t("PC"),
                })}
              </CardTitle>
            </div>
            <CardContent className="flex items-center justify-between">
              <div className="flex w-[90%] items-start gap-4">
                <div className="flex items-center justify-center rounded-lg bg-primary/20 p-2">
                  <ASSETS.ICONS.DepositCross className="size-6 text-primary" />
                </div>
                <div className="flex flex-col">
                  <p className="font-medium">
                    {t("DEPOSIT_FROM_OTHER_CHAINS")}
                  </p>
                  <p className="text-muted-foreground text-sm">
                    {t("DEPOSIT_USDC_TO_BASE_FROM_SUPPORTED_CHAINS")}
                  </p>
                  <div className="mt-2 flex flex-col items-start gap-1">
                    <p className="text-muted-foreground text-sm">
                      {t("SUPPORTED_NETWORKS")}
                    </p>
                    <div className="flex items-center gap-1">
                      {SUPPORTED_NETWORKS.map((network) => (
                        <network.icon
                          key={network.name}
                          className="size-6 rounded-sm bg-muted"
                        />
                      ))}
                    </div>
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
        <Alert variant="warning" className="w-full py-2">
          <AlertTriangle className="size-4" />
          <AlertDescription className="flex w-full items-center justify-between text-xs">
            <p className="text-foreground">
              {t("THIS_ADDRESS_IS_FOR_RECEIVING_USDC_ON_THE_BASE_NETWORK_ONLY")}
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
                <p className="text-muted-foreground">
                  {truncateAddress(address, 16)}
                </p>
                <Button
                  variant="outline"
                  size="icon"
                  className="border-none"
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

export function DepositDrawer({ children }: { children: React.ReactNode }) {
  const { t } = useTranslation();
  const [page, setPage] = useState<"directOrCross" | "directDeposit">(
    "directOrCross",
  );

  const handleReceiveUSDC = () => setPage("directDeposit");
  const handleBack = () => setPage("directOrCross");

  return (
    <Drawer autoFocus={true} onClose={() => setPage("directOrCross")}>
      <DrawerTrigger>{children}</DrawerTrigger>
      <DrawerContent>
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
        <DrawerFooter>
          <DrawerClose className="w-full cursor-pointer rounded-lg bg-primary p-4 text-primary-foreground">
            {t("CLOSE")}
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
