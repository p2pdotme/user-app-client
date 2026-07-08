import { ArrowRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import CoinsmeIconDark from "@/assets/icons/coinsme-icon-dark.svg";
import CoinsmeIconLight from "@/assets/icons/coinsme-icon-light.svg";
import { useAnalytics } from "@/hooks";
import { EVENTS } from "@/lib/analytics";
import { cn } from "@/lib/utils";

const COINSME_URL = "https://app.coins.me";

interface CoinsmeButtonProps {
  location?: string;
  withCaption?: boolean;
}

export function CoinsmeButton({
  location = "home_header",
  withCaption = false,
}: CoinsmeButtonProps) {
  const { t } = useTranslation();
  const { track } = useAnalytics();

  const handleClick = () => {
    track(EVENTS.FEATURE, {
      status: "cta_clicked",
      bannerName: "coinsme_promo",
      location,
    });
    window.open(COINSME_URL, "_blank", "noopener,noreferrer");
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className="flex cursor-pointer flex-col items-center gap-1 transition-transform duration-200 hover:scale-105 active:scale-95">
      <img
        src={CoinsmeIconLight}
        alt=""
        className={cn(
          "rounded-xl dark:hidden",
          withCaption ? "size-12" : "size-9",
        )}
      />
      <img
        src={CoinsmeIconDark}
        alt=""
        className={cn(
          "hidden rounded-xl dark:block",
          withCaption ? "size-12" : "size-9",
        )}
      />
      {withCaption ? (
        <span className="flex items-center gap-0.5 font-medium text-[#4D66F4] text-xs">
          {t("TRY_NOW")}
          <ArrowRight className="size-3" />
        </span>
      ) : (
        <span className="sr-only">{t("COINSME_DRAWER_TITLE")}</span>
      )}
    </button>
  );
}
