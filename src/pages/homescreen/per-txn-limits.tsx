import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import ASSETS from "@/assets";
import { CollapsibleCard } from "@/components/collapsible-card";
import { useTxLimits } from "@/hooks";
import { INTERNAL_HREFS } from "@/lib/constants";
import { truncateAmount } from "@/lib/utils";

export function PerTxnLimit() {
  const { t } = useTranslation();
  const { txLimit, isTxLimitError } = useTxLimits();
  const buyLimit = txLimit?.buyLimit ?? 0;
  const sellLimit = txLimit?.sellLimit ?? 0;

  return (
    <CollapsibleCard
      title={t("PER_TRANSACTION_LIMITS")}
      storageKey="card-collapse:per-txn-limits">
      <div className="flex w-full flex-col gap-4">
        <p className="text-muted-foreground text-sm">
          {t("PER_TRANSACTION_LIMITS_DESCRIPTION")}
        </p>
        <div className="flex items-center gap-4">
          <div className="flex w-full items-center gap-2">
            <div className="flex size-14 items-center justify-center rounded-full bg-background">
              <ASSETS.ICONS.Buy className="size-6 text-primary" />
            </div>
            <div>
              <p className="font-medium text-muted-foreground text-sm">
                {t("BUY")}
              </p>
              <p className="bg-linear-to-b from-primary to-primary/50 bg-clip-text font-bold text-3xl text-transparent">
                {isTxLimitError ? "--" : `$${truncateAmount(buyLimit, 1)}`}
              </p>
            </div>
          </div>
          <div className="flex w-full items-center gap-2">
            <div className="flex size-14 items-center justify-center rounded-full bg-background">
              <ASSETS.ICONS.Sell className="size-6 text-primary" />
            </div>
            <div>
              <p className="font-medium text-muted-foreground text-sm">
                {t("SELL")}/{t("PAY")}
              </p>
              <p className="bg-linear-to-b from-primary to-primary/50 bg-clip-text font-bold text-3xl text-transparent">
                {isTxLimitError ? "--" : `$${truncateAmount(sellLimit, 1)}`}
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center">
          <Link
            to={INTERNAL_HREFS.LIMITS}
            className="rounded-md border border-primary bg-transparent px-4 py-2"
            viewTransition
            style={{
              viewTransitionName: "limits",
            }}>
            <p className="font-medium text-primary text-sm">
              {t("INCREASE_TRANSACTION_LIMITS")}
            </p>
          </Link>
        </div>
      </div>
    </CollapsibleCard>
  );
}
