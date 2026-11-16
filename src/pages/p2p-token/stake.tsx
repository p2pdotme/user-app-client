import { useIsMutating, useMutationState } from "@tanstack/react-query";
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
        // While the stake tx is in flight Back does nothing: leaving the
        // confirm step would invite a second stake.
        onBack={
          isStaking
            ? () => {}
            : step === "confirm"
              ? () => setStep("start")
              : undefined
        }
      />
      {step === "start" && (
        <StakeP2pStart
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
