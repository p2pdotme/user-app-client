import { AlertTriangle, FileSearch, Inbox, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ERROR_MESSAGES, type ErrorCode } from "@/tax/lib/errors";

interface MessageProps {
  title: string;
  body: string;
}

function Message({
  icon: Icon,
  title,
  body,
}: MessageProps & { icon: typeof Inbox }) {
  return (
    <Card className="w-full items-center gap-3 border-dashed px-6 text-center shadow-none">
      <div className="rounded-full bg-primary/10 p-3">
        <Icon className="size-6 text-primary" />
      </div>
      <p className="font-medium">{title}</p>
      <p className="text-muted-foreground text-sm">{body}</p>
    </Card>
  );
}

export function EmptyState() {
  return (
    <Message
      icon={FileSearch}
      title="Enter your wallet address to begin"
      body="We fetch your full P2P.me order history (all years, so earlier purchases count as cost), then calculate tax for the financial year you choose."
    />
  );
}

export function NoOrdersState() {
  return (
    <Message
      icon={Inbox}
      title="No orders found for this address"
      body="Check that this is the wallet you use in the P2P.me app."
    />
  );
}

export function NoCompletedOrdersState({ fy }: { fy: string }) {
  return (
    <Message
      icon={Inbox}
      title={`No completed orders in ${fy}`}
      body="There is nothing to report for this financial year. Pick another year above to see its tax."
    />
  );
}

export function LoadingState({ loaded }: { loaded: number }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex w-full flex-col gap-4">
      <p className="text-center text-muted-foreground text-sm">
        {loaded > 0
          ? `Loaded ${loaded.toLocaleString("en-IN")} orders…`
          : "Loading your orders…"}
      </p>
      <Skeleton className="h-36 w-full rounded-xl" />
      <Skeleton className="h-9 w-full rounded-lg" />
      <Skeleton className="h-64 w-full rounded-xl" />
    </div>
  );
}

export function ErrorState({
  onRetry,
  code,
}: {
  onRetry: () => void;
  code?: ErrorCode;
}) {
  return (
    <Card
      role="alert"
      className="w-full items-center gap-3 border-destructive/30 px-6 text-center shadow-none">
      <CardContent className="flex flex-col items-center gap-3">
        <AlertTriangle className="size-8 text-destructive" />
        <p className="font-medium">Could not load your orders</p>
        <p className="text-muted-foreground text-sm">
          {ERROR_MESSAGES[code ?? "SGNetworkError"]}
        </p>
        <Button variant="outline" onClick={onRetry}>
          <RotateCcw />
          Retry
        </Button>
      </CardContent>
    </Card>
  );
}
