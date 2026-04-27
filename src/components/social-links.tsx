import { Link } from "react-router";
import ASSETS from "@/assets";
import { useSettings } from "@/contexts";
import { useAnalytics } from "@/hooks";
import { EVENTS } from "@/lib/analytics";

export function SocialLinks() {
  const { track } = useAnalytics();
  const {
    settings: { currency },
  } = useSettings();

  const handleSocialClick = (platform: string, url: string) => {
    track(EVENTS.HELP, {
      status: "social_link_clicked",
      platform,
      url,
      location: "help_section",
    });
  };

  return (
    <div className={`flex items-center gap-6`}>
      <Link
        to={`https://x.com/${currency.twitterUsername}`}
        target="_blank"
        onClick={() =>
          handleSocialClick(
            "twitter",
            `https://x.com/${currency.twitterUsername}`,
          )
        }>
        <ASSETS.ICONS.Twitter className="size-5 text-primary" />
      </Link>
      <Link
        to={currency.telegramSupportChannel}
        target="_blank"
        onClick={() =>
          handleSocialClick("telegram", currency.telegramSupportChannel)
        }>
        <ASSETS.ICONS.Telegram className="size-5 text-primary" />
      </Link>
    </div>
  );
}
