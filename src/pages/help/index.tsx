import {
  ArrowRight,
  Bot,
  ExternalLink,
  MessagesSquare,
  Rocket,
  Settings,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import ASSETS from "@/assets";
import {
  NonHomeHeader,
  SectionHeader,
  SupportWidget,
  useYouTubeVideoDialog,
  YouTubeVideoDialog,
} from "@/components";
import { SocialLinks } from "@/components/social-links";
import { Button } from "@/components/ui/button";
import { useSettings } from "@/contexts";
import { useAnalytics, usePageMeta, useThirdweb } from "@/hooks";
import { EVENTS } from "@/lib/analytics";
import { INTERNAL_HREFS } from "@/lib/constants";
import {
  canOpenSupportHumanChat,
  openAiSupportChat,
  openSupportHumanChat,
} from "@/lib/support-chat";
import { FAQSearchSection } from "./components/faq-search-section";
import { SettingsItem } from "./components/settings-item";
import { VideoGuideBanner } from "./components/video-guide-banner";
import { VideoGuideCard } from "./components/video-guide-card";
import { ALL_VIDEO_GUIDES } from "./constants";

export function Help() {
  const { t } = useTranslation();
  usePageMeta({
    title: t("HELP_AND_SUPPORT"),
    description: t("SEO_DESCRIPTION_HELP"),
  });
  const navigate = useNavigate();
  const { track } = useAnalytics();
  const {
    settings: { currency },
  } = useSettings();
  const { account } = useThirdweb();
  const { isOpen, videoUrl, title, isPortrait, openVideo, closeVideo } =
    useYouTubeVideoDialog();

  // "Chat with us" opens the support widget on its human thread, not Telegram.
  // A Telegram group is a room ops may or may not be watching; the widget's
  // thread lands in the ops support queue as a ticket with the user's wallet
  // attached. The group is still one tap away — the widget renders it as a row
  // under the "Chat with support" card (see lib/support-chat.ts).
  //
  // No human chat to open (logged out, or no chain id yet so no signer): fall
  // back to the Telegram group, synchronously, so the popup stays inside the
  // click gesture. A failed widget load says so rather than doing nothing.
  const handleChatWithUs = () => {
    track(EVENTS.HELP, { status: "chat_with_us_clicked" });
    if (!canOpenSupportHumanChat()) {
      handleTelegramSupport();
      return;
    }
    openSupportHumanChat(currency.currency || "global", account?.address).catch(
      () => toast.error(t("SOMETHING_WENT_WRONG")),
    );
  };

  // The market's Telegram group, kept beside "Chat with us" rather than behind
  // it. Both doors are on the card; the styling is what separates them —
  // "Chat with us" carries the primary border because it lands in the ops
  // support queue as a ticket, Telegram is the neutral community fallback.
  const handleTelegramSupport = () => {
    track(EVENTS.HELP, {
      status: "telegram_support_clicked",
      url: currency.telegramSupportChannel,
    });
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
      {/* Mount the AI support chat launcher only here, on the Help & Support
          page — it tears down on navigation away so the floating icon isn't
          shown across the rest of the app. */}
      {/* Mounts the AI launcher and wires the wallet signer so its built-in
          "Talk to a human" action opens a live order-less support thread. */}
      <SupportWidget />
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
          {/* flex-wrap, not a fixed row: "Chat with us" + "Chat on Telegram"
              side by side overflow a narrow phone next to the label, so the
              button pair drops to its own full-width line instead of squashing
              both labels to an ellipsis. */}
          <div className="flex w-full flex-wrap items-center justify-between gap-3 rounded-lg bg-muted px-4 py-3">
            <span className="font-medium text-sm">{t("NEED_HELP")}</span>
            <div className="flex flex-1 flex-wrap items-center justify-end gap-2">
              <Button
                variant="outline"
                onClick={handleChatWithUs}
                className="flex items-center gap-2 rounded-lg border border-primary px-3 py-2 font-medium text-gray-900 text-sm transition-colors hover:bg-gray-50">
                <MessagesSquare className="size-4 text-primary" />
                <span className="text-primary">{t("CHAT_WITH_US")}</span>
                <ArrowRight className="size-3 text-primary" />
              </Button>
              <Button
                variant="outline"
                onClick={handleTelegramSupport}
                className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 font-medium text-muted-foreground text-sm transition-colors hover:border-primary/50 hover:text-foreground">
                <ASSETS.ICONS.Telegram className="size-4" />
                <span>{t("CHAT_ON_TELEGRAM")}</span>
                <ExternalLink className="size-3" />
              </Button>
            </div>
          </div>
          <button
            type="button"
            onClick={() =>
              openAiSupportChat(currency.currency || "global", account?.address)
            }
            className="flex w-full items-center justify-between gap-4 rounded-lg bg-primary/10 px-4 py-3 transition-colors hover:bg-primary/15">
            <div className="flex items-center gap-2">
              <Bot className="size-4 text-primary" />
              <span className="font-medium text-primary text-sm">
                {t("ASK_AI_ASSISTANT")}
              </span>
            </div>
            <ArrowRight className="size-3 text-primary" />
          </button>
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
