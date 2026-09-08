import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useLocation } from "react-router";

const SITE_NAME = "P2P.me";
const SITE_ORIGIN = "https://app.p2p.me";
const DEFAULT_TITLE = "P2P.me - Pay with USDC at any QR";

interface PageMeta {
  /** Page-specific title; rendered as "<title> | P2P.me". Omit for the default title. */
  title?: string;
  /** Page-specific description; falls back to SEO_DESCRIPTION_DEFAULT. */
  description?: string;
}

const setMetaContent = (selector: string, content: string) => {
  const el = document.head.querySelector<HTMLMetaElement>(selector);
  if (el) el.setAttribute("content", content);
};

const setCanonical = (href: string) => {
  const el = document.head.querySelector<HTMLLinkElement>(
    'link[rel="canonical"]',
  );
  if (el) el.setAttribute("href", href);
};

/**
 * Keeps document <title>, description, Open Graph / Twitter tags and the
 * canonical URL in sync with the current route and language.
 */
export function usePageMeta({ title, description }: PageMeta = {}) {
  const { t, i18n } = useTranslation();
  const { pathname } = useLocation();

  useEffect(() => {
    const fullTitle = title ? `${title} | ${SITE_NAME}` : DEFAULT_TITLE;
    const desc = description ?? t("SEO_DESCRIPTION_DEFAULT");

    document.title = fullTitle;
    setMetaContent('meta[name="description"]', desc);
    setMetaContent('meta[property="og:title"]', fullTitle);
    setMetaContent('meta[property="og:description"]', desc);
    setMetaContent('meta[name="twitter:title"]', fullTitle);
    setMetaContent('meta[name="twitter:description"]', desc);
    setCanonical(`${SITE_ORIGIN}${pathname === "/" ? "/" : pathname}`);
    setMetaContent('meta[property="og:url"]', `${SITE_ORIGIN}${pathname}`);

    return () => {
      document.title = DEFAULT_TITLE;
    };
  }, [title, description, pathname, t, i18n.language]);
}
