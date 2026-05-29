import { CheckCircle2, Loader2, Wallet } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { formatUnits, parseUnits } from "viem";
import { NonHomeHeader } from "@/components";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useP2PBalance, useP2PBoost, useUserStake } from "@/hooks";
import { truncateAmount } from "@/lib/utils";

type Step = "start" | "confirm" | "success";

const STEP_TITLE_KEY: Record<Step, string> = {
  start: "P2P_STAKE_TITLE",
  confirm: "P2P_STAKE_CONFIRM_TITLE",
  success: "P2P_STAKE_TITLE",
};

export function P2PStake() {
  const { t } = useTranslation();
  const [step, setStep] = useState<Step>("start");
  const [amount, setAmount] = useState("");

  return (
    <>
      <NonHomeHeader
        title={t(STEP_TITLE_KEY[step])}
        onBack={step === "confirm" ? () => setStep("start") : undefined}
      />
      {step === "start" && (
        <StakeP2pStart
          amount={amount}
          onAmountChange={setAmount}
          onContinue={() => setStep("confirm")}
        />
      )}
      {step === "confirm" && (
        <ConfirmP2pStake
          amount={amount}
          onBack={() => setStep("start")}
          onConfirm={() => setStep("success")}
        />
      )}
      {step === "success" && <SuccessP2pStake />}
    </>
  );
}

interface StakeP2pStartProps {
  amount: string;
  onAmountChange: (value: string) => void;
  onContinue: () => void;
}

function StakeP2pStart({
  amount,
  onAmountChange,
  onContinue,
}: StakeP2pStartProps) {
  const { t } = useTranslation();
  const { p2pBalanceRaw, isP2PBalanceLoading } = useP2PBalance();

  // TODO: 
  const p2pBalance = p2pBalanceRaw ? Number(formatUnits(p2pBalanceRaw, 18)) : 0;
  const parsedAmount = Number(amount);
  const isValid = parsedAmount > 0 && parsedAmount <= p2pBalance;

  const handleAmountChange = (value: string) => {
    onAmountChange(value.replace(/\D/g, "").replace(/^0+(?=\d)/, ""));
  };

  return (
    <main className="no-scrollbar container-narrow flex h-full w-full flex-col gap-4 overflow-y-auto px-4 pt-6 pb-8">
      {/* Stake amount card */}
      <section className="rounded-2xl border border-border/60 bg-card/40 p-4">
        <div className="flex items-center justify-between">
          <p className="font-medium text-muted-foreground text-xs uppercase tracking-wider">
            {t("P2P_STAKE_INPUT_LABEL")}
          </p>
          {isP2PBalanceLoading ? (
            <Skeleton className="h-6 w-24 rounded-full" />
          ) : (
            <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 text-foreground text-xs">
              <Wallet className="size-3 text-muted-foreground" />
              <span className="font-semibold tabular-nums">
                {truncateAmount(p2pBalance)}
              </span>
              <span className="font-normal text-muted-foreground">$P2P</span>
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
            aria-label={t("P2P_STAKE_INPUT_LABEL")}
            value={amount}
            onChange={(e) => handleAmountChange(e.target.value)}
            className="min-w-0 flex-1 bg-transparent font-bold text-4xl text-foreground tabular-nums tracking-tight outline-none placeholder:text-muted-foreground/40"
          />
          <span className="font-semibold text-muted-foreground text-base">
            $P2P
          </span>
        </div>
        <p className="mt-1 text-muted-foreground text-xs tabular-nums">
          ≈ 0.00 USDC
        </p>
      </section>

      {/* Quick picks */}
      <div className="grid grid-cols-3 gap-2">
        <button
          type="button"
          className="rounded-xl border border-border/60 bg-card/40 py-2.5 font-semibold text-foreground text-sm transition-colors hover:bg-primary/10"
        >
          25%
        </button>
        <button
          type="button"
          className="rounded-xl border border-border/60 bg-card/40 py-2.5 font-semibold text-foreground text-sm transition-colors hover:bg-primary/10"
        >
          50%
        </button>
        <button
          type="button"
          className="rounded-xl border border-border/60 bg-card/40 py-2.5 font-semibold text-foreground text-sm uppercase transition-colors hover:bg-primary/10"
        >
          {t("MAX")}
        </button>
      </div>

      <Button
        disabled={!isValid}
        onClick={onContinue}
        className="mt-auto w-full rounded-2xl py-6 text-base font-semibold"
      >
        {t("CONTINUE")}
      </Button>
    </main>
  );
}

interface ConfirmP2pStakeProps {
  amount: string;
  onBack: () => void;
  onConfirm: () => void;
}

function ConfirmP2pStake({ amount, onBack, onConfirm }: ConfirmP2pStakeProps) {
  const { t } = useTranslation();
  const { p2pBoostStakeMutation } = useP2PBoost();
  const numericAmount = Number(amount) || 0;
  const isProcessing = p2pBoostStakeMutation.isPending;

  // TODO: 18 decimal to 6
  const handleConfirm = () => {
    p2pBoostStakeMutation.mutate(
      { tokens: parseUnits(amount, 18) },
      { onSuccess: () => onConfirm() },
    );
  };

  return (
    <main className="no-scrollbar container-narrow flex h-full w-full flex-col gap-4 overflow-y-auto px-4 pt-6 pb-8">
      <section className="rounded-2xl border border-border/60 bg-card/40 p-4">
        {/* Staking amount */}
        <p className="font-medium text-muted-foreground text-xs uppercase tracking-wider">
          {t("P2P_STAKE_CONFIRM_STAKING")}
        </p>
        <p className="mt-1 font-bold text-4xl text-foreground tabular-nums tracking-tight">
          {numericAmount} <span className="text-muted-foreground">$P2P</span>
        </p>

        <div className="my-4 h-px bg-border/60" />

        {/* Rows */}
        <dl className="flex flex-col gap-2 text-sm">
          <div className="flex items-center justify-between">
            <dt className="text-muted-foreground">Unlocks</dt>
            <dd className="font-semibold text-emerald-500 tabular-nums">
              +${numericAmount} per txn · Buy + Sell
            </dd>
          </div>
          <div className="flex items-center justify-between">
            <dt className="text-muted-foreground">You pay</dt>
            <dd className="font-semibold text-foreground tabular-nums">
              {numericAmount.toFixed(2)} USDC
            </dd>
          </div>
          <div className="flex items-center justify-between">
            <dt className="text-muted-foreground">Applies</dt>
            <dd className="font-semibold text-foreground">Instantly</dd>
          </div>
        </dl>
      </section>

      <div className="mt-auto flex flex-col gap-2">
        <Button
          variant="outline"
          onClick={onBack}
          disabled={isProcessing}
          className="w-full rounded-2xl py-6 text-base font-semibold"
        >
          {t("CANCEL")}
        </Button>
        <Button
          onClick={handleConfirm}
          disabled={isProcessing}
          className="w-full rounded-2xl py-6 text-base font-semibold"
        >
          {isProcessing ? (
            <span className="flex items-center gap-2">
              <Loader2 className="size-4 animate-spin" />
              Staking...
            </span>
          ) : (
            t("CONFIRM")
          )}
        </Button>
      </div>
    </main>
  );
}

function SuccessP2pStake() {
  const { t } = useTranslation();
  const { userStake, isUserStakeLoading } = useUserStake();

  // TODO: 18 decimal to 6
  const stakedAmount = userStake
    ? Number(formatUnits(userStake.stakedAmount, 18))
    : 0;

  return (
    <main className="no-scrollbar container-narrow flex h-full w-full flex-col items-center justify-center gap-4 overflow-y-auto px-4 py-6 pb-28 text-center">
      <CheckCircle2 className="size-16 text-emerald-500" />
      <h2 className="font-bold text-2xl text-foreground">
        {t("P2P_STAKE_SUCCESS")}
      </h2>
      {isUserStakeLoading ? (
        <Skeleton className="h-8 w-40 rounded-full" />
      ) : (
        <p className="font-semibold text-3xl text-foreground tabular-nums tracking-tight">
          {truncateAmount(stakedAmount)}{" "}
          <span className="text-muted-foreground">$P2P</span>
        </p>
      )}
    </main>
  );
}
