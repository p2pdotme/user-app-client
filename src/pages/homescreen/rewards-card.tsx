import { ArrowRight } from "lucide-react";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import ASSETS from "@/assets";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { useP2pRewardBalance } from "@/hooks";
import { INTERNAL_HREFS } from "@/lib/constants";

const tileClassName =
  "flex min-w-0 flex-1 flex-col gap-3 rounded-2xl bg-background p-4 text-left transition-colors hover:bg-background/70";
const iconWrapClassName =
  "flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10";
const tileAmountClassName =
  "min-w-0 font-semibold text-base text-foreground leading-tight";
const tileActionClassName =
  "whitespace-nowrap font-medium text-primary text-xs";

type Reward = {
  key: string;
  icon: ReactNode;
  amount: string;
  action: string;
  onClick: () => void;
};

export function RewardsCard() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { data: p2pBalance } = useP2pRewardBalance();

  const handleViewP2P = () => navigate(INTERNAL_HREFS.P2P_TOKEN);

  const rewards: Reward[] = [];
  if (p2pBalance?.hasBalance) {
    rewards.push({
      key: "p2p",
      icon: <ASSETS.ICONS.Logo className="size-5 text-primary" />,
      amount: `${p2pBalance.displayAmount} $${p2pBalance.tokenSymbol}`,
      action: t("VIEW_HOLDINGS"),
      onClick: handleViewP2P,
    });
  }

  if (rewards.length === 0) return null;

  // Single reward: render like the My Stake card (no nested card-in-card).
  if (rewards.length === 1) {
    const reward = rewards[0];
    return (
      <div className="flex w-full flex-col items-center justify-center py-4">
        <button
          type="button"
          onClick={reward.onClick}
          className="flex w-full flex-col gap-2 rounded-xl bg-primary/5 px-6 py-4 text-left transition-colors hover:bg-primary/10">
          <div className="flex w-full items-center justify-between gap-3">
            <CardTitle>{t("REWARDS")}</CardTitle>
            <div className="flex min-w-0 items-center gap-2">
              <div className={iconWrapClassName}>{reward.icon}</div>
              <span className="font-semibold text-foreground text-lg">
                {reward.amount}
              </span>
            </div>
          </div>
          <span className={tileActionClassName}>
            {reward.action}{" "}
            <ArrowRight className="inline size-3 align-middle" />
          </span>
        </button>
      </div>
    );
  }

  return (
    <div className="flex w-full flex-col items-center justify-center py-4">
      <Card className="w-full gap-3 border-none bg-primary/5 px-6 pt-4 pb-4">
        <CardHeader className="p-0">
          <CardTitle>{t("REWARDS")}</CardTitle>
        </CardHeader>
        <div className="flex w-full items-stretch gap-1">
          {rewards.map((reward) => (
            <button
              key={reward.key}
              type="button"
              onClick={reward.onClick}
              className={tileClassName}>
              <div className="flex min-w-0 items-center gap-2">
                <div className={iconWrapClassName}>{reward.icon}</div>
                <span className={tileAmountClassName}>{reward.amount}</span>
              </div>
              <span className={tileActionClassName}>
                {reward.action}{" "}
                <ArrowRight className="inline size-3 align-middle" />
              </span>
            </button>
          ))}
        </div>
      </Card>
    </div>
  );
}
