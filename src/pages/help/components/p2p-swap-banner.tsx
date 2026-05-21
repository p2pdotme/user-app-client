import { ArrowUpRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import { BannerItem } from "@/components";
import { useAnalytics } from "@/hooks";
import { EVENTS } from "@/lib/analytics";
import { INTERNAL_HREFS } from "@/lib/constants";
import { useNavigate } from "react-router";


export function P2PSwapBanner() {
  const { track } = useAnalytics();
  const { t } = useTranslation();
  const navigate = useNavigate();

  const handleBannerClick = () => {
    track(EVENTS.FEATURE, {
      status: "banner_clicked",
      bannerName: "p2p_swap",
      location: "homescreen",
    });
    navigate(INTERNAL_HREFS.P2P_SWAP);
  };

  return (
    <BannerItem bgColor="bg-gradient-to-br from-[#01030c] via-[#020618] to-[#04091f]">
      <style>{`
        @keyframes p2ps-orbit-a {
          0%   { transform: translate(0, 0)    scale(1);   }
          50%  { transform: translate(6px, -4px) scale(1.05); }
          100% { transform: translate(0, 0)    scale(1);   }
        }
        @keyframes p2ps-orbit-b {
          0%   { transform: translate(0, 0)    scale(1);   }
          50%  { transform: translate(-6px, 4px) scale(1.05); }
          100% { transform: translate(0, 0)    scale(1);   }
        }
        @keyframes p2ps-arrow-top {
          0%, 100% { transform: translateX(-4px); opacity: 0.45; }
          50%      { transform: translateX(4px);  opacity: 1;    }
        }
        @keyframes p2ps-arrow-bot {
          0%, 100% { transform: translateX(4px);  opacity: 0.45; }
          50%      { transform: translateX(-4px); opacity: 1;    }
        }
        @keyframes p2ps-glow-a {
          0%, 100% { opacity: 0.35; transform: translate(-10%, -10%) scale(1);    }
          50%      { opacity: 0.6;  transform: translate(6%, 4%)    scale(1.15); }
        }
        @keyframes p2ps-glow-b {
          0%, 100% { opacity: 0.3;  transform: translate(8%, 6%)   scale(1);    }
          50%      { opacity: 0.55; transform: translate(-4%, -6%) scale(1.18); }
        }
        @keyframes p2ps-shimmer {
          0%   { background-position: -120% 0; }
          100% { background-position: 220% 0;  }
        }
        @keyframes p2ps-spark {
          0%, 100% { opacity: 0; transform: scale(0); }
          50%      { opacity: 0.9; transform: scale(1); }
        }
        @keyframes p2ps-enter-title {
          0%   { transform: translateY(6px); opacity: 0; filter: blur(4px); }
          100% { transform: translateY(0);   opacity: 1; filter: blur(0);   }
        }
        @keyframes p2ps-enter-sub {
          0%   { transform: translateY(4px); opacity: 0; }
          100% { transform: translateY(0);   opacity: 1; }
        }
        @keyframes p2ps-cta-pop {
          0%   { transform: scale(0.6) rotate(-30deg); opacity: 0; }
          70%  { transform: scale(1.08) rotate(5deg);              }
          100% { transform: scale(1) rotate(0deg);     opacity: 1; }
        }
      `}</style>

      {/* Cyan aurora — top-left (USDC) */}
      <div
        className="-top-12 -left-10 pointer-events-none absolute size-56 rounded-full bg-cyan-400/40 blur-3xl"
        style={{ animation: "p2ps-glow-a 9s ease-in-out infinite" }}
      />
      {/* Violet aurora — bottom-right (P2P) */}
      <div
        className="-right-14 -bottom-12 pointer-events-none absolute size-60 rounded-full bg-violet-500/40 blur-3xl"
        style={{ animation: "p2ps-glow-b 11s ease-in-out infinite" }}
      />

      {/* Fine dot texture */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage:
            "radial-gradient(rgba(255,255,255,0.7) 1px, transparent 1px)",
          backgroundSize: "16px 16px",
        }}
      />

      {/* Bottom vignette */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-transparent" />

      {/* Decorative swap visualization (right-side, behind CTA) */}
      <div className="pointer-events-none absolute inset-y-0 right-[16%] hidden items-center justify-center sm:flex">
        <div className="relative flex items-center gap-2">
          {/* USDC coin */}
          <div
            className="relative flex size-9 items-center justify-center rounded-full bg-gradient-to-br from-cyan-300 to-sky-500 shadow-[0_0_14px_-2px_rgba(34,211,238,0.7)] ring-1 ring-white/40"
            style={{ animation: "p2ps-orbit-a 4s ease-in-out infinite" }}>
            <span className="font-extrabold text-[10px] text-white tracking-tight drop-shadow-[0_1px_2px_rgba(0,0,0,0.4)]">
              USDC
            </span>
          </div>

          {/* Swap arrows */}
          <div className="flex flex-col items-center justify-center gap-0.5">
            <svg
              width="20"
              height="8"
              viewBox="0 0 20 8"
              fill="none"
              aria-hidden="true"
              style={{ animation: "p2ps-arrow-top 1.8s ease-in-out infinite" }}>
              <path
                d="M0 4h16M12 1l4 3-4 3"
                stroke="#a5f3fc"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <svg
              width="20"
              height="8"
              viewBox="0 0 20 8"
              fill="none"
              aria-hidden="true"
              style={{
                animation: "p2ps-arrow-bot 1.8s ease-in-out infinite 0.4s",
              }}>
              <path
                d="M20 4H4M8 1L4 4l4 3"
                stroke="#ddd6fe"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>

          {/* P2P coin */}
          <div
            className="relative flex size-9 items-center justify-center rounded-full bg-gradient-to-br from-violet-400 to-fuchsia-600 shadow-[0_0_14px_-2px_rgba(167,139,250,0.7)] ring-1 ring-white/40"
            style={{
              animation: "p2ps-orbit-b 4s ease-in-out infinite 0.5s",
            }}>
            <span className="font-extrabold text-[11px] text-white tracking-tight drop-shadow-[0_1px_2px_rgba(0,0,0,0.4)]">
              P2P
            </span>
          </div>
        </div>
      </div>

      {/* Subtle sparkles */}
      <span
        className="pointer-events-none absolute top-3 right-[28%] size-0.5 rounded-full bg-cyan-200 shadow-[0_0_6px_1px_rgba(165,243,252,0.7)]"
        style={{ animation: "p2ps-spark 3.4s ease-in-out infinite 0.4s" }}
      />
      <span
        className="pointer-events-none absolute right-[20%] bottom-4 size-0.5 rounded-full bg-violet-200 shadow-[0_0_6px_1px_rgba(221,214,254,0.7)]"
        style={{ animation: "p2ps-spark 4s ease-in-out infinite 1.6s" }}
      />

      {/* Full-banner glass overlay */}
      <div
        className="pointer-events-none absolute inset-0 rounded-xl border border-white/10 bg-white/[0.04]"
        aria-hidden="true"
      />

      {/* Full-banner shimmer sweep */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            "linear-gradient(110deg, rgba(255,255,255,0) 40%, rgba(255,255,255,0.22) 50%, rgba(255,255,255,0) 60%)",
          backgroundSize: "220% 100%",
          animation: "p2ps-shimmer 4.2s linear infinite",
        }}
      />

      <button
        type="button"
        onClick={handleBannerClick}
        className="group relative flex h-full w-full cursor-pointer items-center justify-between gap-2.5 px-4 py-3 text-left">
        {/* Left — label + title + subtitle */}
        <div className="flex min-w-0 flex-1 flex-col justify-center gap-0.5">
          <div className="flex items-center gap-1.5 whitespace-nowrap">
            <span className="relative inline-flex h-1 w-1">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-300" />
              <span className="relative inline-flex h-1 w-1 rounded-full bg-cyan-300" />
            </span>
            <span className="font-semibold text-[9px] text-cyan-100/90 uppercase tracking-[0.16em]">
              {t("P2P_SWAP_BANNER_LABEL")}
            </span>
          </div>
          <h3
            className="truncate font-bold text-[17px] text-white leading-tight tracking-tight drop-shadow-[0_1px_3px_rgba(0,0,0,0.5)]"
            style={{
              animation:
                "p2ps-enter-title 700ms cubic-bezier(0.16, 1, 0.3, 1) 80ms both",
            }}>
            {t("P2P_SWAP_BANNER_TITLE")}
          </h3>
          <p
            className="line-clamp-2 max-w-[180px] text-[11px] text-cyan-50/75 leading-snug"
            style={{
              animation:
                "p2ps-enter-sub 600ms cubic-bezier(0.16, 1, 0.3, 1) 200ms both",
            }}>
            {t("P2P_SWAP_BANNER_DESCRIPTION")}
          </p>
        </div>

        {/* Right — CTA chip */}
        <div
          className="relative flex size-9 flex-shrink-0 items-center justify-center self-center rounded-full border border-white/30 bg-white/10 text-white backdrop-blur-md transition-all duration-300 group-hover:scale-110 group-hover:border-white/60 group-hover:bg-white/20 group-active:scale-95"
          style={{
            animation:
              "p2ps-cta-pop 700ms cubic-bezier(0.34, 1.56, 0.64, 1) 320ms both",
          }}>
          <ArrowUpRight className="group-hover:-translate-y-0.5 size-4 transition-transform duration-300 group-hover:translate-x-0.5" />
        </div>
      </button>
    </BannerItem>
  );
}
