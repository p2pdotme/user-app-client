import { ArrowRight, ExternalLink, X } from "lucide-react";
import { type ReactNode, useState } from "react";
import { useTranslation } from "react-i18next";
import ASSETS from "@/assets";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { Skeleton } from "@/components/ui/skeleton";

const ECOSYSTEM_URL = "https://p2p-ecosystem.netlify.app/";

interface EcosystemDrawerProps {
  children: ReactNode;
}

export function EcosystemDrawer({ children }: EcosystemDrawerProps) {
  const { t } = useTranslation();
  const [loaded, setLoaded] = useState(false);

  return (
    <Drawer onOpenChange={(open) => !open && setLoaded(false)}>
      <DrawerTrigger asChild>{children}</DrawerTrigger>
      <DrawerContent className="mx-auto !max-h-[90vh] max-w-md">
        <DrawerTitle className="sr-only">{t("P2P_ECOSYSTEM")}</DrawerTitle>
        <div className="flex h-[90vh] w-full flex-col">
          <div className="flex flex-shrink-0 items-center justify-between px-4 pt-10 pb-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => window.open(ECOSYSTEM_URL, "_blank", "noopener")}>
              <ExternalLink className="size-4" />
              {t("OPEN_IN_NEW_TAB")}
            </Button>
            <DrawerClose asChild>
              <Button
                type="button"
                variant="outline"
                size="icon"
                aria-label={t("CLOSE")}>
                <X className="size-4" />
              </Button>
            </DrawerClose>
          </div>
          <div className="relative min-h-0 flex-1 overflow-hidden">
            {!loaded && (
              <div className="absolute inset-0 flex flex-col gap-3 p-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-32 w-full" />
                <Skeleton className="h-6 w-2/3" />
                <Skeleton className="h-6 w-1/2" />
                <Skeleton className="h-32 w-full" />
                <Skeleton className="h-6 w-3/4" />
              </div>
            )}
            <iframe
              src={ECOSYSTEM_URL}
              title={t("P2P_ECOSYSTEM")}
              onLoad={() => setLoaded(true)}
              className="h-full w-full border-0"
              allow="clipboard-read; clipboard-write"
            />
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}

export function EcosystemCard() {
  const { t } = useTranslation();

  return (
    <EcosystemDrawer>
      <Card className="w-full cursor-pointer border-none bg-primary/5 transition-colors hover:bg-primary/10">
        <CardContent className="flex items-center gap-4 py-2">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-primary/10">
            <ASSETS.ICONS.EcosystemLogo className="size-7 text-primary" />
          </div>
          <div className="flex min-w-0 flex-1 flex-col">
            <p className="font-medium text-sm">{t("ECOSYSTEM_CARD_TITLE")}</p>
            <p className="text-muted-foreground text-xs">
              {t("ECOSYSTEM_CARD_SUBTITLE")}
            </p>
          </div>
          <ArrowRight className="size-5 shrink-0 text-primary" />
        </CardContent>
      </Card>
    </EcosystemDrawer>
  );
}
