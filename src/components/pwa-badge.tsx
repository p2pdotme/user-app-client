import { useRegisterSW } from "virtual:pwa-register/react";
import { useEffect, useState } from "react";
import { useLocation } from "react-router";
import { toast } from "sonner";
import { PWAUpdateDrawer } from "@/components/pwa-update-drawer";
import { Button } from "@/components/ui/button";
import { useContractVersion } from "@/hooks/use-contract-version";
import ServiceWorkerChecker from "./sw-checker";

type PWABadgeProps = {
  force?: boolean;
};

function PWABadge({ force = false }: PWABadgeProps) {
  // periodic sync is disabled, change the value to enable it, the period is in milliseconds
  // You can remove onRegisteredSW callback and registerPeriodicSync function
  const period = 0;

  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(swUrl, r) {
      if (period <= 0) return;
      if (r?.active?.state === "activated") {
        registerPeriodicSync(period, swUrl, r);
      } else if (r?.installing) {
        r.installing.addEventListener("statechange", (e) => {
          const sw = e.target as ServiceWorker;
          if (sw.state === "activated") registerPeriodicSync(period, swUrl, r);
        });
      }
    },
  });

  const [showContractMismatch, setShowContractMismatch] = useState(false);
  const location = useLocation();
  const { checkContractSync } = useContractVersion();

  // Keep original toast-based flow for service worker update availability
  useEffect(() => {
    if (needRefresh) {
      toast(
        <div className="flex flex-col gap-2">
          <span className="font-medium">Update available</span>
          <span>Client out-of-date. Click reload to update.</span>
          <Button
            onClick={() => {
              try {
                updateServiceWorker(true);
                setNeedRefresh(false);
              } catch {
                // fallback
              } finally {
                window.location.reload();
              }
            }}>
            Reload
          </Button>
        </div>,
        {
          duration: 10000,
        },
      );
    }
  }, [needRefresh, updateServiceWorker, setNeedRefresh]);

  // Contract version check: run on mount and every route change
  // biome-ignore lint/correctness/useExhaustiveDependencies: location.pathname intentionally triggers re-check on route change
  useEffect(() => {
    checkContractSync().then((isSynced) => {
      if (!isSynced) {
        if (force) {
          // Force update immediately (best-effort)
          try {
            updateServiceWorker(true);
          } catch {
            // fallback
            window.location.reload();
          }
          return;
        }
        // Show modal only for contract mismatch
        setShowContractMismatch(true);
        return;
      } else {
        setShowContractMismatch(false);
      }
    });
  }, [location.pathname]);

  return (
    <>
      {showContractMismatch && <ServiceWorkerChecker />}

      <PWAUpdateDrawer
        open={showContractMismatch}
        onReload={() => {
          try {
            updateServiceWorker(true);
            setNeedRefresh(false);
          } catch {
            // fallback
          } finally {
            window.location.reload();
          }
        }}
      />
    </>
  );
}

export { PWABadge };

/**
 * This function will register a periodic sync check every hour, you can modify the interval as needed.
 */
function registerPeriodicSync(
  period: number,
  swUrl: string,
  r: ServiceWorkerRegistration,
) {
  if (period <= 0) return;

  setInterval(async () => {
    if ("onLine" in navigator && !navigator.onLine) return;

    const resp = await fetch(swUrl, {
      cache: "no-store",
      headers: {
        cache: "no-store",
        "cache-control": "no-cache",
      },
    });

    if (resp?.status === 200) await r.update();
  }, period);
}
