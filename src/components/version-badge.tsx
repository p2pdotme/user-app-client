import { motion } from "motion/react";
import { useVersionClickCounter } from "@/hooks/use-dev-mode";
import { version } from "../../package.json";

interface VersionBadgeProps {
  className?: string;
}

export function VersionBadge({
  className = "text-xs font-light",
}: VersionBadgeProps) {
  const { handleClick, progress, showProgress, remainingClicks } =
    useVersionClickCounter();

  return (
    <div className="relative">
      <motion.button
        onClick={handleClick}
        className={`cursor-pointer select-none transition-colors hover:text-primary ${className}`}
        whileTap={{ scale: 0.95 }}
        animate={{
          color: showProgress ? "rgb(var(--primary))" : undefined,
        }}
        title={
          showProgress ? `Keep clicking! (${remainingClicks} more)` : undefined
        }>
        v{version}
      </motion.button>

      {/* Progress indicator */}
      {showProgress && (
        <motion.div
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          className="-top-2 -right-2 absolute flex items-center gap-1">
          {[...Array(Math.min(remainingClicks, 5))].map((_, i) => (
            <motion.div
              key={i}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: i * 0.1 }}
              className="size-1.5 rounded-full bg-primary/60"
            />
          ))}
        </motion.div>
      )}

      {/* Progress bar underneath */}
      {showProgress && (
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${progress * 100}%` }}
          className="-bottom-1 absolute left-0 h-0.5 rounded-full bg-primary/50"
          transition={{ duration: 0.3 }}
        />
      )}
    </div>
  );
}
