import { EthereumWalletConnectors } from "@dynamic-labs/ethereum";
import {
  DynamicContextProvider,
  mergeNetworks,
  useDynamicContext,
  type Wallet,
} from "@dynamic-labs/sdk-react-core";
import { SolanaWalletConnectors } from "@dynamic-labs/solana";
import type { GenericNetwork } from "@dynamic-labs/types";
import {
  Component,
  createContext,
  type ErrorInfo,
  type ReactNode,
  useCallback,
  useContext,
  useState,
} from "react";
import { captureError } from "@/lib/sentry";

/** HyperEVM (chain 999) network config for Dynamic – ensures switchNetwork(999) finds a mapping when multiple networks are enabled */
const HYPEREVM_NETWORK: GenericNetwork = {
  name: "HyperEVM",
  chainId: 999,
  networkId: 999,
  iconUrls: [
    "https://assets.coingecko.com/coins/images/50882/small/hyperliquid.jpg",
  ],
  nativeCurrency: {
    name: "Hyperliquid",
    symbol: "HYPE",
    decimals: 18,
  },
  rpcUrls: [
    "https://rpc.hyperliquid.xyz/evm",
    "https://hyperliquid.drpc.org",
    "https://999.rpc.thirdweb.com",
  ],
  blockExplorerUrls: [
    "https://hypurrscan.io",
    "https://explorer.hyperliquid.xyz",
  ],
};

// Context to expose Dynamic availability status and safe wallet access
interface DynamicStatusContextValue {
  isAvailable: boolean;
  error: Error | null;
  primaryWallet: Wallet | null;
}

const DynamicStatusContext = createContext<DynamicStatusContextValue>({
  isAvailable: true,
  error: null,
  primaryWallet: null,
});

export const useDynamicStatus = () => useContext(DynamicStatusContext);

/**
 * Safe wrapper around useDynamicContext that returns null when Dynamic is unavailable
 * This allows components to gracefully handle Dynamic SDK failures
 */
export function useSafeDynamicContext() {
  return useDynamicStatus();
}

interface DynamicProviderWrapperProps {
  children: ReactNode;
}

/**
 * Error boundary that catches Dynamic SDK errors and calls the parent callback
 */
class DynamicErrorBoundary extends Component<
  {
    children: ReactNode;
    onError: (error: Error, errorInfo: ErrorInfo) => void;
  },
  Record<string, never>
> {
  static getDerivedStateFromError(_error: Error) {
    // Let the parent component handle the error state
    return {};
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Call the parent callback to handle the error
    this.props.onError(error, errorInfo);
  }

  render() {
    return this.props.children;
  }
}

/**
 * Bridge component that syncs Dynamic context to our status context
 * This runs inside DynamicContextProvider when Dynamic is available
 */
function DynamicContextBridge({ children }: { children: ReactNode }) {
  const { primaryWallet } = useDynamicContext();

  return (
    <DynamicStatusContext.Provider
      value={{
        isAvailable: true,
        error: null,
        primaryWallet,
      }}>
      {children}
    </DynamicStatusContext.Provider>
  );
}

/**
 * Component that manages Dynamic SDK initialization with error handling
 * Conditionally renders the DynamicContextProvider based on error state
 */
function DynamicProviderManager({ children }: { children: ReactNode }) {
  const [hasError, setHasError] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Merge HyperEVM (999) into dashboard networks so switchNetwork(999) finds a mapping when multiple chains are enabled
  const evmNetworksOverride = useCallback(
    (dashboardNetworks: GenericNetwork[]) =>
      mergeNetworks([HYPEREVM_NETWORK], dashboardNetworks),
    [],
  );

  const handleError = (error: Error, errorInfo: ErrorInfo) => {
    console.error(
      "[DynamicProviderManager] Dynamic SDK failed to initialize:",
      {
        error: error.message,
        componentStack: errorInfo.componentStack,
      },
    );

    // Report to Sentry but don't crash the app
    captureError(error, {
      operation: "dynamic_sdk_initialization",
      component: "DynamicProviderManager",
      extra: {
        componentStack: errorInfo.componentStack,
        errorMessage: error.message,
      },
    });

    setHasError(true);
    setError(error);
  };

  // If there's an error, provide fallback context without Dynamic SDK
  if (hasError) {
    return (
      <DynamicStatusContext.Provider
        value={{
          isAvailable: false,
          error,
          primaryWallet: null,
        }}>
        {children}
      </DynamicStatusContext.Provider>
    );
  }

  // If no error, render the full Dynamic provider stack with error boundary
  return (
    <DynamicErrorBoundary onError={handleError}>
      <DynamicContextProvider
        settings={{
          environmentId: import.meta.env.VITE_DYNAMIC_PROJECT_ID,
          walletConnectors: [EthereumWalletConnectors, SolanaWalletConnectors],
          initialAuthenticationMode: "connect-only",
          mobileExperience: "redirect",
          overrides: {
            evmNetworks: evmNetworksOverride,
          },
        }}>
        <DynamicContextBridge>{children}</DynamicContextBridge>
      </DynamicContextProvider>
    </DynamicErrorBoundary>
  );
}

export function DynamicProviderWrapper({
  children,
}: DynamicProviderWrapperProps) {
  return <DynamicProviderManager>{children}</DynamicProviderManager>;
}
