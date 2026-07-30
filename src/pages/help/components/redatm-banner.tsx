import { ArrowRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import { BannerItem } from "@/components";
import { useAnalytics } from "@/hooks";
import { EVENTS } from "@/lib/analytics";

const REDATM_MAPS_URL =
  "https://www.google.com/maps/d/u/0/viewer?mid=1buwzOAAf-8qQOHvmI8dWWdX8Zrd_vkE&femb=1&ll=-23.694766374574566%2C-57.67539219524978&z=4";

const REDATM_LOGO_URL =
  "https://www.red-atm.com.ar/assets/redatm_png_positivo.png";

const REDATM_BG_URL = "https://p2p-beneficios.vercel.app/red-atm-bg.webp";

export function RedAtmBanner() {
  const { track } = useAnalytics();
  const { t } = useTranslation();

  const handleBannerClick = () => {
    track(EVENTS.FEATURE, {
      status: "banner_clicked",
      bannerName: "redatm",
      location: "homescreen",
    });
    window.open(REDATM_MAPS_URL, "_blank", "noopener,noreferrer");
  };

  return (
    <BannerItem bgColor="bg-[#0B1F4A]">
      <style>{`
        @keyframes redatm-cta-shimmer {
          0%   { background-position: -120% 0; }
          100% { background-position: 220% 0;  }
        }
      `}</style>

      {/* Illustration background */}
      <img
        src={REDATM_BG_URL}
        alt=""
        aria-hidden
        className="pointer-events-none absolute inset-0 h-full w-full object-cover object-right"
      />

      {/* Blue wash so text stays readable over the photo */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-[#0B1F4A] via-[#0B1F4A]/90 to-[#0B1F4A]/45" />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#06122E]/70 via-transparent to-transparent" />

      <div
        className="relative flex h-full w-full cursor-pointer items-center justify-between gap-3 px-4 py-3"
        onClick={handleBannerClick}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            handleBannerClick();
          }
        }}>
        <div className="flex min-w-0 flex-1 flex-col justify-center gap-1.5">
          <h3 className="truncate font-bold text-[16px] text-white leading-tight tracking-tight">
            {t("REDATM_BANNER_TITLE")}
          </h3>
          <p className="line-clamp-2 text-[12px] text-white/75 leading-snug">
            {t("REDATM_BANNER_DESCRIPTION")}
          </p>
        </div>

        <div className="flex flex-shrink-0 flex-col items-center gap-3 self-center">
          <img
            src={REDATM_LOGO_URL}
            alt="RedATM"
            className="h-9 w-auto object-contain brightness-0 invert"
          />
          <div
            className="relative flex h-9 items-center gap-1 overflow-hidden rounded-lg px-3 font-semibold text-xs text-white"
            style={{
              backgroundColor: "#3B6EF5",
              backgroundImage:
                "linear-gradient(110deg, rgba(255,255,255,0) 35%, rgba(255,255,255,0.35) 50%, rgba(255,255,255,0) 65%)",
              backgroundSize: "200% 100%",
              animation: "redatm-cta-shimmer 2.6s linear infinite",
            }}>
            <span className="whitespace-nowrap">{t("REDATM_BANNER_CTA")}</span>
            <ArrowRight className="size-3.5" />
          </div>
        </div>
      </div>
    </BannerItem>
  );
}
