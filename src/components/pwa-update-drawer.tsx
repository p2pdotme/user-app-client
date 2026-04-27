import { Link, RocketIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { useContractVersion } from "@/hooks/use-contract-version";

type PWAUpdateDrawerProps = {
  open: boolean;
  onReload: () => void;
};

export function PWAUpdateDrawer({ open, onReload }: PWAUpdateDrawerProps) {
  const { t } = useTranslation();
  const { contractVersion } = useContractVersion();

  const [remainingSeconds, setRemainingSeconds] = useState<number>(15);

  const localVersion = import.meta.env.CONTRACT_VERSION;

  useEffect(() => {
    if (!open) return;
    setRemainingSeconds(15);
    const intervalId = window.setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev <= 1) {
          window.clearInterval(intervalId);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => {
      window.clearInterval(intervalId);
    };
  }, [open]);

  const formattedTime = `00:${String(remainingSeconds).padStart(2, "0")}`;

  return (
    <Drawer open={open} onOpenChange={() => {}} dismissible={false}>
      <DrawerContent className="mx-auto max-w-md">
        <DrawerHeader className="mt-2 items-center gap-3 pb-6 text-center">
          <DrawerTitle className="text-xl">
            <div className="flex flex-col items-center">
              <div className="flex h-[80px] w-[90px] flex-col items-center justify-center rounded-2xl bg-gradient-to-b from-white/10 to-transparent">
                <div
                  style={{
                    animation: "rocket-takeoff 1s ease-in-out infinite",
                  }}>
                  <RocketIcon
                    className="-rotate-45 mx-auto text-primary"
                    size={40}
                  />
                </div>
              </div>
              <p className="mt-4 font-normal text-base text-white/70 uppercase">
                {t("PWA_NEW_UPDATE_AVAILABLE")}
              </p>

              <div className="flex items-center justify-center gap-3">
                <span className="text-sm text-white/40 line-through">{`v${localVersion}`}</span>
                <span className="text-white/30 text-xs">→</span>
                <span className="font-semibold text-primary text-sm">{`v${contractVersion}`}</span>
              </div>
              {remainingSeconds > 0 && (
                <div className="mt-2 flex items-center justify-center gap-1">
                  <p className="font-normal text-sm text-white/70 tracking-wider">
                    {t("PWA_DOWNLOADING_UPDATE")}
                    <span className="text-green-500">
                      {" "}
                      {`${formattedTime}`}
                    </span>
                  </p>
                </div>
              )}
            </div>
          </DrawerTitle>
          <div className="my-2 h-[1px] w-full bg-white/10" />

          <DrawerDescription className="flex w-full flex-col gap-2 text-base leading-relaxed">
            <div className="w-full space-y-2 text-start">
              <p className="font-medium text-sm text-white/50">
                {t("PWA_UPDATE_NOT_DOWNLOADING")}
              </p>
              <div className="space-y-1.5 text-sm text-white/40">
                <p className="flex items-center gap-2">
                  <span className="text-white/20">1.</span>
                  {t("PWA_CHECK_INTERNET")}
                </p>
                <p className="flex items-center gap-2">
                  <span className="text-white/20">2.</span>
                  {t("PWA_TURN_ON_VPN")}
                </p>

                <p className="flex items-center gap-2">
                  <span className="text-white/20">3.</span>
                  {t("PWA_TRY_MIRROR_LINK")}
                  <a
                    href="https://app.p2p.lol/"
                    className="inline-flex items-center gap-1 text-primary underline underline-offset-2">
                    app.p2p.lol <Link size={12} />
                  </a>
                </p>
              </div>
            </div>
          </DrawerDescription>
        </DrawerHeader>
        <div className="mx-4 h-[1px] bg-white/10" />
        <div className="px-4 py-8">
          <Button
            onClick={onReload}
            variant="default"
            className="h-[50px] w-full"
            disabled={remainingSeconds > 0}
            size="lg">
            {t("PWA_UPDATE_RELOAD_NOW")}
          </Button>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
