import { useMemo } from "react";
import { useTaxSettings } from "@/tax/contexts";
import { normalizeOrders } from "@/tax/core/subgraph/normalize";
import { computeFyReport, type FyReport } from "@/tax/core/tax/compute";
import type { NormalizedOrder, RawOrder } from "@/tax/core/types";

export interface TaxReportResult {
  report: FyReport | null;
  /** Every completed INR order of the wallet set, all years */
  orders: NormalizedOrder[] | null;
}

/** Raw orders + manual entries + selected FY → FY tax report (memoised). */
export function useTaxReport(
  rawOrders: RawOrder[] | undefined,
  fy: number,
  wallets: readonly string[],
): TaxReportResult {
  const { data } = useTaxSettings();
  const normalized = useMemo(
    () => (rawOrders ? normalizeOrders(rawOrders) : null),
    [rawOrders],
  );
  const report = useMemo(
    () =>
      normalized
        ? computeFyReport({
            orders: normalized.orders,
            excluded: normalized.excluded,
            lots: data.lots,
            tds: data.tds,
            settings: data.settings,
            notMyWallets: data.notMyWallets,
            specificLots: data.specificLots,
            otherGifts: data.otherGifts,
            outflows: data.outflows,
            wallets,
            fy,
          })
        : null,
    [normalized, data, fy, wallets],
  );
  return { report, orders: normalized?.orders ?? null };
}
