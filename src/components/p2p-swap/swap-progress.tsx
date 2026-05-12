import { CheckCircle, Loader2, XCircle } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Card, CardContent } from "@/components/ui/card";
import type { P2PSwapStep } from "@/hooks";
import type { WormholeBridgeState, WormholeBridgeStep } from "@/hooks/use-wormhole-bridge";
import { cn } from "@/lib/utils";
import { getProgressSteps, getStepOrder, type SwapDirection } from "./shared";

// WormholeSteps is kept for the dev test panels (DevSolanaToBaseTest / DevBaseToSolanaTest)

// ── WormholeSteps ─────────────────────────────────────────────────────────────

const STEPS_SOLANA_TO_BASE: { key: WormholeBridgeStep; label: string }[] = [
  { key: "locking",      label: "Locking P2P on Solana" },
  { key: "awaiting_vaa", label: "Awaiting Wormhole VAA (~10-15 min)" },
  { key: "redeeming",    label: "Minting P2P on Base" },
];

const STEPS_BASE_TO_SOLANA: { key: WormholeBridgeStep; label: string }[] = [
  { key: "locking",      label: "Burning P2P on Base" },
  { key: "awaiting_vaa", label: "Awaiting Wormhole VAA (~10-15 min)" },
  { key: "redeeming",    label: "Releasing P2P on Solana" },
];

const WORMHOLE_STEP_ORDER: WormholeBridgeStep[] = [
  "locking", "awaiting_vaa", "redeeming", "completed", "failed",
];

export function WormholeSteps({
  state,
  indexOffset,
  direction = "solana-to-base",
}: {
  state: WormholeBridgeState;
  indexOffset: number;
  direction?: "solana-to-base" | "base-to-solana";
}) {
  const steps = direction === "base-to-solana" ? STEPS_BASE_TO_SOLANA : STEPS_SOLANA_TO_BASE;
  const currentIdx = WORMHOLE_STEP_ORDER.indexOf(state.step);

  return (
    <>
      {steps.map((step, idx) => {
        const stepIdx = WORMHOLE_STEP_ORDER.indexOf(step.key);
        const isDone = stepIdx < currentIdx && state.step !== "failed";
        const isActive = step.key === state.step;
        const isFailed = state.step === "failed" && isActive;

        return (
          <div key={`wh-${step.key}`} className="flex items-center gap-3">
            <div
              className={cn(
                "flex size-5 shrink-0 items-center justify-center rounded-full text-xs",
                isDone && "bg-success text-white",
                isActive && !isFailed && "bg-primary text-primary-foreground",
                isFailed && "bg-destructive text-white",
                !isDone && !isActive && "bg-muted text-muted-foreground",
              )}>
              {isDone ? (
                <CheckCircle className="size-3" />
              ) : isFailed ? (
                <XCircle className="size-3" />
              ) : isActive ? (
                <Loader2 className="size-3 animate-spin" />
              ) : (
                <span>{indexOffset + idx + 1}</span>
              )}
            </div>
            <span
              className={cn(
                "text-sm",
                isDone && "text-success",
                isActive && !isFailed && "font-medium text-foreground",
                isFailed && "text-destructive",
                !isDone && !isActive && "text-muted-foreground",
              )}>
              {step.label}
            </span>
          </div>
        );
      })}
    </>
  );
}

// ── SwapProgress ──────────────────────────────────────────────────────────────

interface SwapProgressProps {
  currentStep: P2PSwapStep;
  direction: SwapDirection;
}

export function SwapProgress({ currentStep, direction }: SwapProgressProps) {
  const { t } = useTranslation();
  const progressSteps = getProgressSteps(direction);
  const stepOrder = getStepOrder(direction);
  const currentIdx = stepOrder.indexOf(currentStep);

  return (
    <Card className="border-none bg-primary/10 shadow-none">
      <CardContent className="px-4 py-3">
        <div className="flex flex-col gap-2 py-1">
          {progressSteps.map((step, idx) => {
            const stepIdx = stepOrder.indexOf(step.key);
            const isDone = stepIdx < currentIdx;
            const isActive = step.key === currentStep;

            return (
              <div key={step.key} className="flex items-center gap-3">
                <div
                  className={cn(
                    "flex size-5 shrink-0 items-center justify-center rounded-full text-xs",
                    isDone && "bg-success text-white",
                    isActive && "bg-primary text-primary-foreground",
                    !isDone && !isActive && "bg-muted text-muted-foreground",
                  )}>
                  {isDone ? (
                    <CheckCircle className="size-3" />
                  ) : isActive ? (
                    <Loader2 className="size-3 animate-spin" />
                  ) : (
                    <span>{idx + 1}</span>
                  )}
                </div>
                <span
                  className={cn(
                    "text-sm",
                    isDone && "text-success",
                    isActive && "font-medium text-foreground",
                    !isDone && !isActive && "text-muted-foreground",
                  )}>
                  {t(step.labelKey)}
                </span>
              </div>
            );
          })}

        </div>
      </CardContent>
    </Card>
  );
}
