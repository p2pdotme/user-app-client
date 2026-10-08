import type { CurrencyCode as CurrencyType } from "@p2pdotme/sdk";
import {
  COUNTRY_OPTIONS,
  CURRENCY_META_DATA,
  LANGUAGE_OPTIONS,
} from "@/lib/constants";

type CurrencyOption = (typeof COUNTRY_OPTIONS)[number];
type LanguageOption = (typeof LANGUAGE_OPTIONS)[number];

const DEFAULT_LANGUAGE_CODE = "en";

// Markets that settle in EUR but aren't the SDK's reference locale (de-DE).
const EUROZONE_COUNTRIES = [
  "AT",
  "BE",
  "CY",
  "DE",
  "EE",
  "ES",
  "FI",
  "FR",
  "GR",
  "HR",
  "IE",
  "IT",
  "LT",
  "LU",
  "LV",
  "MT",
  "NL",
  "PT",
  "SI",
  "SK",
  "AD",
  "MC",
  "SM",
  "VA",
  "ME",
  "XK",
] as const;

// IANA timezone → market currency, matched by prefix so 'America/Argentina/Buenos_Aires'
// hits 'America/Argentina'. Timezone is the best offline location proxy — phones abroad
// often keep en-US as their language.
const TIMEZONE_CURRENCIES: [zonePrefix: string, currency: CurrencyType][] = [
  ["Asia/Kolkata", "INR"],
  ["Asia/Calcutta", "INR"],
  ["Asia/Jakarta", "IDR"],
  ["Asia/Pontianak", "IDR"],
  ["Asia/Makassar", "IDR"],
  ["Asia/Jayapura", "IDR"],
  ["Africa/Lagos", "NGN"],
  ["Africa/Nairobi", "KES"],
  ["Africa/Cairo", "EGP"],
  ["America/Argentina", "ARS"],
  ["America/Bogota", "COP"],
  ["America/Lima", "PEN"],
  ["America/Guayaquil", "ECU"],
  ["America/Caracas", "VEN"],
  ["America/Havana", "CUP"],
  ["America/La_Paz", "BOB"],
  ["Asia/Manila", "PHP"],
  ["America/Sao_Paulo", "BRL"],
  ["America/Bahia", "BRL"],
  ["America/Fortaleza", "BRL"],
  ["America/Recife", "BRL"],
  ["America/Belem", "BRL"],
  ["America/Manaus", "BRL"],
  ["America/Campo_Grande", "BRL"],
  ["America/Cuiaba", "BRL"],
  ["America/Mexico_City", "MEX"],
  ["America/Cancun", "MEX"],
  ["America/Merida", "MEX"],
  ["America/Monterrey", "MEX"],
  ["America/Chihuahua", "MEX"],
  ["America/Ciudad_Juarez", "MEX"],
  ["America/Hermosillo", "MEX"],
  ["America/Mazatlan", "MEX"],
  ["America/Tijuana", "MEX"],
];

/** Region subtag of a BCP-47 locale ("es-AR" → "AR"), uppercased. */
const regionOf = (locale: string | undefined): string | undefined =>
  locale?.split("-")[1]?.toUpperCase();

/** Language subtag of a BCP-47 locale ("es-AR" → "es"), lowercased. */
const languageOf = (locale: string | undefined): string | undefined =>
  locale?.split("-")[0]?.toLowerCase();

// ISO-2 country code → market currency, derived from each enabled SDK market's
// reference locale (en-IN → IN, es-AR → AR, …) plus the wider eurozone. Used for
// both Netlify edge geolocation and BCP-47 locale region subtags (same code space).
const COUNTRY_CURRENCIES: Readonly<Record<string, CurrencyType>> = {
  ...Object.fromEntries(EUROZONE_COUNTRIES.map((code) => [code, "EUR"])),
  ...Object.fromEntries(
    COUNTRY_OPTIONS.flatMap((option) => {
      const region = regionOf(option.locale);
      return region ? [[region, option.currency]] : [];
    }),
  ),
};

// ISO-2 country code → app language, derived from each market's reference locale
// (es-AR → es, pt-BR → pt). Markets whose locale language the app doesn't ship
// (de-DE) are left out so detection falls back to the browser language.
const COUNTRY_LANGUAGES: Readonly<Record<string, LanguageOption>> =
  Object.fromEntries(
    COUNTRY_OPTIONS.flatMap((option) => {
      const region = regionOf(option.locale);
      const language = LANGUAGE_OPTIONS.find(
        (l) => l.code === languageOf(option.locale),
      );
      return region && language ? [[region, language]] : [];
    }),
  );

/** Market currency for an ISO-2 country code; undefined outside supported markets. */
export function currencyForCountry(code: string): CurrencyOption | undefined {
  const currency = COUNTRY_CURRENCIES[code.toUpperCase()];
  return currency ? CURRENCY_META_DATA[currency] : undefined;
}

/** App language spoken in an ISO-2 country; undefined when unknown or unsupported. */
export function languageForCountry(code: string): LanguageOption | undefined {
  return COUNTRY_LANGUAGES[code.toUpperCase()];
}

const browserLocales = (): string[] =>
  typeof navigator === "undefined"
    ? []
    : (navigator.languages ?? [navigator.language]).filter(Boolean);

/**
 * Best-effort local guess of the user's country — no network, no geo-IP.
 * Timezone first (phones abroad often keep en-US as their language), then the
 * region subtag of the browser locales.
 */
export function detectCountryLocal(): string | undefined {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const currency = tz
      ? TIMEZONE_CURRENCIES.find(([zone]) => tz.startsWith(zone))?.[1]
      : undefined;
    const region = currency
      ? regionOf(CURRENCY_META_DATA[currency]?.locale)
      : undefined;
    if (region) return region;
  } catch {
    // Intl not available — fall through to locale detection
  }

  return browserLocales()
    .map(regionOf)
    .find((region) => region && COUNTRY_CURRENCIES[region]);
}

/**
 * Best-effort local detection of the user's market currency.
 * Returns undefined when the user isn't in (or doesn't hint at) a supported market.
 */
export function detectCurrency(): CurrencyOption | undefined {
  const country = detectCountryLocal();
  return country ? currencyForCountry(country) : undefined;
}

/**
 * Resolve the app language for a user in `country` (ISO-2, geo or local guess).
 *
 * An explicit non-English browser language wins — browsers default to en-US
 * worldwide, so English alone is a weak signal, but a user who switched their
 * device to Hindi or Spanish has told us what they read. Otherwise the market's
 * language, then the browser language, then English.
 */
export function resolveLanguage(country?: string | null): LanguageOption {
  const browserLanguage = browserLocales()
    .map(languageOf)
    .map((code) => LANGUAGE_OPTIONS.find((l) => l.code === code))
    .find(Boolean);

  if (browserLanguage && browserLanguage.code !== DEFAULT_LANGUAGE_CODE) {
    return browserLanguage;
  }

  const marketLanguage = country ? languageForCountry(country) : undefined;
  return (
    marketLanguage ??
    browserLanguage ??
    LANGUAGE_OPTIONS.find((l) => l.code === DEFAULT_LANGUAGE_CODE) ??
    LANGUAGE_OPTIONS[0]
  );
}

/** Local (offline) language guess: browser language, then timezone-derived market. */
export function detectLanguage(): LanguageOption {
  return resolveLanguage(detectCountryLocal());
}
