import { useTranslation } from "react-i18next";
import {
  FAQAccordion,
  NonHomeHeader,
  SectionHeader,
  useYouTubeVideoDialog,
  YouTubeVideoDialog,
} from "@/components";
import { INTERNAL_HREFS } from "@/lib/constants";
import { ChatButton } from "./components/chat-button";
import { VideoGuideBanner } from "./components/video-guide-banner";
import { VideoGuideCard } from "./components/video-guide-card";
import {
  getSupportPageFAQs,
  getSupportPageVideoGuides,
  type SupportPageTitle,
} from "./constants";

export function SupportPage({ title }: { title: string }) {
  const { t } = useTranslation();
  const faqs = getSupportPageFAQs(title as SupportPageTitle);
  const videoGuides = getSupportPageVideoGuides(title as SupportPageTitle);
  const {
    isOpen,
    videoUrl,
    title: videoTitle,
    isPortrait,
    openVideo,
    closeVideo,
  } = useYouTubeVideoDialog();

  return (
    <>
      <NonHomeHeader title={t("HELP_AND_SUPPORT")} showHelp={false} />
      <main className="no-scrollbar container-narrow flex h-full w-full flex-col gap-2 overflow-y-auto">
        <div className="flex flex-1 flex-col gap-2">
          <section className="flex w-full flex-col items-center justify-center gap-4 py-8">
            <h3 className="font-medium text-lg">
              {t(title.toUpperCase().replace(/-/g, "_"))}
            </h3>
            {title === "getting-started" && (
              <div className="my-4 w-full">
                <VideoGuideBanner onVideoOpen={openVideo} />
              </div>
            )}
          </section>

          <section className="flex w-full flex-col justify-between gap-4">
            <SectionHeader
              title={t("HELPFUL_VIDEO_GUIDES")}
              seeAllLink={INTERNAL_HREFS.HELP_HELPFUL_VIDEO_GUIDES}
            />

            <div className="no-scrollbar flex w-full gap-4 overflow-x-auto pb-4">
              {videoGuides.map((guide) => (
                <VideoGuideCard
                  key={guide.id}
                  {...guide}
                  className="min-w-[160px]"
                  onVideoOpen={openVideo}
                />
              ))}
            </div>
          </section>

          <section className="flex w-full flex-col justify-between gap-4 py-4">
            <SectionHeader
              title={t("FAQS")}
              seeAllLink={INTERNAL_HREFS.HELP_FAQS_SEARCH}
            />
            <div className="relative w-full">
              <FAQAccordion faqs={faqs} showAll={true} />
            </div>
          </section>
        </div>

        <section className="mt-auto flex w-full flex-row items-center justify-between gap-4 py-4">
          <span className="w-1/2 font-regular text-sm">
            {t("DIDNT_FIND_WHAT_YOU_RE_LOOKING_FOR")}
          </span>
          <ChatButton className="w-1/2" />
        </section>
      </main>

      <YouTubeVideoDialog
        isOpen={isOpen}
        onClose={closeVideo}
        videoUrl={videoUrl}
        title={videoTitle}
        isPortrait={isPortrait}
      />
    </>
  );
}
