import {
  type ReactNode,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import { cn, isIOS } from "@/lib/utils";

interface PullToRefreshProps {
  pullDownThreshold?: number;
  disabled?: boolean;
  children: ReactNode;
}

export function PullToRefresh({
  pullDownThreshold = 80,
  disabled = false,
  children,
}: PullToRefreshProps) {
  const [isPulling, setIsPulling] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const startY = useRef(0);
  const refreshing = useRef(false);

  const handleRefresh = useCallback(() => {
    window.dispatchEvent(new CustomEvent("app:refresh"));
  }, []);

  useEffect(() => {
    const isStandalone = window.matchMedia(
      "(display-mode: standalone)",
    ).matches;

    if (disabled || !isIOS() || !isStandalone) {
      return;
    }

    const touchStart = (e: TouchEvent) => {
      if (window.scrollY > 0 || refreshing.current) return;
      startY.current = e.touches[0].clientY;
      setIsPulling(true);
    };

    const touchMove = (e: TouchEvent) => {
      if (!isPulling || refreshing.current) return;

      const deltaY = e.touches[0].clientY - startY.current;
      if (deltaY <= 0) {
        setPullDistance(0);
        return;
      }

      if (window.scrollY <= 0) {
        e.preventDefault();
      }

      setPullDistance(Math.min(deltaY * 0.5, pullDownThreshold * 1.5));
    };

    const touchEnd = () => {
      if (!isPulling || refreshing.current) return;

      setIsPulling(false);

      if (pullDistance >= pullDownThreshold) {
        refreshing.current = true;
        setPullDistance(pullDownThreshold);
        handleRefresh();

        setTimeout(() => {
          setPullDistance(0);
          refreshing.current = false;
        }, 1000);
      } else {
        setPullDistance(0);
      }
    };

    document.addEventListener("touchstart", touchStart, { passive: false });
    document.addEventListener("touchmove", touchMove, { passive: false });
    document.addEventListener("touchend", touchEnd);

    return () => {
      document.removeEventListener("touchstart", touchStart);
      document.removeEventListener("touchmove", touchMove);
      document.removeEventListener("touchend", touchEnd);
    };
  }, [isPulling, pullDistance, pullDownThreshold, disabled, handleRefresh]);

  const isOverThreshold = pullDistance >= pullDownThreshold;

  return (
    <div className="relative h-full w-full">
      {pullDistance > 0 && (
        <div
          className={cn(
            "absolute top-0 right-0 left-0 z-[999] flex items-center justify-center bg-background",
            !isPulling && "transition-[height]",
          )}
          style={{ height: `${pullDistance}px` }}>
          <div
            className="flex items-center"
            style={{ opacity: Math.min(pullDistance / pullDownThreshold, 1) }}>
            <div
              className={cn(
                "mr-2 h-5 w-5 rounded-full border-2 border-primary border-t-transparent",
                isOverThreshold && "animate-spin",
              )}
            />
            <span className="font-bold text-primary">
              {isOverThreshold ? "Release to refresh" : "Pull to refresh"}
            </span>
          </div>
        </div>
      )}
      <div
        className={cn(
          "h-full w-full",
          !isPulling && "transition-transform duration-300 ease-out",
        )}
        style={{ transform: `translateY(${pullDistance}px)` }}>
        {children}
      </div>
    </div>
  );
}
