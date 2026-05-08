import { CheckCircle, Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Card, CardContent } from "@/components/ui/card";
import type { P2PSwapStep } from "@/hooks";
import { cn } from "@/lib/utils";
import { PROGRESS_STEPS, STEP_ORDER } from "./shared";

interface SwapProgressProps {
  currentStep: P2PSwapStep;
}

export function SwapProgress({ currentStep }: SwapProgressProps) {
  const { t } = useTranslation();
  const currentIdx = STEP_ORDER.indexOf(currentStep);

  return (
    <Card className="border-none bg-primary/10 shadow-none">
      <CardContent className="px-4 py-3">
        <div className="flex flex-col gap-2 py-1">
          {PROGRESS_STEPS.map((step, idx) => {
            const stepIdx = STEP_ORDER.indexOf(step.key);
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
