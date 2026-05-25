import { ArrowRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import { BannerItem } from "@/components";
import { useAnalytics } from "@/hooks";
import { EVENTS } from "@/lib/analytics";

const PERPS_URL = "https://perps.p2p.me";

const FLOATING_CHIPS = [
  { left: 14, delay: 0, dur: 4.8 },
  { left: 32, delay: 1.6, dur: 5.4 },
  { left: 52, delay: 0.8, dur: 4.4 },
  { left: 72, delay: 2.4, dur: 5.0 },
  { left: 88, delay: 1.2, dur: 4.6 },
];

export function PerpsBanner() {
  const { track } = useAnalytics();
  const { t } = useTranslation();

  const handleBannerClick = () => {
    track(EVENTS.FEATURE, {
      status: "banner_clicked",
      bannerName: "perps_cashback",
      location: "homescreen",
    });

    window.open(PERPS_URL, "_blank", "noopener,noreferrer");
  };

  return (
    <BannerItem bgColor="bg-gradient-to-br from-[#0B0F1A] via-[#0F2018] to-[#0A1F1A]">
      <style>{`
        @keyframes perps-coin-rise {
          0%   { transform: translateY(24px) rotate(-8deg); opacity: 0; }
          15%  { opacity: 0.95; }
          85%  { opacity: 0.95; }
          100% { transform: translateY(-96px) rotate(12deg); opacity: 0; }
        }
        @keyframes perps-glow-pulse {
          0%, 100% { opacity: 0.35; }
          50%      { opacity: 0.7;  }
        }
        @keyframes perps-percent-shine {
          0%   { background-position: -120% 0; }
          100% { background-position: 220% 0;  }
        }
        @keyframes perps-cta-shimmer {
          0%   { background-position: -120% 0; }
          100% { background-position: 220% 0;  }
        }
        @keyframes perps-chip-pop {
          0%, 100% { transform: scale(1);    opacity: 0.85; }
          50%      { transform: scale(1.06); opacity: 1;    }
        }
        @keyframes perps-hero-breathe {
          0%, 100% { transform: scale(1);    filter: drop-shadow(0 0 6px rgba(16,185,129,0.35)); }
          50%      { transform: scale(1.03); filter: drop-shadow(0 0 14px rgba(251,191,36,0.55)); }
        }
      `}</style>

      {/* Background: glows, grid, floating cashback chips */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {/* radial emerald glow (left) */}
        <div
          className="-left-12 -translate-y-1/2 absolute top-1/2 size-56 rounded-full bg-emerald-500/25 blur-3xl"
          style={{ animation: "perps-glow-pulse 3.4s ease-in-out infinite" }}
        />
        {/* radial gold glow (right) */}
        <div
          className="-right-12 -translate-y-1/2 absolute top-1/2 size-44 rounded-full bg-amber-400/25 blur-3xl"
          style={{ animation: "perps-glow-pulse 3.4s ease-in-out infinite 1.2s" }}
        />

        {/* faint grid */}
        <div
          className="absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage:
              "linear-gradient(to bottom, transparent 0, transparent 24px, rgba(255,255,255,0.6) 25px), linear-gradient(to right, transparent 0, transparent 24px, rgba(255,255,255,0.4) 25px)",
            backgroundSize: "25px 25px",
          }}
        />

        {/* drifting +10% cashback chips */}
        {FLOATING_CHIPS.map((c, i) => (
          <div
            key={i}
            className="absolute bottom-0 inline-flex items-center justify-center rounded-full border border-emerald-300/50 bg-emerald-500/20 px-1.5 py-[1px] font-semibold text-[9px] text-emerald-100 backdrop-blur-sm"
            style={{
              left: `${c.left}%`,
              animation: `perps-coin-rise ${c.dur}s ease-in-out infinite`,
              animationDelay: `${c.delay}s`,
            }}>
            +10%
          </div>
        ))}

        {/* dim overlay so text reads cleanly */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/55 via-black/25 to-black/45" />
      </div>

      <div
        className="relative flex h-full w-full cursor-pointer items-center justify-between gap-3 px-5 py-4"
        onClick={handleBannerClick}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            handleBannerClick();
          }
        }}>
        {/* Left — Win?/Lose? chips + hero "10% Back." + caption */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-1.5">
            <span
              className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 px-2 py-[2px] font-medium text-[10px] text-emerald-200 ring-1 ring-emerald-400/40"
              style={{ animation: "perps-chip-pop 2.4s ease-in-out infinite" }}>
              <span aria-hidden="true">📈</span>
              {t("PERPS_BANNER_BULL")}
            </span>
            <span
              className="inline-flex items-center gap-1 rounded-full bg-rose-500/20 px-2 py-[2px] font-medium text-[10px] text-rose-200 ring-1 ring-rose-400/40"
              style={{ animation: "perps-chip-pop 2.4s ease-in-out infinite 0.5s" }}>
              <span aria-hidden="true">📉</span>
              {t("PERPS_BANNER_BEAR")}
            </span>
          </div>

          <h3
            className="font-extrabold text-xl leading-none tracking-tight"
            style={{
              animation: "perps-hero-breathe 2.8s ease-in-out infinite",
              transformOrigin: "0% 50%",
            }}>
            <span
              className="bg-gradient-to-r from-emerald-300 via-amber-200 to-emerald-300 bg-clip-text text-transparent"
              style={{
                backgroundSize: "200% 100%",
                animation: "perps-percent-shine 3.2s linear infinite",
              }}>
              {t("PERPS_BANNER_YES")}
            </span>
          </h3>

          <p className="max-w-[240px] text-white/80 text-xs leading-snug">
            {t("PERPS_BANNER_DESCRIPTION")}
          </p>
        </div>

        {/* Right — CTA */}
        <div
          className="relative flex h-10 flex-shrink-0 items-center gap-1.5 self-center overflow-hidden rounded-lg border-2 border-white bg-white/10 px-3.5 backdrop-blur-sm transition-all hover:bg-white/20"
          style={{
            backgroundImage:
              "linear-gradient(110deg, rgba(255,255,255,0) 35%, rgba(255,255,255,0.35) 50%, rgba(255,255,255,0) 65%)",
            backgroundSize: "200% 100%",
            animation: "perps-cta-shimmer 2.6s linear infinite",
          }}>
          <span className="whitespace-nowrap font-semibold text-sm text-white">
            {t("PERPS_BANNER_CTA")}
          </span>
          <ArrowRight className="size-4 text-white" />
        </div>
      </div>
    </BannerItem>
  );
}
