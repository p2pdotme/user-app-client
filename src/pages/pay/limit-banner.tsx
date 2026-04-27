import { ChevronRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import ASSETS from "@/assets";
import { Button } from "@/components/ui/button";
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

  const renderContent = () => {
    if (isLoading) {
      return <Skeleton className="h-4 w-48" />;
    }
    if (isError) {
      return (
        <p className="font-light text-destructive">
          {t("ERROR_FETCHING_LIMITS")}
        </p>
      );
    }
    return (
      <p
        className={cn(
          "font-light",
          hasExceededLimit ? "text-destructive" : "text-muted-foreground",
        )}>
        {t("YOUR_TRANSACTION_LIMIT")}:{" "}
        <span
          className={cn(
            "font-medium",
            hasExceededLimit ? "text-destructive" : "text-primary",
          )}>
          {limit ?? "--"} USDC
        </span>
      </p>
    );
  };

  return (
    <div className="mt-4 w-full">
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
        className="w-full cursor-pointer rounded-xl bg-primary/10 px-6 py-3 text-sm transition-transform duration-150 ease-out active:scale-[0.99]">
        <div className="flex items-center justify-center gap-4">
          <ASSETS.ICONS.Sell className="size-5 text-primary" />
          {renderContent()}
          <ChevronRight className="size-4 text-muted-foreground" />
        </div>
        <div
          className="overflow-hidden"
          style={{
            maxHeight: hasExceededLimit ? "200px" : "0px",
            opacity: hasExceededLimit ? 1 : 0,
            marginTop: hasExceededLimit ? "0.75rem" : "0px",
            transition:
              "max-height 0.3s ease, opacity 0.3s ease, margin-top 0.3s ease",
          }}
          aria-hidden={!hasExceededLimit}>
          <div className="text-muted-foreground text-xs md:text-center">
            {t("INCREASE_LIMITS_DESCRIPTION")}
          </div>
          <div className="mt-3">
            <Button
              onClick={(e) => {
                e.stopPropagation();
                navigate(INTERNAL_HREFS.LIMITS);
              }}
              className="w-full">
              {t("INCREASE_LIMIT")}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
