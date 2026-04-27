import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function TransactionCardSkeleton() {
  return (
    <Card className="w-full cursor-pointer gap-0 py-4 transition-colors">
      <CardContent className="flex items-start justify-between gap-2 px-4">
        <div className="flex flex-1 items-start gap-4">
          <Skeleton className="mt-1 h-10 w-10 rounded-md" />
          <div className="flex h-full flex-col gap-2 pt-1">
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-4 w-40" />
          </div>
        </div>
        <div className="flex flex-col items-end justify-between gap-2 pt-1">
          <Skeleton className="h-5 w-20" />
          <Skeleton className="h-4 w-16" />
        </div>
      </CardContent>
    </Card>
  );
}
