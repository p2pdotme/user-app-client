import i18n, { type BackendModule, type ResourceKey } from "i18next";
import { initReactI18next } from "react-i18next";
import { getSettings } from "@/core/client/settings";
import { setMomentLocale } from "@/lib/moment-locale";
import { en } from "./en";

// English is bundled (it is also the fallback language). Every other locale is
// a separate chunk that is downloaded only when that language is in use, so
// users don't pay to download and parse five translation files at startup.
const resources = { en };

const LAZY_LOCALES: Record<
  string,
  () => Promise<{ translation: ResourceKey }>
> = {
  es: () => import("./es").then((m) => m.es),
  // TODO: Verify translations with a native speaker
  pt: () => import("./pt").then((m) => m.pt),
  // TODO: Verify translations with a native speaker
  id: () => import("./id").then((m) => m.id),
  // TODO: Verify translations with a native speaker
  hi: () => import("./hi").then((m) => m.hi),
};

const lazyLocaleBackend: BackendModule = {
  type: "backend",
  init() {},
  read(language, _namespace, callback) {
    const load = LAZY_LOCALES[language] ?? LAZY_LOCALES[language.split("-")[0]];
    if (!load) {
      // Unknown language (or English, which is bundled): nothing to load.
      callback(null, {});
      return;
    }
    load()
      .then((bundle) => callback(null, bundle.translation))
      .catch((error: Error) => callback(error, null));
  },
};

// Get the saved language from settings
const getInitialLanguage = () => {
  try {
    const settingsResult = getSettings();
    if (settingsResult.isOk()) {
      // Map language code to i18n locale code
      const languageCode = settingsResult.value.language.code;
      return languageCode;
    }
  } catch (error) {
    console.warn("Failed to load language from settings:", error);
  }
  return "en"; // fallback to English
};

const initialLanguage = getInitialLanguage();

/**
 * Resolves once the initial language's translations are available. `main.tsx`
 * awaits this before the first render so non-English users don't see a flash
 * of English text.
 */
export const i18nReady = i18n
  .use(lazyLocaleBackend)
  .use(initReactI18next)
  .init({
    debug: import.meta.env.DEV,
    lng: initialLanguage,
    fallbackLng: "en",
    resources,
    // Keep the bundled English resources and load the rest via the backend.
    partialBundledLanguages: true,
    interpolation: {
      escapeValue: false,
    },
    // Language switches load the new locale first and then re-render; don't
    // suspend the whole tree while that happens.
    react: { useSuspense: false },
  });

const syncDocumentLanguage = (lng: string) => {
  if (typeof document !== "undefined") {
    document.documentElement.lang = lng;
  }
};

// Set initial moment locale and <html lang>
setMomentLocale(initialLanguage);
syncDocumentLanguage(initialLanguage);

// Sync moment locale and <html lang> when i18n language changes
i18n.on("languageChanged", (lng: string) => {
  setMomentLocale(lng);
  syncDocumentLanguage(lng);
});

export { i18n };
