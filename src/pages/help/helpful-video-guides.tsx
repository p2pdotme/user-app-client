import { useTranslation } from "react-i18next";
import {
  NonHomeHeader,
  useYouTubeVideoDialog,
  YouTubeVideoDialog,
} from "@/components";
import { getScreenType } from "@/lib/utils";
import { VideoGuideCard } from "./components/video-guide-card";
import { ALL_VIDEO_GUIDES } from "./constants";

export function HelpfulVideoGuides() {
  const { t } = useTranslation();
  const { isOpen, videoUrl, title, isPortrait, openVideo, closeVideo } =
    useYouTubeVideoDialog();
  const isPhone = getScreenType() === "phone";

  return (
    <>
      <NonHomeHeader title={t("HELPFUL_VIDEO_GUIDES")} showHelp={false} />
      <main className="container-narrow flex h-full w-full flex-col gap-6 overflow-y-auto py-6">
        <div className="flex flex-wrap gap-6">
          {ALL_VIDEO_GUIDES.map((guide) => (
            <VideoGuideCard
              key={guide.id}
              {...guide}
              onVideoOpen={openVideo}
              small={isPhone}
            />
          ))}
        </div>
      </main>

      <YouTubeVideoDialog
        isOpen={isOpen}
        onClose={closeVideo}
        videoUrl={videoUrl}
        title={title}
        isPortrait={isPortrait}
      />
    </>
  );
}
