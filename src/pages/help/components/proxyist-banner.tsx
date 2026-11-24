import { ArrowUpRight, MapPin } from "lucide-react";
import { useTranslation } from "react-i18next";
import { BannerItem } from "@/components";
import { useAnalytics } from "@/hooks";
import { EVENTS } from "@/lib/analytics";

const PROXYIST_URL = "https://app.proxy.ist/help";

export function ProxyistBanner() {
  const { track } = useAnalytics();
  const { t } = useTranslation();

  const handleBannerClick = () => {
    track(EVENTS.FEATURE, {
      status: "banner_clicked",
      bannerName: "proxyist",
      location: "homescreen",
    });
    window.open(PROXYIST_URL, "_blank", "noopener,noreferrer");
  };

  return (
    <BannerItem bgColor="bg-gradient-to-br from-[#06231c] via-[#0b3a2e] to-[#04130f]">
      <style>{`
        @keyframes px-glow { 0%, 100% { transform: translate(-8%, -8%) scale(1); opacity: 0.45; } 50% { transform: translate(6%, 4%) scale(1.18); opacity: 0.7; } }
        @keyframes px-ring { 0% { transform: scale(0.35); opacity: 0.55; } 100% { transform: scale(1.5); opacity: 0; } }
        @keyframes px-pin { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-4px); } }
        @keyframes px-enter { 0% { transform: translateY(6px); opacity: 0; } 100% { transform: translateY(0); opacity: 1; } }
        @keyframes px-enter-cta { 0% { transform: scale(0.6) rotate(-30deg); opacity: 0; } 70% { transform: scale(1.08) rotate(5deg); } 100% { transform: scale(1) rotate(0deg); opacity: 1; } }
      `}</style>

      {/* Soft emerald glow — top-left */}
      <div
        className="-top-10 -left-10 pointer-events-none absolute size-56 rounded-full bg-emerald-500/30 blur-3xl"
        style={{ animation: "px-glow 10s ease-in-out infinite" }}
      />

      {/* Map-grid texture */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.7) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.7) 1px, transparent 1px)",
          backgroundSize: "22px 22px",
        }}
      />

      {/* Location pin with radar rings */}
      <div className="pointer-events-none absolute inset-y-0 right-14 flex w-24 items-center justify-center">
        <span
          className="absolute size-24 rounded-full border border-emerald-300/50"
          style={{ animation: "px-ring 3s ease-out infinite" }}
        />
        <span
          className="absolute size-24 rounded-full border border-emerald-300/50"
          style={{ animation: "px-ring 3s ease-out infinite 1.5s" }}
        />
        <MapPin
          className="size-16 text-emerald-200/25"
          strokeWidth={1.5}
          style={{ animation: "px-pin 3s ease-in-out infinite" }}
        />
      </div>

      {/* Left-side scrim so copy stays legible over the pin */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-[#06231c]/80 via-[#06231c]/30 to-transparent" />

      <button
        type="button"
        onClick={handleBannerClick}
        className="group relative flex h-full w-full cursor-pointer items-center justify-between gap-2.5 px-4 py-3 text-left">
        <div className="flex min-w-0 flex-1 flex-col justify-center gap-0.5">
          <div
            className="flex items-center gap-1.5 whitespace-nowrap"
            style={{
              animation: "px-enter 600ms cubic-bezier(0.16, 1, 0.3, 1) both",
            }}>
            <span className="relative inline-flex h-1 w-1">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-300" />
              <span className="relative inline-flex h-1 w-1 rounded-full bg-emerald-300" />
            </span>
            <span className="font-semibold text-[9px] text-emerald-100/90 uppercase tracking-[0.14em]">
              {t("PROXYIST_BANNER_LABEL")}
            </span>
          </div>
          <h3
            className="truncate font-bold text-[17px] text-white leading-tight tracking-tight drop-shadow-[0_1px_3px_rgba(0,0,0,0.5)]"
            style={{
              animation:
                "px-enter 700ms cubic-bezier(0.16, 1, 0.3, 1) 120ms both",
            }}>
            {t("PROXYIST_BANNER_TITLE")}
          </h3>
          <p
            className="line-clamp-2 text-[11px] text-emerald-50/80 leading-snug"
            style={{
              animation:
                "px-enter 600ms cubic-bezier(0.16, 1, 0.3, 1) 240ms both",
            }}>
            {t("PROXYIST_BANNER_SUBTITLE")}
          </p>
        </div>

        <div
          className="relative flex size-9 flex-shrink-0 items-center justify-center self-center rounded-full border border-white/30 bg-white/10 text-white backdrop-blur-md transition-all duration-300 group-hover:scale-110 group-hover:border-white/60 group-hover:bg-white/20 group-active:scale-95"
          style={{
            animation:
              "px-enter-cta 700ms cubic-bezier(0.34, 1.56, 0.64, 1) 360ms both",
          }}>
          <ArrowUpRight className="group-hover:-translate-y-0.5 size-4 transition-transform duration-300 group-hover:translate-x-0.5" />
        </div>
      </button>
    </BannerItem>
  );
}
