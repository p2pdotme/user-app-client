import { motion } from "motion/react";
import { useTranslation } from "react-i18next";
import { DashedSeparator } from "@/components";
import { cn } from "@/lib/utils";

interface ProgressStep {
  key: string;
  activeTextKey: string;
  completedTextKey: string;
}

interface OrderProgressProps {
  steps: readonly ProgressStep[];
  currentStepKey: string;
  className?: string;
}

export function OrderProgress({
  steps,
  currentStepKey,
  className,
}: OrderProgressProps) {
  const { t } = useTranslation();

  const currentStepIndex = steps.findIndex(
    (step) => step.key === currentStepKey,
  );

  const getStepStatus = (stepIndex: number) => {
    if (stepIndex < currentStepIndex) return "completed";
    if (stepIndex === currentStepIndex) return "active";
    return "pending";
  };

  const getSeparatorStatus = (separatorIndex: number) => {
    // Separator between step i and step i+1
    if (separatorIndex < currentStepIndex - 1) return "completed";
    if (separatorIndex === currentStepIndex - 1) return "filling";
    return "pending";
  };

  return (
    <section className={cn("flex w-full flex-col gap-2 px-6 py-4", className)}>
      {/* Circles and separators row */}
      <div className="flex w-full items-center gap-1">
        {steps.map((step, stepIndex) => (
          <div
            key={step.key}
            className="flex flex-1 items-center gap-1 last:flex-none">
            {/* Step Circle */}
            <div
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-full border-2 border-primary/20",
                getStepStatus(stepIndex) === "completed" &&
                  "border-primary bg-primary",
                getStepStatus(stepIndex) === "active" && "bg-primary/20",
                getStepStatus(stepIndex) === "pending" && "border-primary/30",
              )}>
              {getStepStatus(stepIndex) === "active" && (
                <div className="size-4 animate-scale rounded-full bg-primary" />
              )}
            </div>

            {/* Separator (don't render after last step) */}
            {stepIndex < steps.length - 1 && (
              <div className="relative flex-1">
                {/* Background dashed line */}
                <DashedSeparator
                  className={cn(
                    "h-1 w-full rounded-full",
                    getSeparatorStatus(stepIndex) === "completed"
                      ? "text-primary"
                      : "text-primary/30",
                  )}
                  dashGap={
                    getSeparatorStatus(stepIndex) === "completed" ? "0" : "6"
                  }
                  dashSize="12"
                />
                {/* Animated solid line for filling separators */}
                {getSeparatorStatus(stepIndex) === "filling" && (
                  <motion.div
                    className="absolute top-0 left-0 h-1 w-full rounded-full bg-primary"
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{
                      duration: 1.2,
                      ease: "easeInOut",
                      delay: 0.3,
                    }}
                    style={{ transformOrigin: "left" }}
                  />
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Text labels row */}
      <div className="flex w-full justify-between px-1">
        {steps.map((step, stepIndex) => {
          const status = getStepStatus(stepIndex);
          return (
            <div key={step.key} className="flex w-8 justify-center">
              {status === "active" ? (
                <motion.p
                  className="text-center font-medium text-primary text-xs"
                  initial={{ opacity: 0.6, scale: 0.95 }}
                  animate={{
                    opacity: 1,
                    scale: [0.95, 1.05, 1],
                  }}
                  transition={{
                    opacity: { duration: 0.5, delay: 1.8 },
                    scale: {
                      duration: 1.2,
                      ease: "easeInOut",
                      delay: 2,
                    },
                  }}>
                  {t(step.activeTextKey)}
                </motion.p>
              ) : status === "completed" ? (
                <motion.p
                  className="text-center text-muted-foreground text-xs"
                  initial={{ opacity: 0.6, scale: 0.95 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5, delay: 1.2 }}>
                  {t(step.completedTextKey)}
                </motion.p>
              ) : (
                <p className="text-center text-muted-foreground/50 text-xs">
                  {t(step.activeTextKey)}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
