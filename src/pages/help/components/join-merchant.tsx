import { ArrowRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Logo } from "@/assets/icons/logo";
import { BannerItem } from "@/components";
import { useAnalytics, useRewardsConfig } from "@/hooks";
import { EVENTS } from "@/lib/analytics";

export function JoinMerchantBanner() {
  const { track } = useAnalytics();
  const { t } = useTranslation();
  const { rewardsConfig } = useRewardsConfig();

  const handleBannerClick = () => {
    track(EVENTS.FEATURE, {
      status: "banner_clicked",
      bannerName: "join_merchant",
      location: "help_section",
    });

    window.open(
      "https://linktr.ee/p2p.foundation",
      "_blank",
      "noopener,noreferrer",
    );
  };

  return (
    <BannerItem bgColor="bg-gradient-to-r from-black to-primary">
      {/* Diagonal scattered P2P logos with floating animation */}
      <style>{`
        @keyframes float-slow { 0%, 100% { transform: translate(0, 0) rotate(-20deg); } 50% { transform: translate(12px, -10px) rotate(-10deg); } }
        @keyframes float-mid { 0%, 100% { transform: translate(0, 0) rotate(15deg); } 50% { transform: translate(-10px, 8px) rotate(25deg); } }
        @keyframes float-fast { 0%, 100% { transform: translate(0, 0) rotate(30deg); } 50% { transform: translate(8px, 12px) rotate(40deg); } }
        @keyframes float-reverse { 0%, 100% { transform: translate(0, 0) rotate(-10deg); } 50% { transform: translate(-12px, -8px) rotate(-20deg); } }
        @keyframes float-drift { 0%, 100% { transform: translate(0, 0) rotate(45deg); } 50% { transform: translate(10px, -12px) rotate(55deg); } }
      `}</style>
      <div className="pointer-events-none absolute inset-0 overflow-hidden text-primary">
        <Logo
          className="-left-2 -top-3 absolute size-16 opacity-[0.1]"
          style={{ animation: "float-slow 4s ease-in-out infinite" }}
        />
        <Logo
          className="-bottom-2 absolute left-[22%] size-12 opacity-[0.12]"
          style={{ animation: "float-mid 3.5s ease-in-out infinite 0.3s" }}
        />
        <Logo
          className="-top-1 absolute right-[30%] size-10 opacity-[0.08]"
          style={{ animation: "float-fast 4.5s ease-in-out infinite 0.8s" }}
        />
        <Logo
          className="-bottom-3 absolute right-[8%] size-14 opacity-[0.1]"
          style={{ animation: "float-reverse 5s ease-in-out infinite 1.2s" }}
        />
        <Logo
          className="absolute top-1 left-[50%] size-8 opacity-[0.07]"
          style={{ animation: "float-drift 3.8s ease-in-out infinite 0.5s" }}
        />
      </div>

      {/* Gradient overlay for depth */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/20 via-transparent to-primary/10" />

      <div
        className="relative flex h-full w-full cursor-pointer items-center justify-between gap-4 px-5 py-4"
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
        <div className="flex flex-col justify-between gap-1.5">
          <div className="flex items-center gap-2">
            <Logo className="size-5 text-primary" />
            <h3 className="font-semibold text-base text-white leading-tight">
              {t("JOIN_MERCHANT_BANNER_TITLE")}
            </h3>
          </div>
          <p className="max-w-[220px] text-sm text-white/70 leading-snug">
            {t("JOIN_MERCHANT_BANNER_DESCRIPTION_PREFIX")}{" "}
            {rewardsConfig?.merchantRewardPercent ? (
              <span className="inline-flex items-center rounded-full bg-green-500/20 px-2 py-0.5 font-bold text-green-400">
                {rewardsConfig.merchantRewardPercent}%+
              </span>
            ) : (
              <span className="inline-block h-4 w-8 animate-pulse rounded-full bg-white/20" />
            )}{" "}
            {t("JOIN_MERCHANT_BANNER_DESCRIPTION_SUFFIX")}
          </p>
        </div>

        {/* Right Side - CTA Button */}
        <div className="flex h-10 flex-shrink-0 items-center gap-1.5 self-center rounded-lg border-2 border-white bg-white/10 px-4 backdrop-blur-sm transition-all hover:bg-white/20">
          <span className="whitespace-nowrap font-semibold text-sm text-white">
            {t("JOIN_MERCHANT_BANNER_CTA")}
          </span>
          <ArrowRight className="size-4 text-white" />
        </div>
      </div>
    </BannerItem>
  );
}
