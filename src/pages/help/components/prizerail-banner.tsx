import { ArrowRight, Ticket } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import { BannerItem } from "@/components";
import { useAnalytics } from "@/hooks";
import { EVENTS } from "@/lib/analytics";
import { INTERNAL_HREFS } from "@/lib/constants";
import { PRIZERAIL_HEADLINE_PRIZE_CENTS } from "@/lib/prizerail";

const FLOATING_TICKETS = [
  { left: 10, delay: 0, dur: 5.2, size: 14 },
  { left: 30, delay: 1.8, dur: 4.6, size: 11 },
  { left: 50, delay: 0.9, dur: 5.6, size: 13 },
  { left: 70, delay: 2.6, dur: 4.9, size: 10 },
  { left: 88, delay: 1.3, dur: 5.3, size: 12 },
];

/**
 * Carousel slide for the PrizeRail draw. Opens the in-app PrizeRail Draws
 * page. The headline prize is the same fixed copy as the homescreen card.
 */
export function PrizerailBanner() {
  const { track } = useAnalytics();
  const { t } = useTranslation();
  const navigate = useNavigate();

  // Whole dollars: "$100,000", not "$100,000.00".
  const headlinePrize = `$${(PRIZERAIL_HEADLINE_PRIZE_CENTS / 100).toLocaleString("en-US")}`;

  const handleBannerClick = () => {
    track(EVENTS.FEATURE, {
      status: "banner_clicked",
      bannerName: "prizerail_draw",
      location: "homescreen",
    });
    navigate(INTERNAL_HREFS.PRIZE_DRAW);
  };

  return (
    <BannerItem bgColor="bg-gradient-to-br from-[#1A0B2E] via-[#2A1050] to-[#0B0F1A]">
      <style>{`
        @keyframes prizerail-ticket-rise {
          0%   { transform: translateY(24px) rotate(-14deg); opacity: 0; }
          15%  { opacity: 0.9; }
          85%  { opacity: 0.9; }
          100% { transform: translateY(-96px) rotate(14deg); opacity: 0; }
        }
        @keyframes prizerail-glow-pulse {
          0%, 100% { opacity: 0.35; }
          50%      { opacity: 0.75; }
        }
        @keyframes prizerail-title-shine {
          0%   { background-position: -120% 0; }
          100% { background-position: 220% 0;  }
        }
        @keyframes prizerail-cta-shimmer {
          0%   { background-position: -120% 0; }
          100% { background-position: 220% 0;  }
        }
        @keyframes prizerail-badge-pop {
          0%, 100% { transform: scale(1);    opacity: 0.85; }
          50%      { transform: scale(1.06); opacity: 1;    }
        }
      `}</style>

      {/* Background: violet and gold glows, floating tickets */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          className="-left-12 -translate-y-1/2 absolute top-1/2 size-56 rounded-full bg-violet-500/30 blur-3xl"
          style={{
            animation: "prizerail-glow-pulse 3.6s ease-in-out infinite",
          }}
        />
        <div
          className="-right-12 -translate-y-1/2 absolute top-1/2 size-44 rounded-full bg-amber-400/25 blur-3xl"
          style={{
            animation: "prizerail-glow-pulse 3.6s ease-in-out infinite 1.4s",
          }}
        />

        {FLOATING_TICKETS.map((c, i) => (
          <Ticket
            key={i}
            className="absolute bottom-0 text-amber-200/80"
            style={{
              left: `${c.left}%`,
              width: c.size,
              height: c.size,
              animation: `prizerail-ticket-rise ${c.dur}s ease-in-out infinite`,
              animationDelay: `${c.delay}s`,
            }}
          />
        ))}

        <div className="absolute inset-0 bg-gradient-to-r from-black/50 via-black/20 to-black/45" />
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
        <div className="flex flex-col gap-1.5">
          <span
            className="inline-flex w-fit items-center gap-1 rounded-full bg-amber-400/20 px-2 py-[2px] font-medium text-[10px] text-amber-100 ring-1 ring-amber-300/40"
            style={{
              animation: "prizerail-badge-pop 2.4s ease-in-out infinite",
            }}>
            <Ticket className="size-3" aria-hidden="true" />
            {t("PRIZERAIL_DRAWS")}
          </span>

          <h3 className="font-extrabold text-xl leading-none tracking-tight">
            <span
              className="bg-gradient-to-r from-amber-200 via-white to-amber-200 bg-clip-text text-transparent"
              style={{
                backgroundSize: "200% 100%",
                animation: "prizerail-title-shine 3.2s linear infinite",
              }}>
              {t("PRIZERAIL_BANNER_TITLE", { amount: headlinePrize })}
            </span>
          </h3>

          <p className="max-w-[240px] text-white/80 text-xs leading-snug">
            {t("PRIZERAIL_BANNER_DESCRIPTION")}
          </p>
        </div>

        <div
          className="relative flex h-10 flex-shrink-0 items-center gap-1.5 self-center overflow-hidden rounded-lg border-2 border-white bg-white/10 px-3.5 backdrop-blur-sm transition-all hover:bg-white/20"
          style={{
            backgroundImage:
              "linear-gradient(110deg, rgba(255,255,255,0) 35%, rgba(255,255,255,0.35) 50%, rgba(255,255,255,0) 65%)",
            backgroundSize: "200% 100%",
            animation: "prizerail-cta-shimmer 2.6s linear infinite",
          }}>
          <span className="whitespace-nowrap font-semibold text-sm text-white">
            {t("PRIZERAIL_BANNER_CTA")}
          </span>
          <ArrowRight className="size-4 text-white" />
        </div>
      </div>
    </BannerItem>
  );
}
