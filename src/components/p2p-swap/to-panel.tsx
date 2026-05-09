import { useTranslation } from "react-i18next";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface ToPanelProps {
  outputAmount: string | null;
  isLoading: boolean;
  isError: boolean;
  hasAmount: boolean;
  tokenBadge: React.ReactNode;
}

export function ToPanel({
  outputAmount,
  isLoading,
  isError,
  hasAmount,
  tokenBadge,
}: ToPanelProps) {
  const { t } = useTranslation();

  return (
    <Card className="border-none bg-primary/10 shadow-none">
      <CardContent className="p-4">
        <div className="mb-3">
          <span className="font-medium text-muted-foreground text-xs uppercase tracking-wide">
            {t("YOU_RECEIVE")}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex-1">
            {hasAmount && isLoading && <Skeleton className="h-9 w-32" />}
            {hasAmount && isError && (
              <p className="font-bold text-2xl text-destructive">—</p>
            )}
            {outputAmount && !isLoading && (
              <p className="font-bold text-3xl text-foreground">{outputAmount}</p>
            )}
            {(!hasAmount || (!isLoading && !outputAmount && !isError)) && (
              <p className="font-bold text-3xl text-muted-foreground/40">0.00</p>
            )}
          </div>
          {tokenBadge}
        </div>
      </CardContent>
    </Card>
  );
}
