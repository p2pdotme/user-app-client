import { useCallback, useSyncExternalStore } from "react";
import { STORAGE_KEYS } from "@/lib/constants";

const HIDDEN_VALUE = "1";
const CHANGE_EVENT = "balance-visibility:change";

// Fallback when localStorage is unavailable (private mode, blocked storage)
let memoryIsHidden = false;

function readIsHidden(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEYS.BALANCE_HIDDEN) === HIDDEN_VALUE;
  } catch {
    return memoryIsHidden;
  }
}

function writeIsHidden(hidden: boolean): void {
  memoryIsHidden = hidden;
  try {
    if (hidden) {
      localStorage.setItem(STORAGE_KEYS.BALANCE_HIDDEN, HIDDEN_VALUE);
    } else {
      localStorage.removeItem(STORAGE_KEYS.BALANCE_HIDDEN);
    }
  } catch {
    // Persisting failed; the in-memory value above still drives this session
  }
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

function subscribe(onChange: () => void): () => void {
  window.addEventListener(CHANGE_EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(CHANGE_EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

/**
 * Whether balances are masked on screen. Shown by default; the choice is
 * persisted in localStorage and shared across all components using this hook.
 */
export function useBalanceVisibility() {
  const isHidden = useSyncExternalStore(subscribe, readIsHidden, () => false);

  const toggle = useCallback(() => {
    writeIsHidden(!readIsHidden());
  }, []);

  return { isHidden, toggle };
}
