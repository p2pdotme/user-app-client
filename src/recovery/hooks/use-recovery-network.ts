import { useCallback, useState } from "react";
import {
  DEFAULT_RECOVERY_NETWORK,
  isRecoveryNetworkKey,
  type RecoveryNetworkKey,
} from "@/recovery/core";

const STORAGE_KEY = "p2p_recovery_network";

function readStoredNetwork(): RecoveryNetworkKey {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return isRecoveryNetworkKey(stored) ? stored : DEFAULT_RECOVERY_NETWORK;
  } catch {
    // Storage can be blocked (private mode); the default still works
    return DEFAULT_RECOVERY_NETWORK;
  }
}

/** The network the user is recovering on, remembered across visits. */
export function useRecoveryNetwork(): {
  network: RecoveryNetworkKey;
  setNetwork: (network: RecoveryNetworkKey) => void;
} {
  const [network, setNetworkState] = useState(readStoredNetwork);

  const setNetwork = useCallback((next: RecoveryNetworkKey) => {
    setNetworkState(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Not persisted; the selection still applies for this visit
    }
  }, []);

  return { network, setNetwork };
}
