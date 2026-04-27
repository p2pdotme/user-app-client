import { Download } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";

export function TransactionsSummarySkeleton({
  filterButton,
}: {
  filterButton?: React.ReactNode;
}) {
  const { t } = useTranslation();

  return (
    <Card className="w-full gap-1 rounded-xl border-none bg-primary/10 p-0 shadow-none">
      <CardHeader className="gap-0 rounded-xl bg-primary/15 p-4 px-6">
        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-1">
            <CardTitle>
              <p>{t("YOUR_ACTIVITY")}</p>
            </CardTitle>
            <p className="text-muted-foreground text-xs">
              {t("SHOWING_SANE_DEFAULTS")}
            </p>
          </div>
          <div className="flex gap-2">
            {/* Use the actual filter button - it's not dependent on data loading */}
            {filterButton}
            <Button variant="outline" size="icon" disabled>
              <Download className="size-4 text-primary" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex w-full items-center justify-between gap-1 px-2 py-2 sm:gap-2 sm:px-4">
        <div className="flex min-w-0 flex-1 flex-col items-center justify-center rounded-lg py-2 transition-colors">
          <Skeleton className="h-8 w-16 sm:h-10 sm:w-20" />
          <p className="text-center text-muted-foreground text-xs sm:text-sm">
            {t("BUY_VOLUME")}
          </p>
          <p className="text-center text-muted-foreground text-xs sm:text-sm">
            USDC
          </p>
        </div>

        <Separator orientation="vertical" className="h-12 sm:h-16" />

        <div className="flex min-w-0 flex-1 flex-col items-center justify-center rounded-lg py-2 transition-colors">
          <Skeleton className="h-8 w-16 sm:h-10 sm:w-20" />
          <p className="text-center text-muted-foreground text-xs sm:text-sm">
            {t("SELL_PAY_VOLUME")}
          </p>
          <p className="text-center text-muted-foreground text-xs sm:text-sm">
            USDC
          </p>
        </div>

        <Separator orientation="vertical" className="h-12 sm:h-16" />

        <div className="flex min-w-0 flex-1 flex-col items-center justify-center rounded-lg py-2 transition-colors">
          <Skeleton className="h-8 w-12 sm:h-10 sm:w-16" />
          <p className="text-center text-muted-foreground text-xs sm:text-sm">
            {t("COMPLETED")}
          </p>
          <p className="text-center text-muted-foreground text-xs sm:text-sm">
            {t("TRANSACTIONS")}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
