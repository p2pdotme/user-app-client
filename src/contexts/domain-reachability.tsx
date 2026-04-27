import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

interface DomainReachabilityContextType {
  domain: string;
  isReachable: boolean;
}

const initialState: DomainReachabilityContextType = {
  domain: window.location.host,
  isReachable: true,
};

const DomainReachabilityContext =
  createContext<DomainReachabilityContextType>(initialState);

interface DomainReachabilityProviderProps {
  children: ReactNode;
  checkInterval?: number;
}

export const DomainReachabilityProvider = ({
  children,
  checkInterval = 30000,
}: DomainReachabilityProviderProps) => {
  const [isReachable, setIsReachable] = useState(initialState.isReachable);

  const checkDomain = useCallback(async () => {
    try {
      // Set a timeout for the fetch to ensure it doesn't hang indefinitely
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      // Try to fetch the domain with a cache-busting parameter
      await fetch(
        `${window.location.protocol}//${window.location.host}/ping?_=${Date.now()}`,
        {
          method: "HEAD",
          mode: "no-cors",
          cache: "no-cache",
          signal: controller.signal,
        },
      );

      clearTimeout(timeoutId);
      console.log(
        `${new Date().toLocaleString()} [${window.location.host}] is reachable`,
      );
      return true;
    } catch (error) {
      console.error(
        `Error checking reachability for ${window.location.host}:`,
        error,
      );
      return false;
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    const checkDomainReachability = async () => {
      const reachable = await checkDomain();
      if (isMounted) {
        setIsReachable(reachable);
      }
    };

    // Check immediately on mount
    checkDomainReachability();

    // Set up periodic checking
    const intervalId = setInterval(checkDomainReachability, checkInterval);

    return () => {
      isMounted = false;
      clearInterval(intervalId);
    };
  }, [checkInterval, checkDomain]);

  return (
    <DomainReachabilityContext.Provider
      value={{ isReachable, domain: window.location.host }}>
      {children}
    </DomainReachabilityContext.Provider>
  );
};

export const useDomainReachability = () => {
  const context = useContext(DomainReachabilityContext);
  if (context === undefined) {
    throw new Error(
      "useDomainReachability must be used within a DomainReachabilityProvider",
    );
  }
  return context;
};
