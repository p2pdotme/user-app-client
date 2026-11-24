import { Check } from "lucide-react";
import { useTranslation } from "react-i18next";
import { BannerItem } from "@/components";
import { useAnalytics } from "@/hooks";
import { EVENTS } from "@/lib/analytics";

const PROXYIST_URL = "https://app.proxy.ist/help";

// proxy.ist brand palette
const CREAM = "#F1EFEA";
const VIOLET = "#8F88F9";
const GREEN = "#5DBB8A";

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
        @keyframes px-glow { 0%, 100% { opacity: 0.75; transform: scale(1); } 50% { opacity: 1; transform: scale(1.08); } }
        @keyframes px-dot { 0%, 100% { transform: scale(1); } 50% { transform: scale(0.82); } }
        @keyframes px-enter { 0% { transform: translateY(6px); opacity: 0; } 100% { transform: translateY(0); opacity: 1; } }
      `}</style>

      {/* Violet glow on the right, as on proxy.ist */}
      <div
        className="pointer-events-none absolute inset-y-0 right-0 w-2/3"
        style={{
          background:
            "radial-gradient(ellipse at 70% 50%, rgba(72,62,190,0.55), rgba(72,62,190,0.18) 45%, transparent 72%)",
          animation: "px-glow 8s ease-in-out infinite",
        }}
      />

      {/* Dot grid */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            "radial-gradient(rgba(241,239,234,0.16) 1px, transparent 1px)",
          backgroundSize: "14px 14px",
        }}
      />

      <button
        type="button"
        onClick={handleBannerClick}
        className="group relative flex h-full w-full cursor-pointer items-center justify-between gap-3 px-4 py-3 text-left">
        <div className="flex min-w-0 flex-1 flex-col justify-center">
          <span
            className="truncate font-mono text-[9px]r"
            style={{
              color: `${CREAM}99`,
              animation: "px-enter 600ms cubic-bezier(0.16, 1, 0.3, 1) both",
            }}>
            &gt; {t("PROXYIST_BANNER_LABEL")}
          </span>
          <h3
            className="mt-0.5 font-black text-[19px] leading-[1.05] tracking-tighter"
            style={{
              color: CREAM,
              animation:
                "px-enter 700ms cubic-bezier(0.16, 1, 0.3, 1) 120ms both",
            }}>
            <span className="block truncate">{t("PROXYIST_BANNER_TITLE")}</span>
            <span className="block truncate" style={{ color: VIOLET }}>
              {t("PROXYIST_BANNER_TITLE_ACCENT")}
            </span>
          </h3>
          <p
            className="mt-1 flex items-center gap-1 truncate font-mono text-[9px]"
            style={{
              color: CREAM,
              animation:
                "px-enter 600ms cubic-bezier(0.16, 1, 0.3, 1) 240ms both",
            }}>
            <span className="truncate">
              &gt; {t("PROXYIST_BANNER_SUBTITLE")}
            </span>
            <span style={{ color: GREEN }}>·</span>
            <span
              className="flex flex-shrink-0 items-center gap-0.5"
              style={{ color: GREEN }}>
              {t("PROXYIST_BANNER_PROOF")}
              <Check className="size-2.5" strokeWidth={3} />
            </span>
          </p>
        </div>

        {/* Brand mark + wordmark */}
        <div className="flex flex-shrink-0 flex-col items-center gap-1.5 self-center transition-transform duration-300 group-hover:scale-105 group-active:scale-95">
          <ProxyistMark className="h-11 w-auto" />
          <span
            className="font-mono text-[10px] tracking-wide"
            style={{ color: CREAM }}>
            proxy<span style={{ color: VIOLET }}>(.)</span>ist
          </span>
        </div>
      </button>
    </BannerItem>
  );
}
