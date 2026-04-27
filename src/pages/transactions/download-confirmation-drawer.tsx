import { CalendarRange, Filter, Languages } from "lucide-react";
import moment from "moment";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { useSettings } from "@/contexts";

interface DownloadConfirmationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  transactions: { createdAt: number }[];
  hasFilters?: boolean;
}

export function DownloadConfirmationDrawer({
  isOpen,
  onClose,
  onConfirm,
  transactions,
  hasFilters,
}: DownloadConfirmationDrawerProps) {
  const { t } = useTranslation();
  const {
    settings: { language },
  } = useSettings();

  const dateRange = useMemo(() => {
    if (transactions.length === 0) {
      return { from: null, to: null };
    }
    const dates = transactions.map((tx) => tx.createdAt);
    const from = moment.unix(Math.min(...dates)).format("DD MMM YYYY");
    const to = moment.unix(Math.max(...dates)).format("DD MMM YYYY");
    return { from, to };
  }, [transactions]);

  return (
    <Drawer open={isOpen} onClose={onClose} direction="bottom" autoFocus={true}>
      <DrawerContent>
        <DrawerHeader className="text-center">
          <DrawerTitle>{t("DOWNLOAD_CONFIRMATION_TITLE")}</DrawerTitle>
          <DrawerDescription>
            {t("DOWNLOAD_CONFIRMATION_DESCRIPTION")}
          </DrawerDescription>
        </DrawerHeader>
        <div className="space-y-4 p-4">
          <Card className="p-0">
            <CardContent className="divide-y">
              <div className="flex items-center justify-between py-3">
                <div className="flex items-center gap-3">
                  <CalendarRange className="size-5 text-muted-foreground" />
                  <p className="font-medium">{t("DATE_RANGE")}</p>
                </div>
                <p className="text-muted-foreground text-sm">
                  {dateRange.from && dateRange.to
                    ? `${dateRange.from} - ${dateRange.to}`
                    : t("NOT_AVAILABLE")}
                </p>
              </div>
              <div className="flex items-center justify-between py-3">
                <div className="flex items-center gap-3">
                  <Languages className="size-5 text-muted-foreground" />
                  <p className="font-medium">{t("LANGUAGE")}</p>
                </div>
                <p className="text-muted-foreground text-sm">
                  {language.nameNative}
                </p>
              </div>
              {hasFilters && (
                <div className="flex items-center justify-between py-3">
                  <div className="flex items-center gap-3">
                    <Filter className="size-5 text-muted-foreground" />
                    <p className="font-medium">{t("FILTERS_APPLIED")}</p>
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {t("FILTERS_ACTIVE")}
                  </Badge>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        <DrawerFooter>
          <Button onClick={onConfirm} disabled={transactions.length === 0}>
            {t("CONFIRM_DOWNLOAD")}
          </Button>
          <DrawerClose asChild>
            <Button variant="outline">{t("CANCEL")}</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
