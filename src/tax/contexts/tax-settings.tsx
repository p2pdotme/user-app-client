import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type {
  ManualData,
  ManualLot,
  OutflowEntry,
  Settings,
  TdsEntry,
  WalletEntries,
} from "@/tax/core/types";
import { ITA_2025_FIRST_FY } from "@/tax/lib/fy";
import {
  EMPTY_ENTRIES,
  EMPTY_MANUAL,
  hasEntries,
  walletSetKey,
} from "@/tax/lib/manual-data";

/**
 * What happened to the manual entries when the wallet set changed:
 * - SAME: nothing changed
 * - CARRIED: a wallet was added (same taxpayer), so the entries moved to the
 *   new wallet set; they are not left behind as a stale copy under the old one
 * - RESTORED: entries saved earlier for this wallet set are back
 * - SEPARATE: a different wallet set; the previous entries were set aside
 *   (kept for when that wallet set is entered again) and this one starts empty
 * - NEW: a different wallet set and there was nothing to set aside
 */
export type WalletSwitch = "SAME" | "CARRIED" | "RESTORED" | "SEPARATE" | "NEW";

/**
 * Tax settings + manual entries. Held in memory only (never persisted);
 * users export / import them as JSON from the settings drawer. They outlive
 * the provider (see `session` below), so leaving the tax screen and coming
 * back in the same app session does not lose them.
 *
 * Settings (cost method, regime, …) are global. Entries (outside lots, TDS,
 * "not my wallet", specific-lot tags, other gifts) belong to one taxpayer, so
 * they are kept per wallet set and never leak into another wallet's report.
 */
/** What the report is showing; remembered while the user visits other tax screens. */
export interface ReportView {
  /** Selected financial year (start year) */
  fy: number;
  /** Open report tab */
  tab: string;
}

const DEFAULT_VIEW: ReportView = { fy: ITA_2025_FIRST_FY, tab: "summary" };

interface TaxSettingsContextValue {
  /** Settings + the entries of the active wallet set */
  data: ManualData;
  /** Replace settings and the active wallet set's entries (e.g. import) */
  setData: (data: ManualData) => void;
  updateSettings: (patch: Partial<Settings>) => void;
  setLots: (lots: ManualLot[]) => void;
  setTds: (tds: TdsEntry[]) => void;
  /** Mark an address (where purchases were delivered) as not the user's */
  markNotMine: (address: string) => void;
  /** SPECIFIC method: tag the lot sold by a sale (null clears the tag) */
  setSpecificLot: (saleId: string, lotId: string | null) => void;
  /** Other gifts from non-relatives in a FY (₹, user-entered) */
  setOtherGifts: (fy: number, amount: string) => void;
  /** Record (or replace) the answer for one on-chain outflow */
  setOutflow: (entry: OutflowEntry) => void;
  /** Forget the answer for one on-chain outflow */
  removeOutflow: (id: string) => void;
  /** Make `wallets` the active wallet set */
  selectWallets: (wallets: readonly string[]) => WalletSwitch;
  view: ReportView;
  setView: (patch: Partial<ReportView>) => void;
}

interface State {
  settings: Settings;
  view?: ReportView;
  activeKey: string;
  activeWallets: string[];
  byKey: Record<string, WalletEntries>;
}

const entriesOf = (d: ManualData): WalletEntries => ({
  lots: d.lots,
  tds: d.tds,
  notMyWallets: d.notMyWallets,
  specificLots: d.specificLots,
  otherGifts: d.otherGifts,
  outflows: d.outflows,
});

const isSuperset = (next: readonly string[], prev: readonly string[]) => {
  const set = new Set(next);
  return prev.every((w) => set.has(w));
};

/** Pure transition for selectWallets (exported for tests). */
export function switchWallets(
  state: State,
  wallets: readonly string[],
): { state: State; outcome: WalletSwitch } {
  const key = walletSetKey(wallets);
  const list = key ? key.split(",") : [];
  if (key === state.activeKey) return { state, outcome: "SAME" };
  const prev = state.byKey[state.activeKey] ?? EMPTY_ENTRIES;
  const saved = state.byKey[key];
  const next = (entries: WalletEntries, outcome: WalletSwitch) => ({
    state: {
      ...state,
      activeKey: key,
      activeWallets: list,
      byKey: { ...state.byKey, [key]: entries },
    },
    outcome,
  });
  if (saved) return next(saved, hasEntries(saved) ? "RESTORED" : "NEW");
  if (state.activeKey === "") {
    // Entered (or imported) before any wallet was chosen: they belong here
    const rest = Object.fromEntries(
      Object.entries(state.byKey).filter(([k]) => k !== ""),
    );
    return {
      state: {
        ...state,
        activeKey: key,
        activeWallets: list,
        byKey: { ...rest, [key]: prev },
      },
      outcome: hasEntries(prev) ? "CARRIED" : "NEW",
    };
  }
  if (isSuperset(list, state.activeWallets)) {
    // Move, not copy: otherwise re-entering the old set would bring back an
    // out-of-date copy of these entries
    const rest = Object.fromEntries(
      Object.entries(state.byKey).filter(([k]) => k !== state.activeKey),
    );
    return {
      state: {
        ...state,
        activeKey: key,
        activeWallets: list,
        byKey: { ...rest, [key]: prev },
      },
      outcome: hasEntries(prev) ? "CARRIED" : "NEW",
    };
  }
  return next(EMPTY_ENTRIES, hasEntries(prev) ? "SEPARATE" : "NEW");
}

const TaxSettingsContext = createContext<TaxSettingsContextValue | null>(null);

function initialState(initial: ManualData): State {
  const key = walletSetKey(initial.wallets);
  return {
    settings: initial.settings,
    activeKey: key,
    activeWallets: key ? key.split(",") : [],
    byKey: { [key]: entriesOf(initial) },
  };
}

/**
 * Last state of the provider. The app remounts the whole route tree on every
 * navigation, so React state alone would be lost when the user opens the
 * legal sources page and comes back. Memory only: gone on reload.
 *
 * It belongs to one logged-in account (`owner`): another account on the same
 * tab starts empty and never sees these settings or entries.
 */
let session: { owner: string; state: State } | null = null;

/** Forget the in-memory session (used by tests). */
export function resetTaxSession(): void {
  session = null;
}

export function TaxSettingsProvider({
  children,
  initial,
  owner = "",
}: {
  children: ReactNode;
  /** Start from these entries instead of the session's */
  initial?: ManualData;
  /** The logged-in account the session belongs to */
  owner?: string;
}) {
  const [state, setState] = useState<State>(() => {
    if (initial) return initialState(initial);
    return session?.owner === owner
      ? session.state
      : initialState(EMPTY_MANUAL);
  });
  useEffect(() => {
    session = { owner, state };
  }, [owner, state]);
  // Latest committed state, for the outcome of selectWallets (shown as a toast)
  const stateRef = useRef(state);
  stateRef.current = state;

  const updateEntries = useCallback(
    (fn: (e: WalletEntries) => WalletEntries) =>
      setState((s) => ({
        ...s,
        byKey: {
          ...s.byKey,
          [s.activeKey]: fn(s.byKey[s.activeKey] ?? EMPTY_ENTRIES),
        },
      })),
    [],
  );

  const setData = useCallback(
    (d: ManualData) => {
      setState((s) => ({ ...s, settings: d.settings }));
      updateEntries(() => entriesOf(d));
    },
    [updateEntries],
  );
  const updateSettings = useCallback(
    (patch: Partial<Settings>) =>
      setState((s) => ({ ...s, settings: { ...s.settings, ...patch } })),
    [],
  );
  const setLots = useCallback(
    (lots: ManualLot[]) => updateEntries((e) => ({ ...e, lots })),
    [updateEntries],
  );
  const setTds = useCallback(
    (tds: TdsEntry[]) => updateEntries((e) => ({ ...e, tds })),
    [updateEntries],
  );
  const markNotMine = useCallback(
    (address: string) =>
      updateEntries((e) =>
        e.notMyWallets.includes(address.toLowerCase())
          ? e
          : { ...e, notMyWallets: [...e.notMyWallets, address.toLowerCase()] },
      ),
    [updateEntries],
  );
  const setSpecificLot = useCallback(
    (saleId: string, lotId: string | null) =>
      updateEntries((e) => {
        const { [saleId]: _old, ...rest } = e.specificLots;
        return {
          ...e,
          specificLots: lotId ? { ...rest, [saleId]: lotId } : rest,
        };
      }),
    [updateEntries],
  );
  const setOtherGifts = useCallback(
    (fy: number, amount: string) =>
      updateEntries((e) => {
        const { [String(fy)]: _old, ...rest } = e.otherGifts;
        const value = amount.trim().slice(0, 40);
        return {
          ...e,
          otherGifts: value ? { ...rest, [String(fy)]: value } : rest,
        };
      }),
    [updateEntries],
  );
  const setOutflow = useCallback(
    (entry: OutflowEntry) =>
      updateEntries((e) => ({
        ...e,
        outflows: [...e.outflows.filter((o) => o.id !== entry.id), entry],
      })),
    [updateEntries],
  );
  const removeOutflow = useCallback(
    (id: string) =>
      updateEntries((e) => ({
        ...e,
        outflows: e.outflows.filter((o) => o.id !== id),
      })),
    [updateEntries],
  );
  const selectWallets = useCallback(
    (wallets: readonly string[]): WalletSwitch => {
      // The transition runs as an updater so it applies on top of any update
      // queued earlier in the same event, never over it
      setState((s) => switchWallets(s, wallets).state);
      return switchWallets(stateRef.current, wallets).outcome;
    },
    [],
  );

  const setView = useCallback(
    (patch: Partial<ReportView>) =>
      setState((s) => ({
        ...s,
        view: { ...DEFAULT_VIEW, ...s.view, ...patch },
      })),
    [],
  );
  const view = state.view ?? DEFAULT_VIEW;

  const data = useMemo<ManualData>(
    () => ({
      version: 1,
      settings: state.settings,
      wallets: state.activeWallets,
      ...(state.byKey[state.activeKey] ?? EMPTY_ENTRIES),
    }),
    [state],
  );

  const value = useMemo(
    () => ({
      data,
      setData,
      updateSettings,
      setLots,
      setTds,
      markNotMine,
      setSpecificLot,
      setOtherGifts,
      setOutflow,
      removeOutflow,
      selectWallets,
      view,
      setView,
    }),
    [
      data,
      setData,
      updateSettings,
      setLots,
      setTds,
      markNotMine,
      setSpecificLot,
      setOtherGifts,
      setOutflow,
      removeOutflow,
      selectWallets,
      view,
      setView,
    ],
  );
  return (
    <TaxSettingsContext.Provider value={value}>
      {children}
    </TaxSettingsContext.Provider>
  );
}

export function useTaxSettings(): TaxSettingsContextValue {
  const ctx = useContext(TaxSettingsContext);
  if (!ctx) {
    throw new Error("useTaxSettings must be used inside <TaxSettingsProvider>");
  }
  return ctx;
}
