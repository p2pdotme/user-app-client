import type { ReactNode } from "react";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * Value cell for fee-derived rows on SELL order screens. Shows a skeleton
 * while the fee query loads, a fallback (or a dash) if it failed, so a failed
 * query never leaves a skeleton spinning forever.
 */
export function FeeDetailValue({
  isLoading,
  isError,
  value,
  fallback,
  skeletonClassName = "h-4 w-20",
}: {
  isLoading: boolean;
  isError: boolean;
  value: ReactNode;
  fallback?: ReactNode;
  skeletonClassName?: string;
}) {
  if (isLoading) return <Skeleton className={skeletonClassName} />;
  if (isError) return <>{fallback ?? "—"}</>;
  return <>{value}</>;
}
