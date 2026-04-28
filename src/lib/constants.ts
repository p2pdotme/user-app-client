import type { CurrencyCode as CurrencyType } from "@p2pdotme/sdk";
import {
  CURRENCY,
  type PaymentIdFieldConfig,
  COUNTRY_OPTIONS as SDK_COUNTRY_OPTIONS,
  PAYMENT_ID_FIELDS as SDK_PAYMENT_ID_FIELDS,
} from "@p2pdotme/sdk/country";
import type { Language } from "@/core/client/settings";
import { getBaseDomain } from "./utils";

export { CURRENCY };
export type { CurrencyType, PaymentIdFieldConfig };

export const ORDER_TYPE = { BUY: 0, SELL: 1, PAY: 2 } as const;

export const INTERNAL_HREFS = {
  HOME: "/",
  REFERRAL: "/referral",
  TRANSACTIONS: "/transactions",
  LIMITS: "/limits",
  DEPOSIT: "/deposit",
  WITHDRAW: "/withdraw",
  HELP: "/help",
  HELP_FAQS_SEARCH: "/help/faqs-search",
  HELP_HELPFUL_VIDEO_GUIDES: "/help/video-guides",
  STATUS: "/status",
  WALLET: "/wallet",

  BUY: "/buy",
  BUY_PREVIEW: "/buy/preview",
  SELL: "/sell",
  SELL_QUIZ: "/sell/quiz",
  SELL_PREVIEW: "/sell/preview",
  PAY: "/pay",
  PAY_PREVIEW: "/pay/preview",
  ORDER: "/order",

  SETTINGS: "/settings",
  MAINTENANCE: "/maintenance",
  NOT_FOUND: "/404",
  LOGIN: "/login",
  NOTIFICATION: "/notification",

  CAMPAIGN: "/campaign",
  RECOMMEND: "/recommend",

  // Dev routes (development only)
  DEV: "/dev",
  DEV_HAPTICS: "/dev/haptics",
  DEV_SOUNDS: "/dev/sounds",
  DEV_CAMERA: "/dev/camera",
  DEV_ANIMATIONS: "/dev/animations",
  DEV_TOASTS: "/dev/toasts",
};

export const URLS = {
  TERMS_AND_CONDITIONS: `${getBaseDomain()}/tnc`,
};

export const STORAGE_KEYS = {
  WALLET_ADDRESS_BOOK: "@P2PME:WALLET_ADDRESS_BOOK",
  SELL_ADDRESS_BOOK: "@P2PME:SELL_ADDRESS_BOOK",
  SETTINGS: "@P2PME:SETTINGS",
  RELAY_IDENTITY: "@P2PME:RELAY_IDENTITY",
  ORDER_PAYMENT_DETAILS: "@P2PME:ORDER_PAYMENT_DETAILS",
  SELL_QUIZ: "@P2PME:SELL_QUIZ",
  // Owned by @p2pdotme/sdk (read/written inside the SDK). Listed
  // here for visibility / debugging only — do not read or clear
  // this key from app code.
  DEVICE_HASH: "@P2PME:DEVICE_HASH",
};

export const LANGUAGE_OPTIONS: Language[] = [
  {
    code: "en",
    name: "English",
    nameNative: "English",
    locale: "en-IN",
  },
  {
    code: "es",
    name: "Spanish",
    nameNative: "Español",
    locale: "es-ES",
  },
  {
    code: "id",
    name: "Indonesian",
    nameNative: "Bahasa Indonesia",
    locale: "id-ID",
  },
  {
    code: "pt",
    name: "Portuguese (Brazil)",
    nameNative: "Português (Brasil)",
    locale: "pt-BR",
  },
  {
    code: "hi",
    name: "Hindi",
    nameNative: "हिन्दी",
    locale: "hi-IN",
  },
];

// COUNTRY_OPTIONS from SDK — uses `currency` field (not `symbol`)
export const COUNTRY_OPTIONS = SDK_COUNTRY_OPTIONS.filter(
  (item) => !item.disabled,
);

export const SUPPORTED_CURRENCIES = COUNTRY_OPTIONS.map((c) => c.currency) as [
  CurrencyType,
  ...CurrencyType[],
];

export const CURRENCY_META_DATA = Object.fromEntries(
  COUNTRY_OPTIONS.map((c) => [c.currency, c]),
) as Record<CurrencyType, (typeof COUNTRY_OPTIONS)[number]>;

export const RECLAIM_APP = {
  APP_ID: import.meta.env.VITE_RECLAIM_APP_ID,
  APP_SECRET: import.meta.env.VITE_RECLAIM_APP_SECRET,
};

export const CONNECTION_STATUS_TUTORIAL_LINK =
  "https://youtu.be/your-tutorial-link";

export const ZK_PASSPORT_APP_LINKS = {
  IOS: "https://apps.apple.com/us/app/zkpassport/id6477371975",
  ANDROID:
    "https://play.google.com/store/apps/details?id=app.zkpassport.zkpassport",
} as const;

export const RECLAIM_APP_LINKS = {
  ANDROID:
    "https://play.google.com/store/apps/details?id=org.reclaimprotocol.app",
} as const;

export const PAY_DISABLED_CURRENCIES = COUNTRY_OPTIONS.filter((c) =>
  c.disabledPaymentTypes.includes("PAY"),
).map((c) => c.currency) as CurrencyType[];

export const ORDER_TYPES = {
  BUY: "BUY",
  SELL: "SELL",
  PAY: "PAY",
} as const;

/** i18n translation keys for each field's placeholder, keyed by currency then field key. */
const PLACEHOLDER_KEYS: Record<string, Record<string, string>> = {
  INR: { upi: "PLACEHOLDER_PAYMENT_ID_INR" },
  IDR: { phone: "PLACEHOLDER_PAYMENT_ID_IDR" },
  BRL: { pix: "PLACEHOLDER_PAYMENT_ID_BRL" },
  ARS: { alias: "PLACEHOLDER_PAYMENT_ID_ARS" },
  MEX: { clabe: "PLACEHOLDER_PAYMENT_ID_MEX" },
  VEN: {
    phone: "PLACEHOLDER_PAYMENT_ID_VEN",
    rif: "PLACEHOLDER_RIF",
    bank: "PLACEHOLDER_BANK",
  },
  USD: { revolut: "PLACEHOLDER_PAYMENT_ID_USD" },
  EUR: { revolut: "PLACEHOLDER_PAYMENT_ID_USD" },
  NGN: {
    account: "PLACEHOLDER_ACCOUNT_NUMBER_NGN",
    bank: "PLACEHOLDER_BANK_NAME_NGN",
  },
  COP: { alias: "PLACEHOLDER_PAYMENT_ID_COP" },
};

export const PAYMENT_ID_FIELDS = Object.fromEntries(
  Object.entries(SDK_PAYMENT_ID_FIELDS).map(([currency, fields]) => [
    currency,
    fields.map((field) => ({
      ...field,
      placeholder: PLACEHOLDER_KEYS[currency]?.[field.key] ?? field.placeholder,
    })),
  ]),
) as typeof SDK_PAYMENT_ID_FIELDS;
