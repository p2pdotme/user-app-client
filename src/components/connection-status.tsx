import {
  CheckCircle2,
  Loader2,
  Play,
  RefreshCw,
  Send,
  XCircle,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { useSettings } from "@/contexts/settings";
import {
  type ServiceId,
  type ServiceReachability,
  useServiceReachability,
} from "@/hooks/use-service-reachability";
import { CONNECTION_STATUS_TUTORIAL_LINK } from "@/lib/constants";
import { cn } from "@/lib/utils";

const VpnDnsInstructions = () => {
  const { t } = useTranslation();
  return (
    <ol className="space-y-4">
      <li>
        <span className="text-base">1. {t("USE_VPN_RECOMMENDED")}</span>
        <ul className="mt-1 ml-6 list-disc space-y-1 text-foreground/90 text-sm">
          <li>{t("INSTALL_VPN")}</li>
          <li>{t("CONNECT_ANY_SERVER_REFRESH")}</li>
        </ul>
      </li>
      <li>
        <span className="text-base">2. {t("CHANGE_DNS")}</span>
        <ul className="mt-1 ml-2 space-y-2">
          <li>
            <span>{t("ANDROID")}</span>
            <span className="ml-2 text-foreground/90 text-sm">
              {t("ANDROID_DNS_INSTRUCTIONS")}
            </span>
          </li>
          <li>
            <span>{t("IOS")}</span>
            <span className="ml-2 text-foreground/90 text-sm">
              {t("IOS_DNS_INSTRUCTIONS")}
            </span>
          </li>
        </ul>
      </li>
    </ol>
  );
};

const AlreadyInstalledNote = () => {
  const { t } = useTranslation();
  return (
    <div className="mt-6 text-center text-muted-foreground text-sm">
      {t("ALREADY_INSTALLED_NOTE")}
    </div>
  );
};

export function ConnectionStatusDrawer({
  children,
}: {
  children: React.ReactNode;
}) {
  const { t } = useTranslation();
  const {
    settings: { currency },
  } = useSettings();

  const { overall, services, isChecking, recheck } = useServiceReachability();
  const hasProblem = overall === "degraded" || overall === "offline";

  const status =
    overall === "offline"
      ? {
          title: t("CONN_OFFLINE_TITLE"),
          dotClass: "bg-destructive",
          description: t("CONN_OFFLINE_DESCRIPTION"),
        }
      : overall === "degraded"
        ? {
            title: t("CONN_DEGRADED_TITLE"),
            dotClass: "bg-warning",
            description: t("CONN_DEGRADED_DESCRIPTION"),
          }
        : overall === "checking"
          ? {
              title: t("CONN_CHECKING"),
              dotClass: "bg-muted-foreground animate-pulse",
              description: "",
            }
          : {
              title: t("YOU_RE_CONNECTED"),
              dotClass: "bg-success",
              description: t("YOU_RE_CONNECTED_DESCRIPTION"),
            };

  return (
    <Drawer>
      <DrawerTrigger asChild>{children}</DrawerTrigger>
      <DrawerContent className="rounded-t-2xl bg-background">
        <div className="flex h-full max-h-[80vh] flex-col overflow-y-auto px-4 pb-6">
          <DrawerHeader className="flex flex-col items-center justify-center">
            <div className="mt-2 mb-1 flex items-center gap-2">
              <DrawerTitle className="text-center font-bold text-2xl text-foreground">
                {status.title}
              </DrawerTitle>
              <span
                className={cn(
                  "inline-block size-3 shrink-0 rounded-full shadow-md",
                  status.dotClass,
                )}
              />
            </div>
            <DrawerDescription className="mb-4 text-center text-base text-muted-foreground">
              {status.description}
            </DrawerDescription>
            <div className="flex w-full max-w-md flex-col gap-6">
              <ServiceList
                services={services}
                isOffline={overall === "offline"}
                isChecking={isChecking}
                onRecheck={recheck}
              />
              {hasProblem ? (
                <div className="flex flex-col gap-2 text-left">
                  <p className="font-semibold text-base">
                    {t("CONN_FIXES_TITLE")}
                  </p>
                  <VpnDnsInstructions />
                </div>
              ) : (
                <div className="text-left">
                  <p className="mb-3 text-center text-muted-foreground text-sm">
                    {t("YOU_RE_CONNECTED_EXTRA_INFO")}
                  </p>
                  <VpnDnsInstructions />
                </div>
              )}
              <AlreadyInstalledNote />
            </div>
          </DrawerHeader>
          <DrawerFooter className="mt-4 flex flex-col gap-3">
            <div className="flex w-full flex-col gap-3">
              <Button
                onClick={() =>
                  window.open(
                    CONNECTION_STATUS_TUTORIAL_LINK,
                    "_blank",
                    "noopener,noreferrer",
                  )
                }
                className="w-full"
                variant="default">
                <Play className="h-5 w-5" />
                <span className="text-center">{t("WATCH_TUTORIAL")}</span>
              </Button>
              <Button
                onClick={() =>
                  window.open(
                    currency.telegramSupportChannel,
                    "_blank",
                    "noopener,noreferrer",
                  )
                }
                className="w-full"
                variant="outline">
                <Send className="h-5 w-5" />
                <span className="text-center">{t("GET_QUICK_HELP")}</span>
              </Button>
              <DrawerClose asChild>
                <Button className="w-full" variant="outline">
                  <span className="text-center">{t("CLOSE")}</span>
                </Button>
              </DrawerClose>
            </div>
          </DrawerFooter>
        </div>
      </DrawerContent>
    </Drawer>
  );
}

const SERVICE_LABEL_KEYS: Record<ServiceId, string> = {
  app: "CONN_SERVICE_APP",
  blockchain: "CONN_SERVICE_BLOCKCHAIN",
  orders: "CONN_SERVICE_ORDERS",
};

function ServiceList({
  services,
  isOffline,
  isChecking,
  onRecheck,
}: {
  services?: ServiceReachability;
  isOffline: boolean;
  isChecking: boolean;
  onRecheck: () => void;
}) {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col gap-2 rounded-2xl border border-border p-3">
      <ul className="flex flex-col gap-2">
        {(Object.keys(SERVICE_LABEL_KEYS) as ServiceId[]).map((id) => {
          const state = isOffline ? "down" : services?.[id];
          return (
            <li key={id} className="flex items-center justify-between gap-3">
              <span className="text-left text-sm">
                {t(SERVICE_LABEL_KEYS[id])}
              </span>
              {state === undefined ? (
                <Loader2 className="size-4 shrink-0 animate-spin text-muted-foreground" />
              ) : state === "ok" ? (
                <span className="inline-flex shrink-0 items-center gap-1 text-sm text-success">
                  <CheckCircle2 className="size-4" />
                  {t("CONN_STATE_OK")}
                </span>
              ) : (
                <span className="inline-flex shrink-0 items-center gap-1 text-destructive text-sm">
                  <XCircle className="size-4" />
                  {t("CONN_STATE_DOWN")}
                </span>
              )}
            </li>
          );
        })}
      </ul>
      <Button
        variant="ghost"
        size="sm"
        disabled={isChecking || isOffline}
        onClick={onRecheck}
        className="self-center">
        <RefreshCw className={cn("size-4", isChecking && "animate-spin")} />
        {t("CONN_CHECK_AGAIN")}
      </Button>
    </div>
  );
}
