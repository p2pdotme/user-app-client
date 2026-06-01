import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { formatUnits } from "viem";
import { NonHomeHeader } from "@/components";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useP2PBoost, useUserStake } from "@/hooks";
import { truncateAmount } from "@/lib/utils";

const STATUS = {
  NONE: 0,
  ACTIVE: 1,
  COOLDOWN: 2,
  SEIZED: 3,
} as const;

function formatRemaining(seconds: number): string {
  if (seconds <= 0) return "0s";
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  const parts: string[] = [];
  if (d > 0) parts.push(`${d}d`);
  if (h > 0 || d > 0) parts.push(`${h}h`);
  if (m > 0 || h > 0 || d > 0) parts.push(`${m}m`);
  parts.push(`${s}s`);
  return parts.join(" ");
}

export function P2PUnstake() {
  const { t } = useTranslation();
  const { userStake, isUserStakeLoading } = useUserStake();
  const { p2pBoostRequestUnstakeMutation } =
    useP2PBoost();

  // TODO: 18 decimal to 6
  const stakedAmount = userStake
    ? Number(formatUnits(userStake.stakedAmount, 18))
    : 0;
  const status = userStake ? Number(userStake.status) : STATUS.NONE;
  const cooldownEnd = userStake ? Number(userStake.cooldownEnd) : 0;

  // tick every second while in cooldown
  const [now, setNow] = useState(() => Math.floor(Date.now() / 1000));
  useEffect(() => {
    if (status !== STATUS.COOLDOWN) return;
    const id = setInterval(() => setNow(Math.floor(Date.now() / 1000)), 1000);
    return () => clearInterval(id);
  }, [status]);

  const remaining = Math.max(0, cooldownEnd - now);
  const isReadyToClaim = status === STATUS.COOLDOWN && remaining === 0;
  const isRequesting = p2pBoostRequestUnstakeMutation.isPending;

  return (
    <>
      <NonHomeHeader title={t("P2P_UNSTAKE_TITLE")} />
      <main className="no-scrollbar container-narrow flex h-full w-full flex-col gap-4 overflow-y-auto px-4 pt-6 pb-8">
        {isUserStakeLoading ? (
          <Skeleton className="h-32 w-full rounded-2xl" />
        ) : (
          <section className="rounded-2xl border border-border/60 bg-card/40 p-4">
            <p className="font-medium text-muted-foreground text-xs uppercase tracking-wider">
              {t("P2P_UNSTAKE_STAKED_LABEL")}
            </p>
            <p className="mt-2 font-bold text-4xl text-foreground tabular-nums tracking-tight">
              {truncateAmount(stakedAmount)}{" "}
              <span className="text-muted-foreground text-base">$P2P</span>
            </p>

            {status === STATUS.COOLDOWN && cooldownEnd > 0 && (
              <>
                <div className="my-4 h-px bg-border/60" />
                <dl className="flex flex-col gap-2 text-sm">
                  <div className="flex items-center justify-between">
                    <dt className="text-muted-foreground">
                      {t("P2P_UNSTAKE_COOLDOWN_LABEL")}
                    </dt>
                    <dd className="font-semibold text-foreground tabular-nums">
                      {new Date(cooldownEnd * 1000).toLocaleString()}
                    </dd>
                  </div>
                  <div className="flex items-center justify-between">
                    <dt className="text-muted-foreground">
                      {t("P2P_UNSTAKE_COOLDOWN_REMAINING")}
                    </dt>
                    <dd
                      className={`font-semibold tabular-nums ${
                        isReadyToClaim
                          ? "text-emerald-500"
                          : "text-foreground"
                      }`}
                    >
                      {isReadyToClaim
                        ? t("P2P_UNSTAKE_READY_TO_CLAIM")
                        : formatRemaining(remaining)}
                    </dd>
                  </div>
                </dl>
              </>
            )}

            {status === STATUS.ACTIVE && (
              <p className="mt-3 text-muted-foreground text-xs">
                {t("P2P_UNSTAKE_DESCRIPTION")}
              </p>
            )}
          </section>
        )}

        {!isUserStakeLoading && status === STATUS.ACTIVE && (
          <Button
            onClick={() => p2pBoostRequestUnstakeMutation.mutate()}
            disabled={isRequesting}
            className="mt-auto w-full rounded-2xl py-6 font-semibold text-base"
          >
            {isRequesting ? (
              <span className="flex items-center gap-2">
                <Loader2 className="size-4 animate-spin" />
                {t("P2P_UNSTAKE_REQUESTING")}
              </span>
            ) : (
              t("P2P_UNSTAKE_REQUEST_BUTTON")
            )}
          </Button>
        )}

        {!isUserStakeLoading &&
          status !== STATUS.ACTIVE &&
          status !== STATUS.COOLDOWN && (
            <p className="mt-auto text-center text-muted-foreground text-sm">
              {t("P2P_UNSTAKE_NO_STAKE")}
            </p>
          )}
      </main>
    </>
  );
}
