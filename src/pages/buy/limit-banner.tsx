import { AlertTriangle, ArrowRight, ChevronRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import ASSETS from "@/assets";
import { Skeleton } from "@/components/ui/skeleton";
import { INTERNAL_HREFS } from "@/lib/constants";
import { cn } from "@/lib/utils";

interface LimitBannerProps {
  limit?: number;
  isLoading: boolean;
  isError: boolean;
  hasExceededLimit?: boolean;
}

export function LimitBanner({
  limit,
  isLoading,
  isError,
  hasExceededLimit,
}: LimitBannerProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const renderLabel = () => {
    if (isLoading) {
      return <Skeleton className="h-4 w-32" />;
    }
    if (isError) {
      return (
        <span className="font-medium text-destructive text-sm">
          {t("ERROR_FETCHING_LIMITS")}
        </span>
      );
    }
    return (
      <span
        className={cn(
          "font-semibold text-sm leading-[18px]",
          hasExceededLimit ? "text-destructive" : "text-foreground",
        )}>
        {t("LIMIT_PER_ORDER", { limit: limit ?? "--" })}
      </span>
    );
  };

  // Same row in both states; over the limit it turns red, swaps the page icon
  // for a warning and shows the "Verify to raise" call to action in place of
  // the chevron. The trigger (hasExceededLimit) is unchanged.
  const isAlert = hasExceededLimit && !isLoading;

  return (
    <div className="mt-4 flex w-full justify-center">
      <div
        role="button"
        tabIndex={0}
        onClick={() => navigate(INTERNAL_HREFS.LIMITS)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            navigate(INTERNAL_HREFS.LIMITS);
          }
        }}
        className="flex min-h-[38px] w-[80%] cursor-pointer items-center justify-between gap-2 rounded-2xl bg-primary/10 px-4 py-2 transition-transform duration-150 ease-out active:scale-[0.99]">
        <div className="flex min-w-0 items-center gap-2">
          {hasExceededLimit ? (
            <AlertTriangle
              className={cn(
                "size-4 shrink-0",
                isAlert ? "text-destructive" : "text-primary",
              )}
            />
          ) : (
            <ASSETS.ICONS.Buy className="size-4 shrink-0 text-primary" />
          )}
          {renderLabel()}
        </div>
        {hasExceededLimit ? (
          <span className="inline-flex shrink-0 items-center gap-1 font-semibold text-primary text-sm leading-[19px]">
            {t("VERIFY_TO_RAISE")}
            <ArrowRight className="size-4" />
          </span>
        ) : (
          <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
        )}
      </div>
    </div>
  );
}
