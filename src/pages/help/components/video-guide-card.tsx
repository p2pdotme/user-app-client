import { useTranslation } from "react-i18next";
import { useAnalytics } from "@/hooks";
import { EVENTS } from "@/lib/analytics";
import { cn } from "@/lib/utils";

interface VideoGuideCardProps {
  id: string;
  titleKey: string;
  linkKey?: string; // legacy fallback
  links?: Partial<Record<string, string>>;
  thumbnails?: Partial<Record<string, string>>;
  isPortrait?: boolean;
  className?: string;
  excludedFrom?: string[];
  onVideoOpen?: (url: string, title: string, portrait?: boolean) => void;
  small?: boolean;
}

export const VideoGuideCard = ({
  id,
  titleKey,
  linkKey,
  links,
  thumbnails,
  isPortrait,
  className,
  excludedFrom,
  onVideoOpen,
  small = true,
}: VideoGuideCardProps) => {
  const { track } = useAnalytics();
  const { t, i18n } = useTranslation();
  const cardHeight = small ? 90 : 120;

  const isExcluded = excludedFrom?.includes(i18n.language);

  if (isExcluded) {
    return null;
  }

  const resolveLang = () => {
    const lang = i18n.language || "en";
    // support cases like en-US
    const base = lang.split("-")[0];
    return { lang, base };
  };

  const getPreferredLink = () => {
    if (links) {
      const { lang, base } = resolveLang();
      return (
        links[lang] ||
        links[base] ||
        links.en ||
        links.hi ||
        links.pt ||
        links.id
      );
    }
    // legacy: direct url in linkKey
    if (linkKey?.startsWith("http")) return linkKey;
    // legacy: translation key (discouraged)
    if (linkKey) {
      const translated = t(linkKey);
      if (translated && translated !== linkKey) return translated as string;
    }
    return undefined;
  };

  const transformDriveThumbnail = (url: string) => {
    // Convert google drive sharing link to direct viewable content link
    // e.g., https://drive.google.com/file/d/<id>/view?usp=... -> https://drive.google.com/uc?export=view&id=<id>
    const match = url.match(/drive\.google\.com\/file\/d\/([^/]+)\/view/);
    if (match) {
      return `https://drive.google.com/uc?export=view&id=${match[1]}`;
    }
    return url;
  };

  const getPreferredThumbnail = () => {
    if (thumbnails) {
      const { lang, base } = resolveLang();
      const thumb =
        thumbnails[lang] ||
        thumbnails[base] ||
        thumbnails.en ||
        thumbnails.hi ||
        thumbnails.pt ||
        thumbnails.id;
      if (thumb) return transformDriveThumbnail(thumb);
    }
  };

  const handleClick = () => {
    track(EVENTS.HELP, {
      status: "video_guide_clicked",
      videoId: id,
      videoTitle: titleKey,
      location: "help_section",
    });

    const url = getPreferredLink();
    if (!url) return;
    if (onVideoOpen) {
      onVideoOpen(url, t(titleKey), Boolean(isPortrait));
    } else {
      window.open(url, "_blank");
    }
  };

  return (
    <div
      className={cn(
        "flex w-[calc(50%-12px)] cursor-pointer flex-col gap-2",
        className,
      )}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          handleClick();
        }
      }}>
      <div
        className="relative w-full overflow-hidden rounded-md"
        style={{ height: `${cardHeight}px` }}>
        <img
          src={getPreferredThumbnail()}
          alt={t(titleKey)}
          className="h-full w-full object-cover"
        />
      </div>
      <p className="font-regular text-sm">{t(titleKey)}</p>
    </div>
  );
};
