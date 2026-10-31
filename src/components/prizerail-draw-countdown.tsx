import { Fragment, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Skeleton } from "@/components/ui/skeleton";

const TICK_MS = 1_000;
const SECOND_MS = 1_000;
const MINUTE_MS = 60 * SECOND_MS;
const HOUR_MS = 60 * MINUTE_MS;
const DAY_MS = 24 * HOUR_MS;

interface DrawCountdownProps {
  /** Draw time, epoch milliseconds. */
  targetMs: number;
  /** Called once when the countdown reaches zero. */
  onElapsed?: () => void;
}

interface CountdownUnit {
  value: number;
  unit: string;
}

function toUnits(remainingMs: number): CountdownUnit[] {
  const days = Math.floor(remainingMs / DAY_MS);
  const hours = Math.floor((remainingMs % DAY_MS) / HOUR_MS);
  const minutes = Math.floor((remainingMs % HOUR_MS) / MINUTE_MS);
  const seconds = Math.floor((remainingMs % MINUTE_MS) / SECOND_MS);
  const units = [
    { value: hours, unit: "h" },
    { value: minutes, unit: "m" },
    { value: seconds, unit: "s" },
  ];
  // A days tile only when the draw is more than a day out.
  return days > 0 ? [{ value: days, unit: "d" }, ...units] : units;
}

/** Live countdown to a draw as tiles, e.g. [02h] : [14m] : [09s]. */
export function DrawCountdown({ targetMs, onElapsed }: DrawCountdownProps) {
  const { t } = useTranslation();
  const [now, setNow] = useState(() => Date.now());
  const remainingMs = Math.max(0, targetMs - now);
  const isElapsed = remainingMs === 0;

  useEffect(() => {
    if (isElapsed) return;
    const id = window.setInterval(() => setNow(Date.now()), TICK_MS);
    return () => window.clearInterval(id);
  }, [isElapsed]);

  useEffect(() => {
    if (isElapsed) onElapsed?.();
  }, [isElapsed, onElapsed]);

  if (isElapsed) {
    return (
      <p className="font-semibold text-primary text-xs">
        {t("PRIZERAIL_DRAWING_NOW")}
      </p>
    );
  }

  const units = toUnits(remainingMs);
  return (
    <div className="flex items-center gap-1" aria-live="off">
      {units.map(({ value, unit }, index) => (
        <Fragment key={unit}>
          {index > 0 && (
            <span className="font-bold text-primary/40 text-xs">:</span>
          )}
          <div className="flex items-baseline gap-0.5 rounded-md bg-primary/10 px-1.5 py-0.5">
            <span className="font-bold text-primary text-sm tabular-nums tracking-wider">
              {String(value).padStart(2, "0")}
            </span>
            <span className="font-medium text-[9px] text-primary/70">
              {unit}
            </span>
          </div>
        </Fragment>
      ))}
    </div>
  );
}

// Same footprint as the h/m/s tiles, so nothing shifts when the feed lands.
const SKELETON_TILES = ["h", "m", "s"] as const;

/** Shimmer in place of the countdown while the draw time is loading. */
export function DrawCountdownSkeleton() {
  return (
    <div className="flex items-center gap-1" aria-busy="true">
      {SKELETON_TILES.map((unit, index) => (
        <Fragment key={unit}>
          {index > 0 && (
            <span className="font-bold text-primary/40 text-xs">:</span>
          )}
          <Skeleton className="h-6 w-9 bg-primary/10" />
        </Fragment>
      ))}
    </div>
  );
}
