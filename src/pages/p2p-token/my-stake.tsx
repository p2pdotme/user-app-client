import { Loader2, Wallet } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { formatUnits, parseUnits } from "viem";
import { NonHomeHeader } from "@/components";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Skeleton } from "@/components/ui/skeleton";
import { useP2PBalance, useP2PBoost, useUserStake } from "@/hooks";
import { truncateAmount } from "@/lib/utils";

export function P2PMyStake() {
  const { t } = useTranslation();
  const { userStake, isUserStakeLoading } = useUserStake();
  const [isTopUpOpen, setIsTopUpOpen] = useState(false);

  // TODO: 18 decimal to 6
  const stakedAmount = userStake
    ? Number(formatUnits(userStake.stakedAmount, 18))
    : 0;
  const status = userStake ? Number(userStake.status) : 0;
  const cooldownEnd = userStake ? Number(userStake.cooldownEnd) : 0;
  const isActive = status === 1;

  return (
    <>
      <NonHomeHeader title={t("MY_STAKE_TITLE")} />
      <main className="no-scrollbar container-narrow flex h-full w-full flex-col gap-4 overflow-y-auto px-4 pt-6 pb-8">
        {isUserStakeLoading ? (
          <Skeleton className="h-32 w-full rounded-2xl" />
        ) : (
          <section className="rounded-2xl border border-border/60 bg-card/40 p-4">
            <div className="flex items-center justify-between">
              <p className="font-medium text-muted-foreground text-xs uppercase tracking-wider">
                {t("MY_STAKE_STAKED_LABEL")}
              </p>
            </div>
            <p className="mt-2 font-bold text-4xl text-foreground tabular-nums tracking-tight">
              {truncateAmount(stakedAmount)}{" "}
              <span className="text-muted-foreground text-base">$P2P</span>
            </p>
            {status === 2 && cooldownEnd > 0 && (
              <p className="mt-2 text-muted-foreground text-xs">
                {t("MY_STAKE_COOLDOWN_ENDS")}:{" "}
                <span className="text-foreground tabular-nums">
                  {new Date(cooldownEnd * 1000).toLocaleString()}
                </span>
              </p>
            )}
          </section>
        )}

        {isActive && (
          <Button
            onClick={() => setIsTopUpOpen(true)}
            className="mt-auto w-full rounded-2xl py-6 font-semibold text-base"
          >
            {t("MY_STAKE_TOPUP_BUTTON")}
          </Button>
        )}
      </main>

      <TopUpDrawer
        isOpen={isTopUpOpen}
        onClose={() => setIsTopUpOpen(false)}
      />
    </>
  );
}

interface TopUpDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

function TopUpDrawer({ isOpen, onClose }: TopUpDrawerProps) {
  const { t } = useTranslation();
  const [amount, setAmount] = useState("");
  const { p2pBalanceRaw, isP2PBalanceLoading } = useP2PBalance();
  const { p2pBoostTopUpMutation } = useP2PBoost();

  // TODO: 18 decimal to 6
  const p2pBalance = p2pBalanceRaw ? Number(formatUnits(p2pBalanceRaw, 18)) : 0;
  const parsedAmount = Number(amount);
  const isValid = parsedAmount > 0 && parsedAmount <= p2pBalance;
  const isProcessing = p2pBoostTopUpMutation.isPending;

  const handleAmountChange = (value: string) => {
    setAmount(value.replace(/\D/g, "").replace(/^0+(?=\d)/, ""));
  };

  const handleConfirm = () => {
    p2pBoostTopUpMutation.mutate(
      { tokens: parseUnits(amount, 18) },
      {
        onSuccess: () => {
          setAmount("");
          onClose();
        },
      },
    );
  };

  const handleOpenChange = (open: boolean) => {
    if (!open && !isProcessing) {
      setAmount("");
      onClose();
    }
  };

  return (
    <Drawer open={isOpen} onOpenChange={handleOpenChange}>
      <DrawerContent className="container-narrow mx-auto pb-8">
        <DrawerHeader>
          <DrawerTitle>{t("MY_STAKE_TOPUP_TITLE")}</DrawerTitle>
        </DrawerHeader>

        <div className="flex flex-col gap-4 px-4">
          <section className="rounded-2xl border border-border/60 bg-card/40 p-4">
            <div className="flex items-center justify-between">
              <p className="font-medium text-muted-foreground text-xs uppercase tracking-wider">
                {t("MY_STAKE_TOPUP_INPUT_LABEL")}
              </p>
              {isP2PBalanceLoading ? (
                <Skeleton className="h-6 w-24 rounded-full" />
              ) : (
                <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 text-foreground text-xs">
                  <Wallet className="size-3 text-muted-foreground" />
                  <span className="font-semibold tabular-nums">
                    {truncateAmount(p2pBalance)}
                  </span>
                  <span className="font-normal text-muted-foreground">
                    $P2P
                  </span>
                </div>
              )}
            </div>
            <div className="mt-2 flex items-center gap-3">
              <input
                type="tel"
                inputMode="numeric"
                pattern="[0-9]*"
                autoComplete="off"
                placeholder="0"
                aria-label={t("MY_STAKE_TOPUP_INPUT_LABEL")}
                value={amount}
                onChange={(e) => handleAmountChange(e.target.value)}
                className="min-w-0 flex-1 bg-transparent font-bold text-4xl text-foreground tabular-nums tracking-tight outline-none placeholder:text-muted-foreground/40"
              />
              <span className="font-semibold text-muted-foreground text-base">
                $P2P
              </span>
            </div>
          </section>

          <Button
            onClick={handleConfirm}
            disabled={!isValid || isProcessing}
            className="w-full rounded-2xl py-6 font-semibold text-base"
          >
            {isProcessing ? (
              <span className="flex items-center gap-2">
                <Loader2 className="size-4 animate-spin" />
                {t("MY_STAKE_TOPUP_CONFIRM")}...
              </span>
            ) : (
              t("MY_STAKE_TOPUP_CONFIRM")
            )}
          </Button>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
