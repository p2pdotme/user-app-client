import { DownloadIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

export function ServiceWorkerChecker() {
  const { t } = useTranslation();

  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    let count = 0;
    const maxChecks = 100;
    const interval = setInterval(async () => {
      count++;

      if (!("serviceWorker" in navigator)) {
        clearInterval(interval);
        setIsOpen(false);
        return;
      }

      const registration = await navigator.serviceWorker.getRegistration();

      if (registration?.installing || registration?.waiting) {
        setIsOpen(true);
      } else if (registration?.active) {
        setIsOpen(false);
      } else {
        setIsOpen(false);
        clearInterval(interval);
      }

      if (count >= maxChecks) {
        clearInterval(interval);
        setIsOpen(false);
        console.log(`Stopped checking after ${maxChecks} attempts`);
      }
    }, 3000); // every 3 seconds

    return () => clearInterval(interval);
  }, []);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center">
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" />

      <div className="relative z-[1001] mx-4 w-full max-w-sm rounded-2xl border border-white/10 bg-popover pt-10 pb-4 text-popover-foreground shadow-2xl">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="relative flex items-center justify-center">
            <div
              className="absolute size-16 animate-spin rounded-full border-2 border-primary/20 border-t-primary"
              aria-hidden
            />
            <DownloadIcon className="animate-pulse text-primary" />
          </div>

          <div className="mt-6 text-center">
            <h3 className="text-center font-medium text-base tracking-wider">
              {t("SW_INSTALLING_UPDATE")}
            </h3>
          </div>

          <div>
            <p className="text-center font-normal text-primary text-sm">
              {t("SW_MAY_TAKE_UP_TO")}
            </p>
            <p className="text-center font-normal text-primary text-sm">
              {t("SW_PLEASE_WAIT")}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ServiceWorkerChecker;
