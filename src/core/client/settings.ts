import type { CurrencyCode as CurrencyType } from "@p2pdotme/sdk";
import { err, type Result } from "neverthrow";
import { z } from "zod";
import {
  COUNTRY_OPTIONS,
  CURRENCY_META_DATA,
  LANGUAGE_OPTIONS,
  STORAGE_KEYS,
  SUPPORTED_CURRENCIES,
} from "@/lib/constants";
import { type AppError, createAppError } from "@/lib/errors";
import {
  loadFromStorageWithMigrations,
  saveStrictToStorage,
} from "@/lib/storage-model";

export type SettingsError = AppError<"Settings">;

// Available themes - easily extensible by adding new themes here
export const AVAILABLE_THEMES = ["light", "dark", "system"] as const;

// Zod schemas for settings validation
// Derived from COUNTRY_OPTIONS so adding a new currency only requires updating the SDK
const enumFrom = (
  key:
    | "country"
    | "currency"
    | "flag"
    | "symbolNative"
    | "locale"
    | "paymentMethod"
    | "paymentAddressName"
    | "telegramSupportChannel"
    | "twitterUsername",
): [string, ...string[]] =>
  COUNTRY_OPTIONS.map((c) => String(c[key])) as [string, ...string[]];

const CurrencySchema = z.object({
  country: z.enum(enumFrom("country")),
  currency: z.enum(SUPPORTED_CURRENCIES),
  internationalFormat: z.string().optional(),
  flag: z.enum(enumFrom("flag")),
  symbolNative: z.enum(enumFrom("symbolNative")),
  locale: z.enum(enumFrom("locale")),
  paymentMethod: z.enum(enumFrom("paymentMethod")),
  paymentAddressName: z.enum(enumFrom("paymentAddressName")),
  telegramSupportChannel: z.enum(enumFrom("telegramSupportChannel")),
  twitterUsername: z.enum(enumFrom("twitterUsername")),
  smsCountryCodes: z.array(z.string()).readonly().optional(),
  precision: z.number(),
  isAlpha: z.boolean(),
});

const LanguageSchema = z.object({
  code: z.enum(["en", "es", "id", "pt", "hi"]),
  name: z.enum([
    "English",
    "Spanish",
    "Indonesian",
    "Portuguese (Brazil)",
    "Hindi",
  ]),
  nameNative: z.enum([
    "English",
    "Español",
    "Bahasa Indonesia",
    "Português (Brasil)",
    "हिन्दी",
  ]),
  locale: z.enum(["en-IN", "es-ES", "id-ID", "pt-BR", "hi-IN"]),
});

const ThemeSchema = z.enum(AVAILABLE_THEMES);

const SettingsSchema = z.object({
  currency: CurrencySchema,
  language: LanguageSchema,
  theme: ThemeSchema,
  sounds: z.boolean(),
  haptics: z.enum(["all", "essential", "none"]),
  devMode: z.boolean(),
  isCurrencyConfirmed: z.boolean(),
});

export type Currency = z.infer<typeof CurrencySchema>;
export type Language = z.infer<typeof LanguageSchema>;
export type Theme = z.infer<typeof ThemeSchema>;
export type Settings = z.infer<typeof SettingsSchema>;

/**
 * Get the resolved theme mode (handles system preference)
 */
export function getResolvedTheme(theme: Theme): Exclude<Theme, "system"> {
  if (theme === "system") {
    return typeof window !== "undefined" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  }
  return theme as Exclude<Theme, "system">;
}

/**
 * Create default settings
 */
export const createDefaultSettings = (): Settings => {
  // Resolve language from browser, fallback to English
  const browserLang =
    typeof navigator !== "undefined" && navigator.language
      ? navigator.language.split("-")[0]
      : "en";
  const languageMeta =
    LANGUAGE_OPTIONS.find((l) => l.code === browserLang) ?? LANGUAGE_OPTIONS[0];

  return {
    // Use a safe placeholder currency object; it will NOT be used until confirmed
    currency: COUNTRY_OPTIONS[0],
    language: languageMeta,
    theme: "system",
    sounds: true,
    haptics: "all",
    devMode: false,
    // First-run requires explicit confirmation
    isCurrencyConfirmed: false,
  };
};

function migrateSettings(raw: unknown): unknown {
  if (!raw || typeof raw !== "object") return raw;
  const obj = raw as Record<string, unknown>;

  const currency = obj.currency as Record<string, unknown> | undefined;
  if (currency) {
    const symbolCandidate =
      (currency as Record<string, unknown>).currency ??
      currency.symbol ??
      (currency as Record<string, unknown>).code;
    const symbol =
      typeof symbolCandidate === "string" ? symbolCandidate : undefined;
    if (symbol && symbol in CURRENCY_META_DATA) {
      // SDK metadata always wins so updated fields (e.g. country names) take effect
      obj.currency = {
        ...currency,
        ...CURRENCY_META_DATA[symbol as CurrencyType],
      };
    }
  }

  const language = obj.language as Record<string, unknown> | undefined;
  if (language) {
    const code = language.code as string | undefined;
    if (code) {
      const meta = LANGUAGE_OPTIONS.find((l) => l.code === code);
      if (meta) obj.language = { ...meta, ...language };
    }
  }

  // If we are migrating from previous schema without isCurrencyConfirmed,
  // set it to true to avoid disrupting existing v2 users who already have settings saved.
  // New users (including v1 migrating users with no key) will receive default false.
  if (obj.isCurrencyConfirmed === undefined) {
    obj.isCurrencyConfirmed = true;
  }

  return obj;
}

/**
 * Gets the settings from localStorage
 */
export function getSettings(): Result<Settings, SettingsError> {
  const res = loadFromStorageWithMigrations<Settings>({
    key: STORAGE_KEYS.SETTINGS,
    schema: SettingsSchema,
    getDefault: createDefaultSettings,
    migrate: migrateSettings,
  });
  return res.mapErr((e) =>
    createAppError<"Settings">(e.message, {
      domain: "Settings",
      code: e.code,
      cause: e.cause,
      context: e.context ?? {},
    }),
  );
}

/**
 * Saves the settings to localStorage
 */
export function saveSettings(
  settings: Settings,
): Result<Settings, SettingsError> {
  const res = saveStrictToStorage<Settings>({
    key: STORAGE_KEYS.SETTINGS,
    schema: SettingsSchema,
    value: settings,
  });
  return res.mapErr((e) =>
    createAppError<"Settings">(e.message, {
      domain: "Settings",
      code: e.code,
      cause: e.cause,
      context: e.context ?? {},
    }),
  );
}

/**
 * Updates settings with partial updates
 */
export function updateSettings(
  updates: Partial<Settings>,
): Result<Settings, SettingsError> {
  const currentSettingsResult = getSettings();
  if (currentSettingsResult.isErr()) {
    return err(currentSettingsResult.error);
  }

  const currentSettings = currentSettingsResult.value;
  const updatedSettings = { ...currentSettings, ...updates };

  return saveSettings(updatedSettings);
}

/**
 * Updates currency settings
 */
export function updateCurrency(
  currency: Currency,
): Result<Settings, SettingsError> {
  return updateSettings({ currency });
}

/**
 * Updates language settings
 */
export function updateLanguage(
  language: Language,
): Result<Settings, SettingsError> {
  return updateSettings({ language });
}

/**
 * Updates theme setting
 */
export function updateTheme(theme: Theme): Result<Settings, SettingsError> {
  return updateSettings({ theme });
}

/**
 * Updates sounds setting
 */
export function updateSounds(
  sounds: Settings["sounds"],
): Result<Settings, SettingsError> {
  return updateSettings({ sounds });
}

/**
 * Updates haptics setting
 */
export function updateHaptics(
  haptics: Settings["haptics"],
): Result<Settings, SettingsError> {
  return updateSettings({ haptics });
}

/**
 * Updates dev mode setting
 */
export function updateDevMode(
  devMode: Settings["devMode"],
): Result<Settings, SettingsError> {
  return updateSettings({ devMode });
}

/**
 * Resets settings to default values (preserves currency and language)
 */
export function resetSettings(): Result<Settings, SettingsError> {
  const currentSettingsResult = getSettings();
  if (currentSettingsResult.isErr()) {
    return err(currentSettingsResult.error);
  }

  const currentSettings = currentSettingsResult.value;
  const defaultSettings = createDefaultSettings();

  // Preserve currency and language, reset everything else
  const resetSettings: Settings = {
    ...defaultSettings,
    currency: currentSettings.currency,
    language: currentSettings.language,
  };

  return saveSettings(resetSettings);
}
