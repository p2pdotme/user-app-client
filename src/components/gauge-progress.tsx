import { Progress as ProgressPrimitive } from "radix-ui";
import * as React from "react";
import { cn } from "@/lib/utils";

interface GaugeProgressProps
  extends React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root> {
  numerator: number;
  denominator: number;
  label?: string;
  size?: string;
}

const GaugeProgress = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  GaugeProgressProps
>(
  (
    {
      className,
      numerator,
      denominator,
      label = "Score",
      size = "size-40",
      ...props
    },
    ref,
  ) => {
    // Ensure value is between 0 and 100
    const normalizedValue = Math.max(0, Math.min(denominator, numerator));

    // Calculate the stroke-dasharray value based on the percentage
    // The gauge covers 270 degrees (75% of the circle), so we need to calculate
    // the percentage of 75 to represent our value
    const progressValue = (normalizedValue / denominator) * 75;

    return (
      <ProgressPrimitive.Root
        ref={ref}
        className={cn("relative", size, className)}
        value={normalizedValue}
        {...props}>
        <svg
          className="size-full rotate-135"
          viewBox="0 0 36 36"
          xmlns="http://www.w3.org/2000/svg">
          {/* Background Circle (Gauge) */}
          <circle
            cx="18"
            cy="18"
            r="16"
            fill="none"
            className="stroke-current text-primary/20"
            strokeWidth="3"
            strokeDasharray="75 100"
            strokeLinecap="round"
          />

          {/* Gauge Progress Indicator */}
          <ProgressPrimitive.Indicator asChild>
            <circle
              cx="18"
              cy="18"
              r="16"
              fill="none"
              className="stroke-current text-primary"
              strokeWidth="3"
              strokeDasharray={`${progressValue} 100`}
              strokeLinecap="round"
            />
          </ProgressPrimitive.Indicator>
        </svg>

        {/* Value Text */}
        <div className="-translate-x-1/2 -translate-y-1/2 absolute start-1/2 top-1/2 transform text-center">
          <span className="font-bold text-2xl text-primary">
            {normalizedValue}
          </span>
          {label && (
            <span className="block text-primary/80 text-xs">{label}</span>
          )}
        </div>
      </ProgressPrimitive.Root>
    );
  },
);

GaugeProgress.displayName = "GaugeProgress";

export { GaugeProgress };
