import { useIsMutating, useMutationState } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { NonHomeHeader } from "@/components";
import { ConfirmP2pStake } from "@/components/p2p-token/confirm-p2p-stake";
import { StakeP2pStart } from "@/components/p2p-token/stake-p2p-start";
import { SuccessP2pStake } from "@/components/p2p-token/success-p2p-stake";
import { P2P_BOOST_STAKE_MUTATION_KEY } from "@/hooks/use-p2p-boost";

type Step = "start" | "confirm" | "success";

const STEP_TITLE_KEY: Record<Step, string> = {
  start: "P2P_STAKE_TITLE",
  confirm: "P2P_STAKE_CONFIRM_TITLE",
  success: "P2P_STAKE_COMPLETED_TITLE",
};

/**
 * P2PStake — root page for the P2P token staking flow.
 *
 * Drives a three-step wizard (`start` → `confirm` → `success`) and owns the
 * shared `amount` state so child steps stay in sync. Also fetches a live
 * boost preview (buy / sell / pay limit unlocked) for the entered amount via
 * `useStakeBoostPreview`.
 */
export function P2PStake() {
  const { t } = useTranslation();
  const [step, setStep] = useState<Step>("start");
  const [amount, setAmount] = useState("");
  const [mountedAt] = useState(() => Date.now());

  // Read the stake mutation from the cache rather than the confirm step's
  // per-call callbacks, so a stake that settles is never lost to an unmount.
  const isStaking =
    useIsMutating({ mutationKey: P2P_BOOST_STAKE_MUTATION_KEY }) > 0;
  const stakeSucceeded = useMutationState({
    filters: { mutationKey: P2P_BOOST_STAKE_MUTATION_KEY, status: "success" },
    select: (mutation) => mutation.state.submittedAt,
  }).some((submittedAt) => submittedAt >= mountedAt);

  useEffect(() => {
    if (stakeSucceeded) setStep("success");
  }, [stakeSucceeded]);

  return (
    <>
      <NonHomeHeader
        title={t(STEP_TITLE_KEY[step])}
        // Back always works. A stake that is still confirming keeps running
        // (the mutation lives in the query cache, and its own onSuccess shows
        // the success toast and refreshes limits), and the success step is
        // driven by the cache above, so nothing is lost by going back.
        onBack={step === "confirm" ? () => setStep("start") : undefined}
      />
      {step === "start" && isStaking && <StakeInProgressNotice />}
      {step === "start" && (
        <StakeP2pStart
          isStakePending={isStaking}
          amount={amount}
          onAmountChange={setAmount}
          onContinue={() => setStep("confirm")}
        />
      )}
      {step === "confirm" && (
        <ConfirmP2pStake amount={amount} onBack={() => setStep("start")} />
      )}
      {step === "success" && <SuccessP2pStake amount={amount} />}
    </>
  );
}

function StakeInProgressNotice() {
  const { t } = useTranslation();
  return (
    <div
      role="status"
      className="container-narrow mx-auto mt-4 flex w-full items-start gap-3 rounded-2xl border border-primary/30 bg-primary/5 p-4">
      <Loader2 className="mt-0.5 size-4 shrink-0 animate-spin text-primary" />
      <div className="flex flex-col gap-1">
        <p className="font-semibold text-sm">{t("STAKE_IN_PROGRESS_TITLE")}</p>
        <p className="text-muted-foreground text-sm">
          {t("STAKE_IN_PROGRESS_DESCRIPTION")}
        </p>
      </div>
    </div>
  );
}
