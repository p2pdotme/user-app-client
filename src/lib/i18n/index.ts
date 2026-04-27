import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import { getSettings } from "@/core/client/settings";
import { setMomentLocale } from "@/lib/moment-locale";
import { en } from "./en";
import { es } from "./es";
import { hi } from "./hi";
import { id } from "./id";
import { pt } from "./pt";

const resources = {
  en,
  es,
  // TODO: Verify translations with a native speaker
  pt,
  // TODO: Verify translations with a native speaker
  id,
  // TODO: Verify translations with a native speaker
  hi,
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

i18n.use(initReactI18next).init({
  debug: true,
  lng: initialLanguage,
  fallbackLng: "en",
  resources,
  interpolation: {
    escapeValue: false,
  },
});

// Set initial moment locale
setMomentLocale(initialLanguage);

// Sync moment locale when i18n language changes
i18n.on("languageChanged", (lng: string) => {
  setMomentLocale(lng);
});

export { i18n };
