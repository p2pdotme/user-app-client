import moment from "moment";
import { motion } from "motion/react";
import { Progress as ProgressPrimitive } from "radix-ui";
import * as React from "react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";

export interface CircleCountdownTimerProps {
  /** Unix timestamp when the countdown started (in seconds) */
  startTimestamp: string;
  /** Duration of the countdown in milliseconds */
  countdownDuration: number;
  /** Optional className for styling */
  className?: string;
  /** Called when countdown reaches zero */
  onComplete?: () => void;
}

export const CircleCountdownTimer = ({
  startTimestamp,
  countdownDuration,
  className,
  onComplete,
}: CircleCountdownTimerProps) => {
  const { t } = useTranslation();
  const [progress, setProgress] = React.useState(100);
  const [timeText, setTimeText] = React.useState("00:00");
  const [isExpired, setIsExpired] = React.useState(false);

  const intervalRef = React.useRef<NodeJS.Timeout | null>(null);
  const hasCalledComplete = React.useRef(false);

  const updateTimer = React.useCallback(() => {
    // Convert Unix timestamp (seconds) to current Unix timestamp (seconds) for comparison
    const now = moment().unix(); // Current time in seconds
    const startTimeUnix = Number(startTimestamp); // Start time in seconds
    const elapsed = (now - startTimeUnix) * 1000; // Convert to milliseconds for duration comparison
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

  // Calculate color based on remaining time percentage
  const getColor = (progress: number): string => {
    if (progress > 50) return "var(--primary)";
    if (progress > 20) return "var(--warning)";
    return "var(--destructive)";
  };

  const color = getColor(progress);
  const size = 120;
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const center = size / 2;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div
      className={cn(
        "relative inline-flex items-center justify-center",
        className,
      )}
      style={{ width: size, height: size }}>
      <ProgressPrimitive.Root
        value={progress}
        max={100}
        className="relative"
        style={{ width: size, height: size }}
        aria-label="Countdown timer progress">
        {/* Background circle */}
        <svg
          width={size}
          height={size}
          className="-rotate-90 absolute transform">
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke="var(--primary)"
            strokeWidth={strokeWidth}
            className="opacity-20"
          />
        </svg>

        {/* Progress circle */}
        <ProgressPrimitive.Indicator asChild>
          <svg
            width={size}
            height={size}
            className="-rotate-90 absolute transform">
            <motion.circle
              cx={center}
              cy={center}
              r={radius}
              fill="none"
              stroke={color}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              strokeDasharray={circumference}
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset, stroke: color }}
              transition={{
                strokeDashoffset: { duration: 0.1, ease: "linear" },
              }}
            />
          </svg>
        </ProgressPrimitive.Indicator>
      </ProgressPrimitive.Root>

      {/* Time display */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.span
          className="font-mono font-semibold text-lg tabular-nums"
          style={{ color }}
          animate={{ color, scale: isExpired ? [1, 1.1, 1] : 1 }}
          transition={{ color: { duration: 0.3 }, scale: { duration: 0.3 } }}>
          {timeText}
        </motion.span>

        {isExpired && (
          <motion.span
            className="mt-1 font-medium text-xs opacity-70"
            style={{ color }}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 0.7, y: 0 }}
            transition={{ delay: 0.2, duration: 0.3 }}>
            {t("EXPIRED")}
          </motion.span>
        )}
      </div>
    </div>
  );
};
