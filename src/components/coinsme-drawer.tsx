import {
  ArrowUpRight,
  AtSign,
  CandlestickChart,
  ChartLine,
  Repeat,
  Wallet,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { Buy } from "@/assets/icons/buy";
import CoinsmeIconDark from "@/assets/icons/coinsme-icon-dark.svg";
import CoinsmeIconLight from "@/assets/icons/coinsme-icon-light.svg";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { useAnalytics } from "@/hooks";
import { EVENTS } from "@/lib/analytics";

const COINSME_URL = "https://app.coins.me";

interface CoinsmeDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CoinsmeDrawer({ isOpen, onClose }: CoinsmeDrawerProps) {
  const { t } = useTranslation();
  const { track } = useAnalytics();

  const features = [
    { Icon: Wallet, label: t("COINSME_DRAWER_FEATURE_WALLET") },
    { Icon: Buy, label: t("COINSME_DRAWER_FEATURE_FLOW") },
    { Icon: Repeat, label: t("COINSME_DRAWER_FEATURE_SIP") },
    { Icon: ChartLine, label: t("COINSME_DRAWER_FEATURE_TRACK") },
    { Icon: CandlestickChart, label: t("COINSME_DRAWER_FEATURE_STOCKS") },
    { Icon: AtSign, label: t("COINSME_DRAWER_FEATURE_USERNAME") },
  ];

  const handleExploreClick = () => {
    track(EVENTS.FEATURE, {
      status: "cta_clicked",
      bannerName: "coinsme_promo",
      location: "home_header_drawer",
    });
    window.open(COINSME_URL, "_blank", "noopener,noreferrer");
  };

  return (
    <Drawer open={isOpen} onOpenChange={onClose}>
      <DrawerContent autoFocus className="container-narrow mx-auto">
        <DrawerHeader className="items-center gap-1 pb-2 text-center">
          <img
            src={CoinsmeIconLight}
            alt="coins.me"
            className="size-14 rounded-2xl shadow-[#4D66F4]/25 shadow-lg dark:hidden"
          />
          <img
            src={CoinsmeIconDark}
            alt="coins.me"
            className="hidden size-14 rounded-2xl shadow-[#4D66F4]/25 shadow-lg dark:block"
          />
          <DrawerTitle className="pt-1 text-xl">
            {t("COINSME_DRAWER_TITLE")}
          </DrawerTitle>
          <DrawerDescription>{t("COINSME_DRAWER_SUBTITLE")}</DrawerDescription>
        </DrawerHeader>

        <ul className="flex flex-col gap-1 overflow-y-auto px-4">
          {features.map(({ Icon, label }) => (
            <li key={label} className="flex items-center gap-3 rounded-lg p-2">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#4D66F4]/10 text-[#4D66F4]">
                <Icon className="size-4" />
              </div>
              <p className="font-medium text-sm">{label}</p>
            </li>
          ))}
        </ul>

        <div className="p-4 pb-8">
          <Button
            onClick={handleExploreClick}
            className="h-12 w-full rounded-xl bg-[#4D66F4] font-semibold text-white transition-colors hover:bg-[#4D66F4]/90">
            {t("COINSME_DRAWER_CTA")}
            <ArrowUpRight className="size-4" />
          </Button>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
