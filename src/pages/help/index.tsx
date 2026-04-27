import { ArrowRight, MessagesSquare, Rocket, Settings } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import ASSETS from "@/assets";
import {
  NonHomeHeader,
  SectionHeader,
  useYouTubeVideoDialog,
  YouTubeVideoDialog,
} from "@/components";
import { SocialLinks } from "@/components/social-links";
import { Button } from "@/components/ui/button";
import { useSettings } from "@/contexts";
import { useAnalytics } from "@/hooks";
import { EVENTS } from "@/lib/analytics";
import { INTERNAL_HREFS } from "@/lib/constants";
import { FAQSearchSection } from "./components/faq-search-section";
import { SettingsItem } from "./components/settings-item";
import { VideoGuideBanner } from "./components/video-guide-banner";
import { VideoGuideCard } from "./components/video-guide-card";
import { ALL_VIDEO_GUIDES } from "./constants";

export function Help() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { track } = useAnalytics();
  const {
    settings: { currency },
  } = useSettings();
  const { isOpen, videoUrl, title, isPortrait, openVideo, closeVideo } =
    useYouTubeVideoDialog();

  const handleChatWithUs = () => {
    window.open(
      currency.telegramSupportChannel,
      "_blank",
      "noopener,noreferrer",
    );
  };

  const settingsItems = [
    {
      key: "getting-started",
      title: t("GETTING_STARTED"),
      icon: <Rocket className="size-5 text-primary" />,
    },
    {
      key: "general",
      title: t("GENERAL"),
      icon: <Settings className="size-5 text-primary" />,
    },
    {
      key: "my-limits",
      title: t("MY_LIMITS"),
      icon: <ASSETS.ICONS.SidebarLimits className="size-5 text-primary" />,
    },
    {
      key: "deposits-withdrawals",
      title: t("DEPOSITS_WITHDRAWALS"),
      icon: <ASSETS.ICONS.ActionDeposit className="size-5 text-primary" />,
    },
    {
      key: "refer-and-earn",
      title: t("REFER_AND_EARN"),
      icon: <ASSETS.ICONS.SidebarReferral className="size-5 text-primary" />,
    },
    {
      key: "transactions",
      title: t("TRANSACTIONS"),
      icon: (
        <ASSETS.ICONS.SidebarTransactions className="size-5 text-primary" />
      ),
    },
  ];

  return (
    <>
      <NonHomeHeader title={t("HELP_AND_SUPPORT")} showHelp={false} />
      <main className="no-scrollbar container-narrow flex h-full w-full flex-col gap-2 overflow-y-auto">
        <YouTubeVideoDialog
          isOpen={isOpen}
          onClose={closeVideo}
          videoUrl={videoUrl}
          title={title}
          isPortrait={isPortrait}
        />
        <section className="flex w-full flex-col items-center justify-center gap-4 py-8">
          <div className="my-4 w-full">
            <VideoGuideBanner onVideoOpen={openVideo} />
          </div>
          <div className="flex w-full items-center justify-between gap-4 rounded-lg bg-muted px-4 py-3">
            <span className="font-medium text-sm">{t("NEED_HELP")}</span>
            <Button
              variant="outline"
              onClick={handleChatWithUs}
              className="flex items-center gap-2 rounded-lg border border-primary px-3 py-2 font-medium text-gray-900 text-sm transition-colors hover:bg-gray-50">
              <MessagesSquare className="size-4 text-primary" />
              <span className="text-primary">{t("CHAT_WITH_US")}</span>
              <ArrowRight className="size-3 text-primary" />
            </Button>
          </div>
        </section>

        <section className="flex w-full flex-col justify-between gap-4">
          <SectionHeader
            title={t("HELPFUL_VIDEO_GUIDES")}
            seeAllLink={INTERNAL_HREFS.HELP_HELPFUL_VIDEO_GUIDES}
          />
          <div className="no-scrollbar flex w-full gap-4 overflow-x-auto pb-4">
            {ALL_VIDEO_GUIDES.map((guide) => (
              <VideoGuideCard
                key={guide.id}
                {...guide}
                className="min-w-[160px]"
                onVideoOpen={openVideo}
              />
            ))}
          </div>
        </section>

        <FAQSearchSection />

        <section className="flex w-full flex-col gap-4 pb-4">
          <div className="flex w-full flex-col gap-2">
            {settingsItems.map(({ key, title, icon }) => (
              <SettingsItem
                key={key}
                title={title}
                icon={icon}
                onClick={() => {
                  track(EVENTS.HELP, { status: "opened", section: key });
                  navigate(`${INTERNAL_HREFS.HELP}/${key}`);
                }}
              />
            ))}
          </div>
        </section>

        <section className="flex w-full flex-col gap-4 pb-4">
          <div className="flex w-full flex-col gap-2">
            <h3 className="font-regular text-lg">{t("FIND_US_ON")}</h3>
            <SocialLinks />
          </div>
        </section>
      </main>
    </>
  );
}
