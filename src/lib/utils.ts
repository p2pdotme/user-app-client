import type { CurrencyCode as CurrencyType } from "@p2pdotme/sdk";
import { type ClassValue, clsx } from "clsx";
import type { TFunction } from "i18next";
import moment from "moment";
import type { NavigateFunction } from "react-router";
import { twMerge } from "tailwind-merge";
import { type Abi, decodeEventLog } from "viem";
import { z } from "zod";
import { PAYMENT_ID_FIELDS } from "@/lib/constants";
import { deserializeCompoundPaymentId } from "./compound-payment-id";
import { CURRENCY_META_DATA, STORAGE_KEYS } from "./constants";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function truncateAddress(address: string, showSidesUpto = 6) {
  return `${address.slice(0, showSidesUpto)}...${address.slice(-showSidesUpto)}`;
}

/**
 * Truncates a numeric amount to a specified precision without rounding.
 *
 * This function handles numbers differently based on their magnitude:
 * - For numbers >= 1: Truncates to the specified number of decimal places.
 * - For numbers < 1: Uses significant digits while ensuring truncation.
 *
 * Useful for cryptocurrency amounts or financial data where rounding down is required.
 *
 * @param {string | number} amount - The amount to truncate. Can be a numeric string or number.
 * @param {number} [precision=2] - Number of decimal places (for n ≥ 1) or significant digits (for n < 1).
 * @returns {number} The truncated amount with specified precision.
 *
 * @throws {Error} If the amount cannot be converted to a valid number.
 *
 * @example
 * // Numbers >= 1 (truncates decimal places)
 * truncateAmount(1234.5678, 2) // → 1234.56
 * truncateAmount(1234.5678, 0) // → 1234
 *
 * // Numbers < 1 (uses significant digits)
 * truncateAmount(0.123456, 2) // → 0.12
 * truncateAmount(0.00456789, 2) // → 0.0045
 * truncateAmount(0.000123456, 3) // → 0.000123
 *
 * // String inputs
 * truncateAmount("1234.5678", 2) // → 1234.56
 * truncateAmount("0.0045678", 2) // → 0.0045
 */
export const truncateAmount = (
  amount: string | number,
  precision: number = 2,
): number => {
  const numberAmount = Number(amount);

  // Ensure the value is a valid number.
  if (Number.isNaN(numberAmount)) {
    throw new Error(
      "Invalid amount. The provided value cannot be converted to a number.",
    );
  }

  // If the value is less than 1, format using significant digits with truncation
  if (numberAmount < 1 && numberAmount > 0) {
    // Intl.NumberFormat with significant digits handles truncation correctly for small numbers
    return Number(
      new Intl.NumberFormat("en-US", {
        maximumSignificantDigits: precision,
        roundingMode: "trunc", // Explicitly truncate
      }).format(numberAmount),
    );
  } else {
    // If the value is >= 1 or 0, truncate it to the desired decimal places
    const factor = 10 ** precision;
    // Use Math.trunc for clarity, equivalent to Math.floor for positive numbers
    return Math.trunc(numberAmount * factor) / factor;
  }
};

/**
 * Rounds a numeric amount up (ceiling) to a specified precision.
 *
 * This function always rounds the amount up to the specified number of decimal places.
 *
 * @param {string | number} amount - The amount to round up. Can be a numeric string or number.
 * @param {number} [precision=2] - Number of decimal places to round up to.
 * @returns {number} The amount rounded up to the specified precision.
 *
 * @throws {Error} If the amount cannot be converted to a valid number.
 *
 * @example
 * // Always rounds up to the specified precision
 * ceilAmount(1234.561, 2)   // → 1234.57
 * ceilAmount(1234.567, 2)   // → 1234.57
 * ceilAmount(1234.560001, 2) // → 1234.57
 * ceilAmount(1234.56, 0)      // → 1235
 *
 * // String inputs
 * ceilAmount("1234.561", 2) // → 1234.57
 *
 * // Example showing the difference with truncateAmount for small numbers
 * ceilAmount(0.0009876, 2) // → 0.01
 * truncateAmount(0.0009876, 2) // -> 0.00098 (using significant digits)
 */
export const ceilAmount = (
  amount: string | number,
  precision: number = 2,
): number => {
  const numberAmount = Number(amount);

  // Ensure the value is a valid number.
  if (Number.isNaN(numberAmount)) {
    throw new Error(
      "Invalid amount. The provided value cannot be converted to a number.",
    );
  }

  const factor = 10 ** precision;
  return Math.ceil(numberAmount * factor) / factor;
};

export const roundAmount = (amount: string | number) => {
  const numericAmount = Number(amount) * 1e6;
  const scaledAmount = Math.round(numericAmount / 1e4);
  return scaledAmount / 1e2;
};

/**
 * Truncates a number to 6 decimal places without rounding.
 *
 * @param n - The number to truncate
 * @returns The number truncated to 6 decimal places
 * @example
 * truncate6(123.456789012) // → 123.456789
 * truncate6(0.123456789) // → 0.123456
 */
export const truncate6 = (n: number) => Math.trunc(n * 1e6) / 1e6;

export const bpsToPercent = (bps: string) => {
  const val = Number(bps);
  if (!bps || Number.isNaN(val)) return "";
  return String(val / 100);
};

/**
 * Extracts the base domain from a given URL.
 *
 * This function extracts the base domain (e.g., 'example.com') from a URL,
 * including the protocol (e.g., 'https://'). It handles cases where the
 * hostname is an IP address or contains subdomains.
 *
 * @returns {string} The base domain with the protocol.
 *
 * @example
 * // If the current URL is https://app.p2p.me, the output will be:
 * getBaseDomain() // → "https://p2p.me"
 *
 * // If the current URL is https://p2p.me, the output will be:
 * getBaseDomain() // → "https://p2p.me"
 *
 * // If the current URL is https://localhost, the output will be:
 * getBaseDomain() // → "https://localhost"
 *
 * // If the current URL is http://192.168.1.100, the output will be:
 * getBaseDomain() // → "http://192.168.1.100"
 */
export function getBaseDomain() {
  const currentHostname = window.location.hostname;
  const currentProtocol = window.location.protocol;

  const isIpAddress = z
    .union([z.ipv4(), z.ipv6()])
    .safeParse(currentHostname).success;

  if (isIpAddress) {
    return `${currentProtocol}//${currentHostname}`;
  }

  const hostnameParts = currentHostname.split(".");

  // Keep only the last two parts of the hostname
  if (hostnameParts.length > 2) {
    hostnameParts.splice(0, hostnameParts.length - 2);
  }

  const baseHostname = hostnameParts.join(".");

  // Fallback: When running on localhost or Netlify preview domains, use production base domain
  if (baseHostname === "localhost" || baseHostname === "netlify.app") {
    return "https://p2p.me";
  }

  return `${currentProtocol}//${baseHostname}`;
}

/**
 * Determines the current device platform based on the user agent string.
 *
 * This function analyzes the navigator's user agent to identify the operating system
 * of the current device. It supports detection of Android and iOS devices.
 * Yes, userAgent is not a reliable way to detect the platform, but for now, we can deal with it.
 *
 * @returns {'android' | 'ios' | 'unknown'} The identified platform:
 *   - 'android' for Android devices
 *   - 'ios' for Apple devices (iPhone, iPad, iPod)
 *   - 'unknown' for all other platforms (including desktop)
 *
 * @example
 * // On an iPhone
 * getPlatform() // → "ios"
 *
 * // On an Android phone
 * getPlatform() // → "android"
 *
 * // On a desktop browser
 * getPlatform() // → "unknown"
 */
export function getPlatform() {
  const ua = navigator.userAgent.toLowerCase();

  if (/android/i.test(ua)) {
    return "android";
  }

  if (/iphone|ipad|ipod/i.test(ua)) {
    return "ios";
  }

  return "unknown";
}

/**
 * Checks if the current device is running iOS (iPhone, iPad, or iPod).
 *
 * @returns {boolean} True if the device is iOS, false otherwise.
 *
 * @example
 * // On an iPhone
 * isIOS() // → true
 *
 * // On an Android phone
 * isIOS() // → false
 *
 * // On a desktop browser
 * isIOS() // → false
 */
export function isIOS(): boolean {
  return /iPad|iPhone|iPod/.test(navigator.userAgent);
}

/**
 * Checks if the current device is running Android.
 *
 * @returns {boolean} True if the device is Android, false otherwise.
 *
 * @example
 * // On an Android phone
 * isAndroid() // → true
 *
 * // On an iPhone
 * isAndroid() // → false
 *
 * // On a desktop browser
 * isAndroid() // → false
 */
export function isAndroid(): boolean {
  return /Android/i.test(navigator.userAgent);
}

/**
 * Safely navigates back, with a fallback destination if no history exists
 * @param navigate The navigate function from useNavigate()
 * @param fallbackPath The path to navigate to if there is no history
 */
export function safeNavigateBack(
  navigate: NavigateFunction,
  fallbackPath: string = "/",
): void {
  // Check if there's history to go back to
  if (window.history.length > 1) {
    navigate(-1);
  } else {
    // If no history, navigate to the fallback path with replace
    // (replace: true to avoid adding a new history entry when there's already none)
    navigate(fallbackPath, { replace: true });
  }
}

/**
 * Validates payment address based on currency using PAYMENT_ID_FIELDS config.
 * For compound currencies (multiple fields separated by "|"), validates each field
 * against its configured validator.
 */
export function validatePaymentAddress(
  address: string,
  currency: string,
): boolean {
  const fields = PAYMENT_ID_FIELDS[currency as CurrencyType];
  if (!fields) return false;

  if (fields.length === 1) {
    if (!address || address.trim().length === 0) return false;
    return fields[0].validate(address);
  }

  // Compound payment ID
  const parts = deserializeCompoundPaymentId(address);
  if (parts.length !== fields.length) return false;

  return fields.every((field, i) => {
    const value = parts[i];
    if (!value || value.trim().length === 0) return false;
    return field.validate(value);
  });
}

export function formatFiatAmount(
  amount: string | number,
  currency: CurrencyType,
) {
  const iso4217Code =
    CURRENCY_META_DATA[currency].internationalFormat ?? currency;
  const locale = CURRENCY_META_DATA[currency].locale;
  const precision = CURRENCY_META_DATA[currency].precision;

  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: iso4217Code,
    trailingZeroDisplay: "auto",
    maximumFractionDigits: precision,
  }).format(roundAmount(amount));
}

/**
 * Returns a numeric-only fiat amount string for payment protocols (no symbol, no separators).
 * Uses the same rounding logic as formatFiatAmount, but outputs plain numbers.
 * - INR, BRL -> 2 decimals (e.g. "100.00")
 * - IDR -> 0 decimals (e.g. "100")
 */
export function formatFiatAmountNumeric(
  amount: string | number,
  currency: CurrencyType,
): string {
  const locale = CURRENCY_META_DATA[currency].locale;
  const precision = CURRENCY_META_DATA[currency].precision;

  return new Intl.NumberFormat(locale, {
    style: "decimal",
    useGrouping: false,
    trailingZeroDisplay: "auto",
    maximumFractionDigits: precision,
    minimumFractionDigits: precision,
  }).format(roundAmount(amount));
}

export const extractOrderIdFromOrderPlaced = (
  abi: Abi,
  logs: Array<{
    data: `0x${string}`;
    topics: [] | [`0x${string}`, ...`0x${string}`[]];
  }>,
) => {
  for (const log of logs) {
    try {
      const { args } = decodeEventLog({
        abi,
        eventName: "OrderPlaced",
        data: log.data,
        topics: log.topics,
      });

      // @ts-expect-error - args is an array of unknown values
      if (args?.orderId) {
        // @ts-expect-error - args is an array of unknown values
        return Number(args.orderId as bigint);
      }
    } catch {}
  }
  return null;
};

export function getLocalOrderPaymentDetails() {
  const orderPaymentDetailsString = localStorage.getItem(
    STORAGE_KEYS.ORDER_PAYMENT_DETAILS,
  );
  if (!orderPaymentDetailsString) {
    return undefined;
  }
  const orderPaymentDetails = JSON.parse(orderPaymentDetailsString);
  return orderPaymentDetails;
}

/**
 * Stores payment details with optional payment method prefix
 * - With paymentMethod: stores as "paymentMethod:address"
 * - Without paymentMethod: stores as just "address"
 */
export function addLocalOrderPaymentDetails(
  orderId: string,
  paymentAddress: string,
  paymentMethod?: string,
) {
  let orderPaymentDetails = getLocalOrderPaymentDetails();
  if (!orderPaymentDetails) {
    orderPaymentDetails = {};
  }

  // If paymentMethod is provided, use prefix format, otherwise store address directly
  orderPaymentDetails[orderId] = paymentMethod
    ? `${paymentMethod}:${paymentAddress}`
    : paymentAddress;

  localStorage.setItem(
    STORAGE_KEYS.ORDER_PAYMENT_DETAILS,
    JSON.stringify(orderPaymentDetails),
  );
}

/**
 * Retrieves payment address, automatically handling prefixed and non-prefixed formats
 * - If stored with prefix: extracts address from "method:address" format
 * - If stored without prefix: returns address directly
 */
export function getPaymentAddressFromOrderDetails(
  orderId: string,
): string | undefined {
  const orderPaymentDetails = getLocalOrderPaymentDetails();
  if (!orderPaymentDetails || !orderPaymentDetails[orderId]) {
    return undefined;
  }

  const storedDetail = orderPaymentDetails[orderId];

  if (typeof storedDetail === "string") {
    // If it contains a colon, extract the address part (everything after first colon), otherwise return as-is
    const colonIndex = storedDetail.indexOf(":");
    return colonIndex !== -1
      ? storedDetail.substring(colonIndex + 1)
      : storedDetail;
  }

  return undefined;
}

/**
 * Retrieves payment method from stored details
 */
export function getPaymentMethodFromOrderDetails(
  orderId: string,
): string | undefined {
  const orderPaymentDetails = getLocalOrderPaymentDetails();
  if (!orderPaymentDetails || !orderPaymentDetails[orderId]) {
    return undefined;
  }

  const storedDetail = orderPaymentDetails[orderId];

  // If it contains a colon, extract the method part, otherwise no method was stored
  if (typeof storedDetail === "string" && storedDetail.includes(":")) {
    return storedDetail.split(":")[0];
  }

  return undefined;
}

export function exportTransactionsToCSV(
  transactions: {
    id: string;
    type: "BUY" | "SELL" | "PAY";
    cryptoAmount: number;
    fiatAmount: number;
    currency: CurrencyType;
    status: "PLACED" | "ACCEPTED" | "PAID" | "COMPLETED" | "CANCELLED";
    createdAt: number; // Unix timestamp
  }[],
  t: TFunction,
) {
  const headers = [
    t("TRANSACTION_ID"),
    t("TYPE"),
    t("STATUS"),
    t("USDC_AMOUNT"),
    t("FIAT_AMOUNT"),
    t("CURRENCY"),
    t("DATE"),
  ];

  const csvData = transactions.map((tx) => [
    tx.id,
    t(tx.type),
    tx.status,
    tx.cryptoAmount.toString(),
    tx.fiatAmount.toString(),
    tx.currency,
    moment.unix(tx.createdAt).format("YYYY-MM-DD HH:mm:ss"),
  ]);

  const csvContent = [headers, ...csvData]
    .map((row) => row.map((field) => `"${field}"`).join(","))
    .join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");

  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `p2pdotme_txns_${moment().format("YYYYMMDD_HHmmss")}.csv`,
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}

/**
 * Generates a UPI link according to NCPI specifications
 * @param upiId - The UPI ID of the payee
 * @param amount - The amount to pay
 * @param currency - The currency of the amount
 * @param orderId - The ID of the order
 * @returns The UPI link
 */
export function generateUPILink(
  upiId: string,
  amount: string,
  currency: string,
  orderId: string,
): string {
  const params = new URLSearchParams();
  params.append("pa", upiId); // Payee address (UPI ID)
  params.append("tr", orderId); // Transaction reference
  params.append("am", amount); // Amount
  params.append("cu", currency); // Currency

  return `upi://pay?${params.toString()}`;
}

export function getScreenType() {
  const width =
    window.innerWidth || document.documentElement.clientWidth || screen.width;

  if (width < 768) {
    return "phone";
  } else if (width >= 768 && width <= 1024) {
    return "tablet";
  } else {
    return "desktop";
  }
}

/**
 * Updates the PWA theme color based on the current theme
 * This function dynamically updates the theme-color meta tag to match the current theme
 * @param theme - The current theme ('light', 'dark', or 'system')
 */
export function updatePWATheme(theme: "light" | "dark") {
  const themeColors = {
    light: "oklch(0.97 0 0)", // --background for light theme
    dark: "oklch(0.19 0.0122 285.15)", // --background for dark theme
  };

  // Find the theme-color meta tag and update it
  const themeColorMeta = document.querySelector('meta[name="theme-color"]');
  if (themeColorMeta) {
    themeColorMeta.setAttribute("content", themeColors[theme]);
  }
}

/**
 * Preload a set of asset URLs to reduce pop-in
 * - HEAD warms CDN edge
 * - Images are decoded eagerly (limited to first 24)
 */
export async function preloadAssetUrls(urls: readonly string[]) {
  const uniqueUrls = Array.from(new Set(urls.filter(Boolean)));
  if (uniqueUrls.length === 0) return;

  // Fire-and-forget HEADs to warm CDN edge nodes
  uniqueUrls.forEach((url) => {
    try {
      fetch(url, { method: "HEAD", mode: "no-cors", keepalive: true }).catch(
        () => {},
      );
    } catch {}
  });

  // Eagerly decode images likely to appear in UI
  await Promise.all(
    uniqueUrls
      .filter((u) => /\.(png|jpg|jpeg|webp|gif|svg)$/i.test(u))
      .slice(0, 24)
      .map(async (u) => {
        try {
          const img = new Image();
          img.decoding = "async";
          img.loading = "eager";
          img.src = u;
          await img.decode?.().catch(() => {});
        } catch {}
      }),
  );
}

/**
 * Calculate fee for a given amount using threshold and fixed fee
 */
export function calculateFee(
  amount: number,
  threshold: number,
  fixedFee: number,
): number {
  return amount <= threshold ? fixedFee : 0;
}
export const isSyncedWithContract = (contractVersion: string) => {
  if (!contractVersion) return true;

  const appContractVersion = import.meta.env.CONTRACT_VERSION;
  return appContractVersion === contractVersion;
};

/**
 * Decodes a JWT token payload without signature verification.
 * Useful for reading claims from trusted sources.
 *
 * @param token - The JWT token string
 * @returns The decoded payload as an object, or null if decoding fails
 *
 * @example
 * const payload = decodeJwtPayload(token);
 * if (payload) {
 *   console.log(payload.storedToken?.isNewUser);
 * }
 */
export function decodeJwtPayload(
  token: string,
): Record<string, unknown> | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) {
      console.warn(
        "[JWT] Invalid JWT format: expected 3 parts, got",
        parts.length,
      );
      return null;
    }
    const payload = parts[1];
    // Handle base64url encoding (replace - with + and _ with /)
    let base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    // Add padding if needed (base64url omits padding, but atob() requires it)
    const paddingLength = base64.length % 4;
    if (paddingLength === 2) {
      base64 += "==";
    } else if (paddingLength === 3) {
      base64 += "=";
    }
    const decoded = atob(base64);
    return JSON.parse(decoded) as Record<string, unknown>;
  } catch (error) {
    console.error("[JWT] Failed to decode payload:", error);
    return null;
  }
}
