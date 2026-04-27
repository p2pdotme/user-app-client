import { Play, Send } from "lucide-react";
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
import { useDomainReachability } from "@/contexts/domain-reachability";
import { useSettings } from "@/contexts/settings";
import { CONNECTION_STATUS_TUTORIAL_LINK } from "@/lib/constants";

const VpnDnsInstructions = () => {
  const { t } = useTranslation();
  return (
    <ol className="space-y-4">
      <li>
        <span className="font-satoshiBold text-base">
          1. {t("USE_VPN_RECOMMENDED")}
        </span>
        <ul className="mt-1 ml-6 list-disc space-y-1 text-foreground/90 text-sm">
          <li>{t("INSTALL_VPN")}</li>
          <li>{t("CONNECT_ANY_SERVER_REFRESH")}</li>
        </ul>
      </li>
      <li>
        <span className="font-satoshiBold text-base">2. {t("CHANGE_DNS")}</span>
        <ul className="mt-1 ml-2 space-y-2">
          <li>
            <span className="font-satoshiBold">{t("ANDROID")}</span>
            <span className="ml-2 text-foreground/90 text-sm">
              {t("ANDROID_DNS_INSTRUCTIONS")}
            </span>
          </li>
          <li>
            <span className="font-satoshiBold">{t("IOS")}</span>
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
  const { isReachable } = useDomainReachability();
  const { t } = useTranslation();
  const {
    settings: { currency },
  } = useSettings();

  const status = isReachable
    ? {
        icon: <span className="font-satoshiBold text-emerald-500">●</span>,
        title: t("YOU_RE_CONNECTED"),
        titleIcon: (
          <span className="inline-block h-3 w-3 rounded-full bg-emerald-400 shadow-md" />
        ),
        description: t("YOU_RE_CONNECTED_DESCRIPTION"),
        extraInfo: (
          <div className="mb-6 text-center text-base text-muted-foreground">
            {t("YOU_RE_CONNECTED_EXTRA_INFO")}
          </div>
        ),
      }
    : {
        icon: (
          <>
            <span className="font-satoshiBold text-destructive">●</span>
          </>
        ),
        title: t("NETWORK_ISSUE_DETECTED"),
        titleIcon: (
          <span className="inline-block h-3 w-3 rounded-full bg-red-500 shadow-md" />
        ),
        description: t("NETWORK_ISSUE_DESCRIPTION"),
        extraInfo: (
          <div className="mb-2 font-satoshiBold text-base text-green-500">
            {t("QUICK_FIXES")}
          </div>
        ),
      };

  return (
    <Drawer>
      <DrawerTrigger asChild>{children}</DrawerTrigger>
      <DrawerContent className="rounded-t-2xl bg-background">
        <div className="flex h-full max-h-[80vh] flex-col overflow-y-auto px-4 pb-6">
          <DrawerHeader className="flex flex-col items-center justify-center">
            <div className="mt-2 mb-1 flex items-center gap-2">
              <DrawerTitle className="text-center font-bold font-satoshiBlack text-2xl text-foreground">
                {status.title}
              </DrawerTitle>
              {status.titleIcon}
            </div>
            <DrawerDescription className="mb-4 text-center text-base text-muted-foreground">
              {status.description}
            </DrawerDescription>
            <div className="w-full max-w-md">
              {status.extraInfo}
              <VpnDnsInstructions />
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

export default ConnectionStatusDrawer;
