import { D, type Dec } from "@/tax/lib/decimal";
import { istFields, monthShort, pad2 } from "@/tax/lib/ist";

/** Indian digit grouping (12,34,567) for a non-negative integer string. */
function groupIndian(intPart: string): string {
  if (intPart.length <= 3) return intPart;
  const last3 = intPart.slice(-3);
  const rest = intPart.slice(0, -3).replace(/\B(?=(\d{2})+(?!\d))/g, ",");
  return `${rest},${last3}`;
}

/** Round only for display. Decimal → "1,23,456.78" (no float conversion). */
export function formatNumber(value: Dec, dp: number): string {
  const fixed = value.toDecimalPlaces(dp, D.ROUND_HALF_UP).abs().toFixed(dp);
  const [int, frac] = fixed.split(".");
  const sign = value.isNegative() && !new D(fixed).isZero() ? "−" : "";
  return `${sign}${groupIndian(int)}${frac ? `.${frac}` : ""}`;
}

export function formatInr(value: Dec): string {
  const s = formatNumber(value, 2);
  return s.startsWith("−") ? `−₹${s.slice(1)}` : `₹${s}`;
}

export function formatUsdc(value: Dec): string {
  return formatNumber(value, 6);
}

export function formatRate(value: Dec): string {
  return formatNumber(value, 2);
}

export function formatPct(value: Dec): string {
  return `${value.mul(100).toDecimalPlaces(2).toString()}%`;
}

export function formatDateTimeIst(date: Date): string {
  const { year, month, day, hour, minute } = istFields(date);
  return `${pad2(day)} ${monthShort(month)} ${year}, ${pad2(hour)}:${pad2(minute)}`;
}

export function formatDateIst(date: Date): string {
  const { year, month, day } = istFields(date);
  return `${pad2(day)}/${pad2(month)}/${year}`;
}

/** "YYYY-MM-DD" → "DD/MM/YYYY" */
export function formatIsoDate(iso: string): string {
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

/** "YYYY-MM" → "Apr 26" */
export function formatMonthKey(key: string): string {
  const [y, m] = key.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, 15));
  return new Intl.DateTimeFormat("en-IN", {
    month: "short",
    year: "2-digit",
    timeZone: "UTC",
  }).format(date);
}

export function shortHash(hash: string): string {
  return hash.length > 14 ? `${hash.slice(0, 8)}…${hash.slice(-4)}` : hash;
}

/** "1234" → "#1234"; an on-chain transfer label is shown as it is. */
export function orderRef(orderId: string): string {
  return /^\d+$/.test(orderId) ? `#${orderId}` : orderId;
}
