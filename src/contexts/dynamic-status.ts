import type { Wallet } from "@dynamic-labs/sdk-react-core";
import { createContext, useContext } from "react";

/**
 * Lightweight Dynamic (external wallet) status context.
 *
 * Kept separate from `dynamic-provider-wrapper.tsx` so that importing this
 * hook (or anything from `@/contexts`) does NOT pull the multi-megabyte
 * Dynamic SDK into the startup bundle. The provider itself is only mounted by
 * the screens that need an external wallet.
 */
export interface DynamicStatusContextValue {
  isAvailable: boolean;
  error: Error | null;
  primaryWallet: Wallet | null;
}

export const DynamicStatusContext = createContext<DynamicStatusContextValue>({
  isAvailable: false,
  error: null,
  primaryWallet: null,
});

export const useDynamicStatus = () => useContext(DynamicStatusContext);

/**
 * Safe accessor for the Dynamic wallet. Returns `primaryWallet: null` when the
 * Dynamic provider is not mounted or failed to initialise.
 */
export function useSafeDynamicContext() {
  return useDynamicStatus();
}
