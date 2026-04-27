import { ArrowUpRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import { BannerItem } from "@/components";
import { useAnalytics } from "@/hooks";
import { EVENTS } from "@/lib/analytics";

export function UnfreezeBanner() {
  const { track } = useAnalytics();
  const { t } = useTranslation();

  const handleBannerClick = () => {
    track(EVENTS.FEATURE, {
      status: "banner_clicked",
      bannerName: "unfreeze_pro",
      location: "homescreen",
    });
    window.open("https://unfreeze.pro", "_blank", "noopener,noreferrer");
  };

  return (
    <BannerItem bgColor="bg-gradient-to-br from-[#14142b] via-[#1f1a3d] to-[#0d0d1f]">
      <style>{`
        @keyframes uf-aurora { 0% { transform: translate(-10%, -10%) scale(1); opacity: 0.45; } 50% { transform: translate(8%, 5%) scale(1.2); opacity: 0.7; } 100% { transform: translate(-10%, -10%) scale(1); opacity: 0.45; } }
        @keyframes uf-aurora-alt { 0% { transform: translate(10%, 0) scale(1); opacity: 0.4; } 50% { transform: translate(-6%, 8%) scale(1.15); opacity: 0.6; } 100% { transform: translate(10%, 0) scale(1); opacity: 0.4; } }
        @keyframes uf-shimmer { 0% { transform: translateX(-140%) skewX(-18deg); opacity: 0; } 15% { opacity: 1; } 85% { opacity: 1; } 100% { transform: translateX(260%) skewX(-18deg); opacity: 0; } }
        @keyframes uf-rupee-breathe { 0% { transform: scale(1) rotate(-6deg); opacity: 0.1; } 50% { transform: scale(1.05) rotate(-4deg); opacity: 0.16; } 100% { transform: scale(1) rotate(-6deg); opacity: 0.1; } }
        @keyframes uf-rupee-halo { 0%, 100% { transform: rotate(0deg); opacity: 0.15; } 50% { transform: rotate(180deg); opacity: 0.3; } }
        @keyframes uf-enter-label { 0% { transform: translateX(-8px); opacity: 0; } 100% { transform: translateX(0); opacity: 1; } }
        @keyframes uf-enter-title { 0% { transform: translateY(6px); opacity: 0; filter: blur(4px); } 100% { transform: translateY(0); opacity: 1; filter: blur(0); } }
        @keyframes uf-enter-sub { 0% { transform: translateY(4px); opacity: 0; } 100% { transform: translateY(0); opacity: 1; } }
        @keyframes uf-enter-cta { 0% { transform: scale(0.6) rotate(-30deg); opacity: 0; } 70% { transform: scale(1.08) rotate(5deg); } 100% { transform: scale(1) rotate(0deg); opacity: 1; } }
        @keyframes uf-rise { 0% { transform: translate(0, 14px) scale(0.6); opacity: 0; } 15% { opacity: 0.8; } 60% { opacity: 0.8; } 100% { transform: translate(var(--uf-drift, 4px), -22px) scale(1); opacity: 0; } }
        @keyframes uf-sparkle { 0%, 100% { opacity: 0; transform: scale(0); } 50% { opacity: 0.9; transform: scale(1); } }
        @keyframes uf-cta-halo { 0%, 100% { box-shadow: 0 0 0 0 rgba(255,255,255,0.15), 0 0 12px -2px rgba(255,255,255,0.2); } 50% { box-shadow: 0 0 0 3px rgba(255,255,255,0), 0 0 18px -2px rgba(255,255,255,0.35); } }
      `}</style>

      {/* Soft primary glow — top-left */}
      <div
        className="-top-10 -left-10 pointer-events-none absolute size-56 rounded-full bg-primary/35 blur-3xl"
        style={{ animation: "uf-aurora 10s ease-in-out infinite" }}
      />

      {/* Soft violet glow — bottom-right */}
      <div
        className="-right-12 -bottom-12 pointer-events-none absolute size-60 rounded-full bg-violet-500/30 blur-3xl"
        style={{ animation: "uf-aurora-alt 12s ease-in-out infinite" }}
      />

      {/* Subtle shimmer sweep */}
      <div
        className="pointer-events-none absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-transparent via-white/10 to-transparent"
        style={{ animation: "uf-shimmer 7s ease-in-out infinite 2s" }}
      />

      {/* Very subtle dot texture */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.08]"
        style={{
          backgroundImage:
            "radial-gradient(rgba(255,255,255,0.6) 1px, transparent 1px)",
          backgroundSize: "16px 16px",
        }}
      />

      {/* Bottom vignette for legibility */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />

      {/* Gentle rotating halo behind ₹ */}
      <div
        className="pointer-events-none absolute inset-y-0 right-[30%] flex w-32 items-center justify-center"
        style={{ animation: "uf-rupee-halo 20s linear infinite" }}>
        <div
          className="size-24 rounded-full blur-2xl"
          style={{
            background:
              "conic-gradient(from 0deg, rgba(139,92,246,0.4), rgba(99,102,241,0.3), rgba(139,92,246,0.4))",
          }}
        />
      </div>

      {/* Giant ₹ watermark */}
      <div
        className="pointer-events-none absolute inset-y-0 right-[36%] flex items-center justify-center font-black text-[120px] text-white leading-none"
        style={{ animation: "uf-rupee-breathe 6s ease-in-out infinite" }}>
        ₹
      </div>

      {/* Two quiet sparkles */}
      <span
        className="pointer-events-none absolute top-3 right-[45%] size-0.5 rounded-full bg-white shadow-[0_0_5px_1px_rgba(255,255,255,0.6)]"
        style={{ animation: "uf-sparkle 3.5s ease-in-out infinite 0.6s" }}
      />
      <span
        className="pointer-events-none absolute right-[22%] bottom-6 size-0.5 rounded-full bg-indigo-200 shadow-[0_0_5px_1px_rgba(165,180,252,0.7)]"
        style={{ animation: "uf-sparkle 4s ease-in-out infinite 1.8s" }}
      />

      {/* Minimal rising particles */}
      <span
        className="pointer-events-none absolute bottom-1 left-[26%] size-0.5 rounded-full bg-violet-200/70"
        style={{
          animation: "uf-rise 4.5s ease-out infinite 0.3s",
          ["--uf-drift" as string]: "4px",
        }}
      />
      <span
        className="pointer-events-none absolute bottom-1 left-[58%] size-0.5 rounded-full bg-indigo-200/70"
        style={{
          animation: "uf-rise 5s ease-out infinite 2.2s",
          ["--uf-drift" as string]: "-5px",
        }}
      />

      <button
        type="button"
        onClick={handleBannerClick}
        className="group relative flex h-full w-full cursor-pointer items-center justify-between gap-2.5 px-4 py-3 text-left">
        {/* Left — label + title + subtitle */}
        <div className="flex min-w-0 flex-1 flex-col justify-center gap-0.5">
          <div
            className="flex items-center gap-1.5 whitespace-nowrap"
            style={{
              animation:
                "uf-enter-label 600ms cubic-bezier(0.16, 1, 0.3, 1) both",
            }}>
            <span aria-hidden className="text-[11px] leading-none">
              🇮🇳
            </span>
            <span className="relative inline-flex h-1 w-1">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-indigo-300" />
              <span className="relative inline-flex h-1 w-1 rounded-full bg-indigo-300" />
            </span>
            <span className="font-semibold text-[9px] text-indigo-100/90 uppercase tracking-[0.14em]">
              {t("UNFREEZE_BANNER_LABEL")}
            </span>
          </div>
          <h3
            className="truncate font-bold text-[17px] text-white leading-tight tracking-tight drop-shadow-[0_1px_3px_rgba(0,0,0,0.5)]"
            style={{
              animation:
                "uf-enter-title 700ms cubic-bezier(0.16, 1, 0.3, 1) 120ms both",
            }}>
            {t("UNFREEZE_BANNER_TITLE")}
          </h3>
          <p
            className="line-clamp-2 text-[11px] text-indigo-50/75 leading-snug"
            style={{
              animation:
                "uf-enter-sub 600ms cubic-bezier(0.16, 1, 0.3, 1) 240ms both",
            }}>
            {t("UNFREEZE_BANNER_SUBTITLE")}
          </p>
        </div>

        {/* Right — compact redirect affordance */}
        <div
          className="relative flex size-9 flex-shrink-0 items-center justify-center self-center rounded-full border border-white/30 bg-white/10 text-white backdrop-blur-md transition-all duration-300 group-hover:scale-110 group-hover:border-white/60 group-hover:bg-white/20 group-active:scale-95"
          style={{
            animation:
              "uf-enter-cta 700ms cubic-bezier(0.34, 1.56, 0.64, 1) 360ms both, uf-cta-halo 3s ease-in-out infinite 1s",
          }}>
          <ArrowUpRight className="group-hover:-translate-y-0.5 size-4 transition-transform duration-300 group-hover:translate-x-0.5" />
        </div>
      </button>
    </BannerItem>
  );
}
