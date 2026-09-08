import { ArrowRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import { BannerItem } from "@/components";
import { useAnalytics } from "@/hooks";
import { EVENTS } from "@/lib/analytics";

const BENEFITS_URL = "https://p2p-beneficios.vercel.app/#benefits";

/** Merchant logos drifting in the background — mirrors the benefits page. */
const FLOATING_LOGOS = [
  {
    domain: "mcdonalds.com",
    logo: "https://p2p-beneficios.vercel.app/mcdonalds.webp",
    name: "McDonald's",
    left: 53,
    top: 8,
    size: 28,
    delay: 0,
    dur: 6.2,
  },
  {
    domain: "jumbo.com.ar",
    logo: "https://p2p-beneficios.vercel.app/jumbo.webp",
    name: "Jumbo",
    left: 80,
    top: 6,
    size: 26,
    delay: 2.6,
    dur: 6.6,
  },
  {
    domain: "carrefour.com",
    logo: "https://p2p-beneficios.vercel.app/carrefour.webp",
    name: "Carrefour",
    left: 60,
    top: 68,
    size: 26,
    delay: 1.4,
    dur: 7.1,
  },
  {
    domain: "laanonima.com.ar",
    logo: "https://p2p-beneficios.vercel.app/laanonima.webp",
    name: "La Anónima",
    left: 82,
    top: 66,
    size: 24,
    delay: 3.4,
    dur: 7.6,
  },
];

export function BenefitsBanner() {
  const { track } = useAnalytics();
  const { t } = useTranslation();

  const handleBannerClick = () => {
    track(EVENTS.FEATURE, {
      status: "banner_clicked",
      bannerName: "benefits",
      location: "homescreen",
    });
    window.open(BENEFITS_URL, "_blank", "noopener,noreferrer");
  };

  return (
    <BannerItem bgColor="bg-gradient-to-br from-[#1A1150] via-[#2A1CA0] to-[#493FEE]">
      <style>{`
        @keyframes ben-logo-float {
          0%, 100% { transform: translate(0, 0)      rotate(-3deg); }
          50%      { transform: translate(-3px, -5px) rotate(3deg); }
        }
        @keyframes ben-glow-pulse {
          0%, 100% { opacity: 0.35; }
          50%      { opacity: 0.65; }
        }
        @keyframes ben-cta-shimmer {
          0%   { background-position: -120% 0; }
          100% { background-position: 220% 0;  }
        }
        @keyframes ben-badge-pop {
          0%, 100% { transform: scale(1);    }
          50%      { transform: scale(1.06); }
        }
      `}</style>

      {/* Soft brand glows */}
      <div
        className="-left-10 -translate-y-1/2 pointer-events-none absolute top-1/2 size-48 rounded-full bg-indigo-500/40 blur-3xl"
        style={{ animation: "ben-glow-pulse 4s ease-in-out infinite" }}
      />
      <div
        className="-right-12 -bottom-14 pointer-events-none absolute size-52 rounded-full bg-violet-400/35 blur-3xl"
        style={{ animation: "ben-glow-pulse 4s ease-in-out infinite 1.4s" }}
      />

      {/* Dotted mesh — echoes the globe on the benefits page */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.14]"
        style={{
          backgroundImage:
            "radial-gradient(rgba(255,255,255,0.9) 1px, transparent 1px)",
          backgroundSize: "14px 14px",
          maskImage:
            "radial-gradient(120% 90% at 78% 50%, #000 25%, transparent 72%)",
          WebkitMaskImage:
            "radial-gradient(120% 90% at 78% 50%, #000 25%, transparent 72%)",
        }}
      />

      {/* Floating merchant logos */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {FLOATING_LOGOS.map((logo) => (
          <div
            key={logo.domain}
            className="absolute flex items-center justify-center overflow-hidden rounded-lg bg-white shadow-[0_6px_16px_-4px_rgba(0,0,0,0.55)] ring-1 ring-white/70"
            style={{
              left: `${logo.left}%`,
              top: `${logo.top}%`,
              width: logo.size,
              height: logo.size,
              animation: `ben-logo-float ${logo.dur}s ease-in-out infinite`,
              animationDelay: `${logo.delay}s`,
            }}>
            <img
              src={logo.logo}
              alt={logo.name}
              className="h-full w-full object-contain"
            />
          </div>
        ))}
      </div>

      {/* Wash so the copy stays readable, fading out before the logos */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            "linear-gradient(90deg, #150E44 0%, rgba(21,14,68,0.9) 30%, rgba(21,14,68,0.35) 46%, rgba(21,14,68,0) 60%)",
        }}
      />

      <button
        type="button"
        onClick={handleBannerClick}
        className="group relative flex h-full w-full cursor-pointer items-center justify-between gap-2 px-4 py-3 text-left">
        <div className="flex min-w-0 flex-1 flex-col justify-center gap-1.5">
          <div className="mb-1.5 flex items-center gap-1.5">
            <span
              className="inline-flex items-center gap-1 rounded-full bg-white/15 px-1.5 py-[1px] font-semibold text-[9px] text-white uppercase tracking-[0.14em] ring-1 ring-white/25"
              style={{ animation: "ben-badge-pop 2.6s ease-in-out infinite" }}>
              {t("BENEFITS_BANNER_LABEL")}
            </span>
          </div>

          <h3 className="truncate font-bold text-[14px] text-white leading-tight tracking-tight">
            {t("BENEFITS_BANNER_TITLE", { cashbackPercent: 5 })}
          </h3>

          <p className="line-clamp-2 max-w-[175px] text-[11px] text-white/70 leading-snug">
            {t("BENEFITS_BANNER_DESCRIPTION")}
          </p>
        </div>

        <div
          className="relative flex h-8 flex-shrink-0 items-center gap-1 self-center overflow-hidden rounded-lg bg-white px-2 font-semibold text-[#2A1CA0] text-[11px] shadow-lg transition-transform group-active:scale-95"
          style={{
            backgroundImage:
              "linear-gradient(110deg, rgba(255,255,255,0) 35%, rgba(73,63,238,0.18) 50%, rgba(255,255,255,0) 65%)",
            backgroundSize: "200% 100%",
            animation: "ben-cta-shimmer 2.8s linear infinite",
          }}>
          <span className="whitespace-nowrap">{t("BENEFITS_BANNER_CTA")}</span>
          <ArrowRight className="size-3.5" />
        </div>
      </button>
    </BannerItem>
  );
}
