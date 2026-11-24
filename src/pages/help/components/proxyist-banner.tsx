import { useTranslation } from "react-i18next";
import { BannerItem } from "@/components";
import { useAnalytics, useTypewriter } from "@/hooks";
import { EVENTS } from "@/lib/analytics";

const PROXYIST_URL = "https://app.proxy.ist/help";

// proxy.ist brand palette
const CREAM = "#F1EFEA";
const VIOLET = "#8F88F9";

const EASE_OUT = "cubic-bezier(0.16, 1, 0.3, 1)";

/** proxy.ist mark: two square brackets around a violet dot. */
function ProxyistMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 538 594" className={className} aria-hidden>
      <path fill={CREAM} d="M0 0H204V102H102V492H204V594H0Z" />
      <path fill={CREAM} d="M538 0H334V102H436V492H334V594H538Z" />
      <circle
        cx="269"
        cy="297"
        r="93"
        fill={VIOLET}
        style={{
          transformOrigin: "269px 297px",
          animation: "px-dot 2.4s ease-in-out infinite",
        }}
      />
    </svg>
  );
}

export function ProxyistBanner() {
  const { track } = useAnalytics();
  const { t } = useTranslation();
  const subtitle = t("PROXYIST_BANNER_SUBTITLE");
  const typedSubtitle = useTypewriter(subtitle);

  const handleBannerClick = () => {
    track(EVENTS.FEATURE, {
      status: "banner_clicked",
      bannerName: "proxyist",
      location: "homescreen",
    });
    window.open(PROXYIST_URL, "_blank", "noopener,noreferrer");
  };

  return (
    <BannerItem bgColor="bg-[#141414]">
      <style>{`
        @keyframes px-glow { 0%, 100% { opacity: 0.75; transform: scale(1); } 50% { opacity: 1; transform: scale(1.1); } }
        @keyframes px-dot { 0%, 100% { transform: scale(1); } 50% { transform: scale(0.8); } }
        @keyframes px-ring { 0% { transform: scale(0.5); opacity: 0.5; } 100% { transform: scale(1.9); opacity: 0; } }
        @keyframes px-cursor { 0%, 49% { opacity: 1; } 50%, 100% { opacity: 0; } }
        @keyframes px-enter { 0% { transform: translateY(8px); opacity: 0; } 100% { transform: translateY(0); opacity: 1; } }
        @keyframes px-enter-mark { 0% { transform: scale(0.7); opacity: 0; } 100% { transform: scale(1); opacity: 1; } }
      `}</style>

      {/* Violet glow on the right, as on proxy.ist */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 55% 110% at 90% 55%, rgba(84,72,214,0.5), rgba(84,72,214,0.14) 50%, transparent 78%)",
          animation: "px-glow 8s ease-in-out infinite",
        }}
      />

      {/* Dot grid, fading out towards the left so the headline stays clean */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            "radial-gradient(rgba(241,239,234,0.2) 1px, transparent 1px)",
          backgroundSize: "12px 12px",
          maskImage:
            "linear-gradient(to right, rgba(0,0,0,0.3), rgba(0,0,0,1))",
        }}
      />

      {/* Hairline frame */}
      <div className="pointer-events-none absolute inset-0 rounded-xl ring-1 ring-white/10 ring-inset" />

      <button
        type="button"
        onClick={handleBannerClick}
        className="group relative flex h-full w-full cursor-pointer flex-col justify-between px-4 py-3 text-left">
        {/* Headline, with the brand mark sharing the first line */}
        <h3
          className="min-w-0 font-black text-[clamp(19px,6.3vw,26px)] leading-[1.05] tracking-[-0.01em]"
          style={{
            color: CREAM,
            animation: `px-enter 700ms ${EASE_OUT} both`,
          }}>
          <span className="flex items-center justify-between gap-3">
            <span className="truncate">{t("PROXYIST_BANNER_TITLE")}</span>
            <span
              className="relative flex flex-shrink-0 items-center justify-center transition-transform duration-300 group-hover:scale-110 group-active:scale-95"
              style={{
                animation:
                  "px-enter-mark 700ms cubic-bezier(0.34, 1.56, 0.64, 1) 300ms both",
              }}>
              <span
                className="absolute size-[0.6em] rounded-full border"
                style={{
                  borderColor: VIOLET,
                  animation: "px-ring 2.4s ease-out infinite",
                }}
              />
              <ProxyistMark className="relative h-[1em] w-auto" />
            </span>
          </span>
          <span className="block truncate pb-0.5" style={{ color: VIOLET }}>
            {t("PROXYIST_BANNER_TITLE_ACCENT")}
          </span>
        </h3>

        {/* Footer: typed prompt line + wordmark */}
        <div
          className="flex items-center justify-between gap-2 font-mono"
          style={{ animation: `px-enter 600ms ${EASE_OUT} 160ms both` }}>
          <p
            className="min-w-0 truncate text-[10px]"
            style={{ color: `${CREAM}CC` }}>
            <span className="sr-only">{subtitle}</span>
            <span aria-hidden>
              &gt; {typedSubtitle}
              <span
                className="ml-0.5 inline-block h-[9px] w-[5px] translate-y-px"
                style={{
                  backgroundColor: VIOLET,
                  animation: "px-cursor 1.1s steps(1) infinite",
                }}
              />
            </span>
          </p>
          <span
            className="flex-shrink-0 text-[10px] tracking-wide"
            style={{ color: CREAM }}>
            proxy<span style={{ color: VIOLET }}>(.)</span>ist
          </span>
        </div>
      </button>
    </BannerItem>
  );
}
