import { ArrowRight } from "lucide-react";
import { useTheme } from "next-themes";
import { useTranslation } from "react-i18next";
import ASSETS from "@/assets";
import CoinsMeLogoLightLogo from "@/assets/icons/coinsme-logo-light.svg";
import { BannerItem } from "@/components";
import { useAnalytics } from "@/hooks";
import { EVENTS } from "@/lib/analytics";

export function CoinsMeBanner() {
  const { track } = useAnalytics();
  const { theme } = useTheme();
  const { t } = useTranslation();

  const handleBannerClick = () => {
    track(EVENTS.FEATURE, {
      status: "banner_clicked",
      bannerName: "coinsme_swap",
      location: "help_section",
    });

    // Open CoinsMe in new tab
    window.open("https://app.coins.me", "_blank", "noopener,noreferrer");
  };

  return (
    <BannerItem
      bgImage={
        theme === "dark"
          ? ASSETS.IMAGES.COINSME_BANNER_DARK
          : ASSETS.IMAGES.COINSME_BANNER_LIGHT
      }
      bgColor="">
      <div
        className="relative flex h-full w-full justify-between gap-4 px-5 py-4"
        onClick={handleBannerClick}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            handleBannerClick();
          }
        }}>
        {/* Left Side - Text Content */}
        <div className="flex w-full flex-col justify-between gap-0.5">
          <div className="flex items-center justify-start">
            <img
              src={CoinsMeLogoLightLogo}
              alt={t("COINSME_BANNER_ALT")}
              className="h-[12px] object-contain"
            />
          </div>
          <div className="">
            <p className="max-w-[200px] font-medium text-[#91CFFF] text-sm leading-tight">
              {t("COINSME_BANNER_SAME_WALLET")}
            </p>
            <p className="max-w-[200px] font-medium text-[#91CFFF] text-sm leading-tight">
              {t("COINSME_BANNER_LIGHTNING_SWAPS")}{" "}
            </p>
            <p className="font-medium text-[#91CFFF] text-sm leading-tight">
              {t("COINSME_BANNER_ZERO_GAS_FEES")}
            </p>
          </div>
        </div>

        {/* Right Side - CTA Button */}
        <div className="flex h-[48px] flex-shrink-0 items-center justify-center gap-1 self-center rounded-md border-2 border-white bg-white/10 px-3 py-4 backdrop-blur-sm transition-all hover:bg-white/20">
          <span className="font-semibold text-md text-white">
            {t("COINSME_BANNER_SWAP_NOW")}
          </span>
          <ArrowRight className="size-6 text-white" />
        </div>
      </div>
    </BannerItem>
  );
}
