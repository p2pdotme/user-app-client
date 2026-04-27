import moment from "moment";

// Import our custom ES module locale files
// These register the locales with moment.defineLocale()
import "./moment-locales";

/**
 * Maps i18n language codes to moment locale codes
 * Supports both short codes (e.g., 'en', 'pt') and full locales (e.g., 'en-IN', 'pt-BR')
 */
const LANGUAGE_TO_MOMENT_LOCALE: Record<string, string> = {
  // Short codes
  en: "en",
  es: "es",
  pt: "pt-br", // Portuguese Brazil
  id: "id", // Indonesian
  hi: "hi", // Hindi
  // Full locale codes (for compatibility)
  "en-IN": "en",
  "es-ES": "es",
  "pt-BR": "pt-br",
  "id-ID": "id",
  "hi-IN": "hi",
};

/**
 * Sets the moment locale based on the i18n language code
 * @param languageCode - The i18n language code (e.g., 'en', 'es', 'pt', 'pt-BR')
 */
export function setMomentLocale(languageCode: string): void {
  // Try exact match first, then try extracting the base language code
  const momentLocale =
    LANGUAGE_TO_MOMENT_LOCALE[languageCode] ??
    LANGUAGE_TO_MOMENT_LOCALE[languageCode.split("-")[0]] ??
    "en";
  moment.locale(momentLocale);
  console.log(
    `[MomentLocale] Set moment locale to "${momentLocale}" for language "${languageCode}"`,
  );
}

/**
 * Gets the current moment locale
 */
export function getMomentLocale(): string {
  return moment.locale();
}
