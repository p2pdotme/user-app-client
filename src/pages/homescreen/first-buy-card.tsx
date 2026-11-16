import { useQuery } from "@tanstack/react-query";
import { ArrowRight } from "lucide-react";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import type { Address } from "thirdweb";
import ASSETS from "@/assets";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useSettings } from "@/contexts";
import { getOrdersCollectionWithDateFilter } from "@/core/p2pdotme/subgraph";
import {
  useAnalytics,
  useBalances,
  useProcessingTxns,
  useThirdweb,
} from "@/hooks";
import { EVENTS } from "@/lib/analytics";
import { getFiatUnit, INTERNAL_HREFS } from "@/lib/constants";

/**
 * First-run call to action: for a user with zero USDC and no orders ever,
 * show one clear next step ("Buy your first USDC") near the top of Home.
 *
 * The order check is a single-row subgraph query that only runs once the
 * balance is known to be zero, so funded users never pay for it. Anything
 * still loading or failing hides the card (it's a nudge, not critical UI).
 */
export function FirstBuyCard() {
  const { account } = useThirdweb();
  const { balances } = useBalances();
  const { data: processing, isFetched: isProcessingFetched } =
    useProcessingTxns();

  const address = account?.address;
  const hasZeroBalance = !!balances && Number(balances.usdc) === 0;
  const hasProcessing =
    (processing?.pages.flatMap((page) => page.data).length ?? 0) > 0;

  const { data: hasAnyOrder } = useQuery({
    queryKey: ["subgraph", "hasAnyOrder", address],
    queryFn: async () =>
      getOrdersCollectionWithDateFilter({
        userAddress: address as Address,
        first: 1,
        skip: 0,
        orderBy: "placedAt",
        orderDirection: "desc",
      }).match(
        (orders) => orders.length > 0,
        (error) => {
          throw error;
        },
      ),
    enabled: !!address && hasZeroBalance,
    staleTime: 5 * 60 * 1000,
  });

  const shouldShow =
    hasZeroBalance &&
    isProcessingFetched &&
    !hasProcessing &&
    hasAnyOrder === false;

  if (!shouldShow) return null;
  return <FirstBuyCardContent />;
}

function FirstBuyCardContent() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { track } = useAnalytics();
  const {
    settings: { currency },
  } = useSettings();

  useEffect(() => {
    track(EVENTS.FEATURE, {
      status: "first_buy_cta_shown",
      location: "homescreen",
    });
  }, [track]);

  const handleClick = () => {
    track(EVENTS.FEATURE, {
      status: "action_clicked",
      location: "homescreen",
      action: "first_buy_cta",
    });
    navigate(INTERNAL_HREFS.BUY);
  };

  return (
    <section className="flex w-full flex-col py-2">
      <Card className="w-full border border-primary/30 bg-primary/5 py-4">
        <CardContent className="flex flex-col gap-3">
          <div className="flex items-start gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-background">
              <ASSETS.ICONS.Usdc className="size-7 text-primary" />
            </div>
            <div className="flex flex-col gap-1">
              <h2 className="font-semibold text-base">
                {t("ONB_FIRST_BUY_TITLE")}
              </h2>
              <p className="text-muted-foreground text-sm">
                {t("ONB_FIRST_BUY_DESCRIPTION", {
                  currency: getFiatUnit(currency.currency),
                })}
              </p>
            </div>
          </div>
          <Button size="lg" className="w-full" onClick={handleClick}>
            {t("ONB_FIRST_BUY_CTA")}
            <ArrowRight className="size-4" />
          </Button>
        </CardContent>
      </Card>
    </section>
  );
}
