import { useState } from "react";
import { useTranslation } from "react-i18next";
import { NonHomeHeader } from "@/components";
import { ConfirmP2pStake } from "@/components/p2p-token/confirm-p2p-stake";
import { StakeP2pStart } from "@/components/p2p-token/stake-p2p-start";
import { SuccessP2pStake } from "@/components/p2p-token/success-p2p-stake";

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
      {step === "success" && <SuccessP2pStake amount={amount} />}
    </>
  );
}
