import { ExternalLink, X } from "lucide-react";
import { type ReactNode, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { Skeleton } from "@/components/ui/skeleton";

const PARTNER_URL = "https://partner-p2p.netlify.app";

interface PartnerDrawerProps {
  children: ReactNode;
}

export function PartnerDrawer({ children }: PartnerDrawerProps) {
  const { t } = useTranslation();
  const [loaded, setLoaded] = useState(false);

  return (
    <Drawer onOpenChange={(open) => !open && setLoaded(false)}>
      <DrawerTrigger asChild>{children}</DrawerTrigger>
      <DrawerContent className="mx-auto !max-h-[90vh] max-w-md">
        <DrawerTitle className="sr-only">{t("BECOME_A_LIQUIDITY_PARTNER")}</DrawerTitle>
        <div className="flex h-[90vh] w-full flex-col">
          <div className="flex flex-shrink-0 items-center justify-between px-4 pt-10 pb-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => window.open(PARTNER_URL, "_blank", "noopener")}>
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
              src={PARTNER_URL}
              title={t("BECOME_A_LIQUIDITY_PARTNER")}
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
