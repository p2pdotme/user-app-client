import { ArrowUpRight, Heart } from "lucide-react";
import { useTranslation } from "react-i18next";
import { BannerItem } from "@/components";
import { useAnalytics } from "@/hooks";
import { EVENTS } from "@/lib/analytics";

const PMDRF_URL = "http://pmdrf.nchl.com.np";

export function NepalReliefBanner() {
  const { track } = useAnalytics();
  const { t } = useTranslation();

  const handleBannerClick = () => {
    track(EVENTS.FEATURE, {
      status: "banner_clicked",
      bannerName: "nepal_flood_relief",
      location: "homescreen",
    });
    window.open(PMDRF_URL, "_blank", "noopener,noreferrer");
  };

  return (
    <BannerItem bgColor="bg-gradient-to-br from-[#8b0f2b] via-[#b3123b] to-[#5c0c1f]">
      <style>{`
        @keyframes nr-glow { 0%, 100% { opacity: 0.4; transform: scale(1); } 50% { opacity: 0.7; transform: scale(1.15); } }
        @keyframes nr-heartbeat { 0%, 100% { transform: scale(1); opacity: 0.1; } 15% { transform: scale(1.12); opacity: 0.16; } 30% { transform: scale(1); opacity: 0.1; } }
        @keyframes nr-shimmer { 0% { transform: translateX(-140%) skewX(-18deg); opacity: 0; } 15% { opacity: 1; } 85% { opacity: 1; } 100% { transform: translateX(260%) skewX(-18deg); opacity: 0; } }
        @keyframes nr-enter-label { 0% { transform: translateX(-8px); opacity: 0; } 100% { transform: translateX(0); opacity: 1; } }
        @keyframes nr-enter-title { 0% { transform: translateY(6px); opacity: 0; filter: blur(4px); } 100% { transform: translateY(0); opacity: 1; filter: blur(0); } }
        @keyframes nr-enter-sub { 0% { transform: translateY(4px); opacity: 0; } 100% { transform: translateY(0); opacity: 1; } }
        @keyframes nr-enter-cta { 0% { transform: scale(0.6) rotate(-30deg); opacity: 0; } 70% { transform: scale(1.08) rotate(5deg); } 100% { transform: scale(1) rotate(0deg); opacity: 1; } }
        @keyframes nr-cta-halo { 0%, 100% { box-shadow: 0 0 0 0 rgba(255,255,255,0.15), 0 0 12px -2px rgba(255,255,255,0.2); } 50% { box-shadow: 0 0 0 3px rgba(255,255,255,0), 0 0 18px -2px rgba(255,255,255,0.35); } }
      `}</style>

      {/* Soft crimson glow — top-left */}
      <div
        className="-top-10 -left-10 pointer-events-none absolute size-56 rounded-full bg-rose-400/30 blur-3xl"
        style={{ animation: "nr-glow 10s ease-in-out infinite" }}
      />

      {/* Deep-blue glow — bottom-right (Nepal flag accent) */}
      <div
        className="-right-12 -bottom-12 pointer-events-none absolute size-60 rounded-full bg-[#003893]/40 blur-3xl"
        style={{ animation: "nr-glow 12s ease-in-out infinite 1.5s" }}
      />

      {/* Subtle shimmer sweep */}
      <div
        className="pointer-events-none absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-transparent via-white/10 to-transparent"
        style={{ animation: "nr-shimmer 7s ease-in-out infinite 2s" }}
      />

      {/* Bottom vignette for legibility */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />

      {/* Giant heart watermark */}
      <Heart
        aria-hidden
        className="-right-4 pointer-events-none absolute inset-y-0 my-auto size-32 fill-white text-white"
        style={{ animation: "nr-heartbeat 2.4s ease-in-out infinite" }}
      />

      <button
        type="button"
        onClick={handleBannerClick}
        className="group relative flex h-full w-full cursor-pointer items-center justify-between gap-2.5 px-4 py-3 text-left">
        {/* Left — title + subtitle */}
        <div className="flex min-w-0 flex-1 flex-col justify-center gap-0.5">
          <h3
            className="truncate font-bold text-[17px] text-white leading-tight tracking-tight drop-shadow-[0_1px_3px_rgba(0,0,0,0.5)]"
            style={{
              animation:
                "nr-enter-title 700ms cubic-bezier(0.16, 1, 0.3, 1) 120ms both",
            }}>
            {t("NEPAL_RELIEF_BANNER_TITLE")}
          </h3>
          <p
            className="line-clamp-1 text-[11px] text-rose-50/75 leading-snug"
            style={{
              animation:
                "nr-enter-sub 600ms cubic-bezier(0.16, 1, 0.3, 1) 240ms both",
            }}>
            {t("NEPAL_RELIEF_BANNER_SUBTITLE")}
          </p>
          <p
            className="mt-0.5 line-clamp-1 font-semibold text-[12px] text-amber-200/90 leading-snug"
            style={{
              animation:
                "nr-enter-sub 600ms cubic-bezier(0.16, 1, 0.3, 1) 320ms both",
            }}>
            {t("NEPAL_RELIEF_BANNER_NOTE")}
          </p>
        </div>

        {/* Right — compact redirect affordance */}
        <div
          className="relative flex size-9 flex-shrink-0 items-center justify-center self-center rounded-full border border-white/30 bg-white/10 text-white backdrop-blur-md transition-all duration-300 group-hover:scale-110 group-hover:border-white/60 group-hover:bg-white/20 group-active:scale-95"
          style={{
            animation:
              "nr-enter-cta 700ms cubic-bezier(0.34, 1.56, 0.64, 1) 360ms both, nr-cta-halo 3s ease-in-out infinite 1s",
          }}>
          <ArrowUpRight className="group-hover:-translate-y-0.5 size-4 transition-transform duration-300 group-hover:translate-x-0.5" />
        </div>
      </button>
    </BannerItem>
  );
}
