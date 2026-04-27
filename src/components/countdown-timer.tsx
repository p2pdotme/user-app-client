import moment from "moment";
import { motion } from "motion/react";
import { Progress as ProgressPrimitive } from "radix-ui";
import * as React from "react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";

export interface CountdownTimerProps {
  /** Unix timestamp when the countdown started (in seconds) */
  startTimestamp: string;
  /** Duration of the countdown in milliseconds */
  countdownDuration: number;
  /** Optional className for styling */
  className?: string;
  /** Called when countdown reaches zero */
  onComplete?: () => void;
  /** Title/CTA text to display (e.g., "Pay Within") */
  title?: string;
}

export const CountdownTimer = React.memo(
  ({
    startTimestamp,
    countdownDuration,
    className,
    onComplete,
    title,
  }: CountdownTimerProps) => {
    const { t } = useTranslation();
    const [progress, setProgress] = React.useState(100);
    const [timeText, setTimeText] = React.useState("00:00");
    const [isExpired, setIsExpired] = React.useState(false);

    const intervalRef = React.useRef<NodeJS.Timeout | null>(null);
    const hasCalledComplete = React.useRef(false);

    const updateTimer = React.useCallback(() => {
      const now = moment.now();
      const elapsed = now - Number(startTimestamp);
      const remaining = Math.max(0, countdownDuration - elapsed);

      if (remaining <= 0) {
        setProgress(0);
        setTimeText("00:00");
        setIsExpired(true);

        if (!hasCalledComplete.current) {
          hasCalledComplete.current = true;
          onComplete?.();
        }
        return;
      }

      const newProgress = (remaining / countdownDuration) * 100;
      const duration = moment.duration(remaining);
      const minutes = Math.floor(duration.asMinutes());
      const seconds = duration.seconds();
      const newTimeText = `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;

      setProgress(newProgress);
      setTimeText(newTimeText);
    }, [startTimestamp, countdownDuration, onComplete]);

    React.useEffect(() => {
      updateTimer(); // Initial update
      intervalRef.current = setInterval(updateTimer, 100);

      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      };
    }, [updateTimer]);

    const colors = React.useMemo(() => {
      if (progress > 50)
        return {
          progress: "bg-primary/20",
          text: "text-primary",
          indicator: "bg-primary",
        };
      if (progress > 20)
        return {
          progress: "bg-warning/20",
          text: "text-warning",
          indicator: "bg-warning",
        };
      return {
        progress: "bg-destructive/20",
        text: "text-destructive",
        indicator: "bg-destructive",
      };
    }, [progress]);

    return (
      <div className={cn("w-full space-y-3", className)}>
        {/* Header with title and remaining time */}
        <div className="flex items-center justify-between">
          <span className="font-medium text-sm">
            {title || t("PAY_WITHIN")}
          </span>
          <motion.span
            className={cn("font-medium text-sm", colors.text)}
            animate={{ scale: isExpired ? [1, 1.1, 1] : 1 }}
            transition={{ scale: { duration: 0.3 } }}>
            {isExpired ? t("EXPIRED") : timeText}
          </motion.span>
        </div>

        {/* Progress bar */}
        <motion.div
          animate={{ scale: isExpired ? [1, 1.01, 1] : 1 }}
          transition={{ scale: { duration: 0.3 } }}>
          <ProgressPrimitive.Root
            data-slot="progress"
            className={cn(
              "relative h-2 w-full overflow-hidden rounded-full",
              colors.progress,
            )}
            value={progress}>
            <ProgressPrimitive.Indicator
              data-slot="progress-indicator"
              className={cn(
                "h-full w-full flex-1 opacity-100 transition-all",
                colors.indicator,
              )}
              style={{ transform: `translateX(-${100 - (progress || 0)}%)` }}
            />
          </ProgressPrimitive.Root>
        </motion.div>
      </div>
    );
  },
);

CountdownTimer.displayName = "CountdownTimer";
