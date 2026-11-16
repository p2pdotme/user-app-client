import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";

interface OrderElapsedTimeProps {
  /** Unix timestamp in seconds (as returned by the contract) to count from. */
  sinceTimestamp: string | number | bigint | undefined;
  /**
   * After this many seconds the indicator switches from the neutral
   * "usually takes" style to a "taking longer than usual" warning.
   */
  expectedSeconds: number;
  className?: string;
}

function formatDuration(totalSeconds: number) {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const minutes = Math.floor(safe / 60);
  const seconds = safe % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

/**
 * Honest replacement for the static "On time" label on order waiting screens.
 * Shows real elapsed time and tells the user when things are slower than
 * expected, instead of always claiming everything is on schedule.
 */
export function OrderElapsedTime({
  sinceTimestamp,
  expectedSeconds,
  className,
}: OrderElapsedTimeProps) {
  const { t } = useTranslation();
  const since = Number(sinceTimestamp ?? 0);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  if (!since || Number.isNaN(since)) return null;

  const elapsed = now / 1000 - since;
  const isSlow = elapsed > expectedSeconds;

  return (
    <p
      className={cn(
        "text-center text-sm tabular-nums",
        isSlow ? "text-warning" : "text-muted-foreground",
        className,
      )}>
      {isSlow
        ? t("ORDER_TAKING_LONGER_THAN_USUAL", {
            elapsed: formatDuration(elapsed),
          })
        : expectedSeconds < 120
          ? t("ORDER_ELAPSED_TIME_SECONDS", {
              elapsed: formatDuration(elapsed),
              expected: expectedSeconds,
            })
          : t("ORDER_ELAPSED_TIME", {
              elapsed: formatDuration(elapsed),
              expected: Math.ceil(expectedSeconds / 60),
            })}
      {/* The visible text ticks every second, so it is not a live region.
          Screen readers only hear the switch to "taking longer". */}
      <span className="sr-only" aria-live="polite">
        {isSlow ? t("ORDER_TAKING_LONGER_ANNOUNCEMENT") : ""}
      </span>
    </p>
  );
}
