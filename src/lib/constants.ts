import type { CurrencyCode as CurrencyType } from "@p2pdotme/sdk";
import {
  CURRENCY,
  type PaymentIdFieldConfig,
  COUNTRY_OPTIONS as SDK_COUNTRY_OPTIONS,
  PAYMENT_ID_FIELDS as SDK_PAYMENT_ID_FIELDS,
  uploadsPaymentQR,
  usesCatalogPaymentForm,
  usesPackedPaymentId,
} from "@p2pdotme/sdk/country";
import type { Language } from "@/core/client/settings";
import { getBaseDomain } from "./utils";

export {
  CURRENCY,
  uploadsPaymentQR,
  usesCatalogPaymentForm,
  usesPackedPaymentId,
};
export type { CurrencyType, PaymentIdFieldConfig };

/**
 * Display label for a currency in the UI: USD/EUR show the provider/country name,
 * ECU shows "Ecuador USD" (Ecuador is USD-denominated), all others show the code.
 */
export function getCurrencyLabel(code: string, country: string): string {
  if (code === CURRENCY.USD || code === CURRENCY.EUR) return country;
  if (code === CURRENCY.ECU) return "Ecuador USD";
  return code;
}

/**
 * Raw fiat unit shown next to amounts (e.g. the USDC ⇄ fiat toggle). ECU is
 * USD-denominated, so it shows "USD"; every other currency shows its own code.
 */
export function getFiatUnit(code: string): string {
  if (code === CURRENCY.ECU) return "USD";
  return code;
}

export const ORDER_TYPE = { BUY: 0, SELL: 1, PAY: 2 } as const;

export const INTERNAL_HREFS = {
  HOME: "/",
  REFERRAL: "/referral",
  TRANSACTIONS: "/transactions",
  LIMITS: "/limits",
  DEPOSIT: "/deposit",
  WITHDRAW: "/withdraw",
  BRIDGE: "/bridge",
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
  P2P_TOKEN: "/p2p-token",
  P2P_TOKEN_SWAP: "/p2p-token/swap",
  P2P_TOKEN_SWAP_HISTORY: "/p2p-token/swap/history",
  P2P_TOKEN_STAKE: "/p2p-token/stake",
  P2P_TOKEN_MY_STAKE: "/p2p-token/my-stake",
  P2P_TOKEN_UNSTAKE: "/p2p-token/unstake",
  ORDER: "/order",

  SETTINGS: "/settings",
  MAINTENANCE: "/maintenance",
  NOT_FOUND: "/404",
  LOGIN: "/login",
  RECOVER: "/recover",
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
).sort((a, b) => Number(Boolean(a.isAlpha)) - Number(Boolean(b.isAlpha)));

export const SUPPORTED_CURRENCIES = COUNTRY_OPTIONS.map((c) => c.currency) as [
  CurrencyType,
  ...CurrencyType[],
];

export const CURRENCY_META_DATA = Object.fromEntries(
  COUNTRY_OPTIONS.map((c) => [c.currency, c]),
) as Record<CurrencyType, (typeof COUNTRY_OPTIONS)[number]>;

/**
 * reclaim-session-service base URL. It holds the Reclaim app secret and mints
 * the signed proof-request config the client rebuilds with `fromJsonString`.
 *
 * The secret is a private key whose address is the Reclaim appId, so it must
 * never be a `VITE_*` var — Vite inlines those into the shipped bundle.
 */
export const RECLAIM_BASE_URL =
  (import.meta.env.VITE_RECLAIM_BASE_URL as string | undefined) ??
  "http://localhost:8000";

/** simple-kyc (Identity/KYC) hosted wizard + API base URL (the kyc-proxy). */
export const SIMPLE_KYC_BASE_URL =
  (import.meta.env.VITE_SIMPLE_KYC_BASE_URL as string | undefined) ??
  "http://localhost:8000";

/**
 * simple-kyc tenant slug (one Base contract). Defaults to the Base **mainnet**
 * reputation tenant; override with VITE_SIMPLE_KYC_TENANT (e.g. "p2p-reputation"
 * for the Base Sepolia tenant).
 */
export const SIMPLE_KYC_TENANT =
  (import.meta.env.VITE_SIMPLE_KYC_TENANT as string | undefined) ??
  "p2p-reputation-mainnet";

/**
 * Liveness hosted wizard + API base URL (the liveness proxy). A **different**
 * host from SIMPLE_KYC_BASE_URL: liveness is its own service, with its own
 * database, attestor key and EIP-712 domain. Pointing one at the other yields a
 * signature the contract rejects.
 */
export const LIVENESS_BASE_URL =
  (import.meta.env.VITE_LIVENESS_BASE_URL as string | undefined) ??
  "https://liveness-proxy.p2p.cool";

/**
 * Liveness tenant slug (one Base contract). Defaults to the Base **mainnet**
 * reputation tenant; override with VITE_LIVENESS_TENANT (e.g.
 * "p2p-reputation-liveness" for the Base Sepolia tenant). Registered on the
 * liveness service's own tenant table -- a slug on simple-kyc says nothing here.
 */
export const LIVENESS_TENANT =
  (import.meta.env.VITE_LIVENESS_TENANT as string | undefined) ??
  "p2p-reputation-liveness-mainnet";

/**
 * Markets where the liveness tier is not offered. India runs the passport
 * (Identity/KYC) tier only.
 */
export const LIVENESS_EXCLUDED_COUNTRIES: readonly string[] = ["India"];

/**
 * Verification methods the fraud engine tiers as low-trust, mirroring its
 * `BLOCK_NEW_ACCOUNTS_LOW_TRUST_SOCIALS` list (instagram, facebook, aadhaar, x,
 * binance, bvn, liveness). Verifying one of these never bypasses the
 * new-accounts gate on its own -- they are the cheapest proofs to farm.
 *
 * Names match the labels rendered on the limits page. Liveness and BVN are
 * low-trust too but are not part of this list because they render as their own
 * cards, not as entries in `SOCIALS`.
 */
export const LOW_TRUST_SOCIALS: readonly string[] = [
  "X",
  "Instagram",
  "Facebook",
  "Binance",
];

/**
 * Markets where the low-trust methods are ordered behind a high-trust one: they
 * stay hidden until the user holds at least one high-trust proof (Identity/KYC,
 * LinkedIn or GitHub). India only -- every other market offers all methods up
 * front. See `useLowTrustGate`.
 */
export const LOW_TRUST_GATED_COUNTRIES: readonly string[] = ["India"];

/** BVN (Nigerian Bank Verification Number) backend proxy base URL. */
export const BVN_API_BASE_URL = import.meta.env.VITE_BVN_API_URL as
  | string
  | undefined;

/** BVN backend tenant slug (maps to one on-chain contract). */
export const BVN_TENANT = "user-app";

/** BVN verification is enabled only when both backend URL and tenant are set. */
export const IS_BVN_ENABLED = Boolean(BVN_API_BASE_URL && BVN_TENANT);

/**
 * ISO-2 country to prebind for the simple-kyc passport flow, keyed by the user's
 * selected currency. The hosted wizard skips the country step, so the app must
 * supply it, and it must be one of simple-kyc's supported markets. Currencies
 * with no entry (USD, EUR) can't run KYC, so the card is hidden for them.
 *
 * Every enabled currency in the SDK's COUNTRY_OPTIONS needs an entry here --
 * a launched market that is missing from this map does not error, it silently
 * loses the KYC card (see KycVerificationCard's `if (!kycCountry) return null`),
 * which is how PHP/PEN/ECU/CUP went unverifiable after launch. Only the Revolut
 * rails (USD, EUR) are meant to be absent: they have no passport country.
 */
export const KYC_COUNTRY_BY_CURRENCY: Partial<Record<CurrencyType, string>> = {
  INR: "IN",
  NGN: "NG",
  BRL: "BR",
  MEX: "MX",
  COP: "CO",
  ARS: "AR",
  VEN: "VE",
  IDR: "ID",
  PHP: "PH",
  PEN: "PE",
  ECU: "EC",
  CUP: "CU",
  BOB: "BO",
};

/**
 * Minimum order value expressed in the local fiat currency. Orders below this
 * amount are blocked in the SELL and Scan & Pay flows. Currently only Indonesia
 * (IDR) enforces a floor of Rp 1000.
 */
export const MIN_ORDER_FIAT_BY_CURRENCY: Partial<Record<CurrencyType, number>> =
  {
    IDR: 1000,
  };

export const CONNECTION_STATUS_TUTORIAL_LINK =
  "https://youtu.be/your-tutorial-link";

export const RECLAIM_APP_LINKS = {
  ANDROID:
    "https://play.google.com/store/apps/details?id=org.reclaimprotocol.app",
  // Reclaim Verifier on the App Store (App Clip removed; iOS needs the app).
  // Region-agnostic id link redirects to the user's store front.
  IOS: "https://apps.apple.com/app/id6503247508",
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
  BOB: { account: "PLACEHOLDER_ACCOUNT_NUMBER_BOB" },
  USD: { revolut: "PLACEHOLDER_PAYMENT_ID_USD" },
  EUR: { revolut: "PLACEHOLDER_PAYMENT_ID_USD" },
  NGN: {
    account: "PLACEHOLDER_ACCOUNT_NUMBER_NGN",
    "bank-name": "PLACEHOLDER_BANK_NAME_NGN",
    "account-name": "PLACEHOLDER_ACCOUNT_NAME_NGN",
  },
  COP: { alias: "PLACEHOLDER_PAYMENT_ID_COP" },
  CUP: {
    phone: "PLACEHOLDER_PAYMENT_ID_CUP",
    card: "PLACEHOLDER_CARD_NUMBER_CUP",
  },
  PEN: {
    phone: "PERU_PHONE_PLACEHOLDER",
    cci: "PERU_CCI_PLACEHOLDER",
  },
  PHP: {
    phone: "PLACEHOLDER_PAYMENT_ID_PHP",
    "bank-name": "PLACEHOLDER_BANK_NAME_PHP",
  },
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
