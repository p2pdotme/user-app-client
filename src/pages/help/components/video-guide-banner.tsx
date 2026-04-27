import { PlayCircle } from "lucide-react";
import { useTranslation } from "react-i18next";
import ASSETS from "@/assets";
import { BannerItem } from "@/components";
import { useAnalytics } from "@/hooks";
import { EVENTS } from "@/lib/analytics";
import { ALL_VIDEO_GUIDES } from "../constants";

interface VideoGuideBannerProps {
  onVideoOpen: (url: string, title: string, portrait?: boolean) => void;
}

export function VideoGuideBanner({ onVideoOpen }: VideoGuideBannerProps) {
  const { t, i18n } = useTranslation();
  const { track } = useAnalytics();

  const handleBannerClick = () => {
    // Track the banner click
    track(EVENTS.HELP, {
      status: "banner_clicked",
      bannerName: "quick_app_tour_video_guide",
    });

    // Open the app tour video using the first video guide
    const appTourVideo = ALL_VIDEO_GUIDES[0];
    const lang = i18n.language || "en";
    const base = lang.split("-")[0];
    const url =
      (appTourVideo.links &&
        (appTourVideo.links[lang] ||
          appTourVideo.links[base] ||
          appTourVideo.links.en ||
          appTourVideo.links.hi ||
          appTourVideo.links.pt ||
          appTourVideo.links.id)) ||
      appTourVideo.linkKey ||
      "";
    onVideoOpen(url, t(appTourVideo.titleKey), appTourVideo.isPortrait);
  };

  return (
    <BannerItem bgImage={ASSETS.IMAGES.HOME_GUIDE_BANNER_BG}>
      <div
        className="relative flex h-full w-full cursor-pointer items-center justify-center"
        onClick={handleBannerClick}
        role="button"
        tabIndex={0}>
        {/* Centered Play Button */}
        <div className="absolute inset-0 flex items-center justify-center">
          <PlayCircle className="size-12 text-white" />
        </div>

        {/* Bottom Left Text */}
        <div className="absolute bottom-4 left-4 z-10">
          <h3 className="font-medium text-sm text-white">
            {t("QUICK_APP_TOUR_BANNER_TITLE")}
          </h3>
        </div>
      </div>
    </BannerItem>
  );
}
