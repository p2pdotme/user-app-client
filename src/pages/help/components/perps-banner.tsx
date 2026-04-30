import { ArrowRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import { BannerItem } from "@/components";
import { useAnalytics } from "@/hooks";
import { EVENTS } from "@/lib/analytics";

const PERPS_URL = "https://perps.p2p.me";

export function PerpsBanner() {
  const { track } = useAnalytics();
  const { t } = useTranslation();

  const handleBannerClick = () => {
    track(EVENTS.FEATURE, {
      status: "banner_clicked",
      bannerName: "perps_leverage",
      location: "homescreen",
    });

    window.open(PERPS_URL, "_blank", "noopener,noreferrer");
  };

  return (
    <BannerItem bgColor="bg-gradient-to-br from-[#0B0F1A] via-[#0F172A] to-[#1A1033]">
      <style>{`
        @keyframes perps-candle-up {
          0%, 100% { transform: translateY(2px) scaleY(0.85); opacity: 0.55; }
          50%      { transform: translateY(-2px) scaleY(1);    opacity: 0.9;  }
        }
        @keyframes perps-candle-down {
          0%, 100% { transform: translateY(-2px) scaleY(1);    opacity: 0.9;  }
          50%      { transform: translateY(2px)  scaleY(0.85); opacity: 0.55; }
        }
        @keyframes perps-line-draw {
          0%   { stroke-dashoffset: 240; }
          50%  { stroke-dashoffset: 0;   }
          100% { stroke-dashoffset: -240; }
        }
        @keyframes perps-pulse-glow {
          0%, 100% { opacity: 0.35; }
          50%      { opacity: 0.7;  }
        }
        @keyframes perps-bull-tilt {
          0%, 100% { transform: rotate(-3deg) translateY(0); }
          50%      { transform: rotate(3deg)  translateY(-1px); }
        }
        @keyframes perps-bear-tilt {
          0%, 100% { transform: rotate(3deg)  translateY(0); }
          50%      { transform: rotate(-3deg) translateY(1px); }
        }
        @keyframes perps-yes-pop {
          0%, 60%, 100% { transform: scale(1);    color: #ffffff; }
          70%           { transform: scale(1.12); color: #FBBF24; }
          85%           { transform: scale(1);    color: #ffffff; }
        }
        @keyframes perps-cta-shimmer {
          0%   { background-position: -120% 0; }
          100% { background-position: 220% 0; }
        }
      `}</style>

      {/* Background grid + animated candlesticks */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {/* horizontal grid lines */}
        <div
          className="absolute inset-0 opacity-[0.08]"
          style={{
            backgroundImage:
              "linear-gradient(to bottom, transparent 0, transparent 24px, rgba(255,255,255,0.6) 25px), linear-gradient(to right, transparent 0, transparent 24px, rgba(255,255,255,0.4) 25px)",
            backgroundSize: "25px 25px",
          }}
        />

        {/* animated candlesticks */}
        <div className="absolute inset-y-0 right-0 left-0 flex items-center gap-[6px] pl-2">
          {[
            { up: true, h: 28, top: 6, delay: 0 },
            { up: false, h: 22, top: 14, delay: 0.4 },
            { up: true, h: 36, top: -2, delay: 0.2 },
            { up: false, h: 18, top: 18, delay: 0.7 },
            { up: true, h: 30, top: 2, delay: 0.1 },
            { up: false, h: 26, top: 10, delay: 0.5 },
            { up: true, h: 40, top: -6, delay: 0.3 },
            { up: false, h: 20, top: 16, delay: 0.6 },
            { up: true, h: 34, top: 0, delay: 0.15 },
            { up: false, h: 24, top: 12, delay: 0.45 },
            { up: true, h: 38, top: -4, delay: 0.25 },
            { up: false, h: 16, top: 20, delay: 0.55 },
          ].map((c, i) => (
            <div
              key={i}
              className="relative flex shrink-0 flex-col items-center"
              style={{ marginTop: c.top }}>
              {/* wick */}
              <div
                className={`w-px ${c.up ? "bg-emerald-400/40" : "bg-rose-400/40"}`}
                style={{ height: 6 }}
              />
              {/* body */}
              <div
                className={`w-[6px] rounded-[1px] ${c.up ? "bg-emerald-400/70" : "bg-rose-400/70"}`}
                style={{
                  height: c.h,
                  animation: `${c.up ? "perps-candle-up" : "perps-candle-down"} 2.4s ease-in-out infinite`,
                  animationDelay: `${c.delay}s`,
                }}
              />
              {/* wick */}
              <div
                className={`w-px ${c.up ? "bg-emerald-400/40" : "bg-rose-400/40"}`}
                style={{ height: 4 }}
              />
            </div>
          ))}
        </div>

        {/* animated sparkline overlay (long → short) */}
        <svg
          className="absolute inset-0 h-full w-full"
          viewBox="0 0 240 112"
          preserveAspectRatio="none"
          aria-hidden="true">
          <defs>
            <linearGradient id="perps-line" x1="0" x2="1" y1="0" y2="0">
              <stop offset="0%" stopColor="#10B981" stopOpacity="0.9" />
              <stop offset="50%" stopColor="#FBBF24" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#F43F5E" stopOpacity="0.9" />
            </linearGradient>
          </defs>
          <path
            d="M0,80 L20,72 L40,60 L60,48 L80,32 L100,24 L120,20 L140,32 L160,52 L180,68 L200,84 L220,92 L240,96"
            fill="none"
            stroke="url(#perps-line)"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeDasharray="240"
            style={{
              animation: "perps-line-draw 5s ease-in-out infinite",
              filter: "drop-shadow(0 0 4px rgba(255,255,255,0.25))",
            }}
          />
        </svg>

        {/* radial glow pulse on the right (CTA side) */}
        <div
          className="-right-12 -translate-y-1/2 absolute top-1/2 size-44 rounded-full bg-purple-500/25 blur-2xl"
          style={{ animation: "perps-pulse-glow 3s ease-in-out infinite" }}
        />

        {/* dim overlay so text reads cleanly */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/55 via-black/30 to-black/40" />
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
        {/* Left — headline + subtext */}
        <div className="flex flex-col gap-1.5">
          <h3 className="flex items-center gap-1.5 font-semibold text-base leading-tight">
            <span
              className="inline-flex items-center gap-1 text-emerald-400"
              style={{
                animation: "perps-bull-tilt 2.6s ease-in-out infinite",
                transformOrigin: "50% 90%",
              }}>
              <span aria-hidden="true">🐂</span>
              {t("PERPS_BANNER_BULL")}
            </span>
            <span
              className="inline-flex items-center gap-1 text-rose-400"
              style={{
                animation: "perps-bear-tilt 2.6s ease-in-out infinite 0.6s",
                transformOrigin: "50% 90%",
              }}>
              <span aria-hidden="true">🐻</span>
              {t("PERPS_BANNER_BEAR")}
            </span>
            <span
              className="font-bold text-white"
              style={{
                animation: "perps-yes-pop 2.4s ease-in-out infinite 0.4s",
                display: "inline-block",
              }}>
              {t("PERPS_BANNER_YES")}
            </span>
          </h3>
          <p className="max-w-[230px] text-white/75 text-xs leading-snug">
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
