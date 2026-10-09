import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useTaskLedger } from "@/hooks";
import { cn } from "@/lib/utils";

// Task type mapping for display - inspired by CompletedCard logic
const getTaskTitle = (
  taskType: number,
  rp: number,
  t: (key: string, options?: { taskType?: number }) => string,
): string => {
  const taskTitles: { [key: number]: string } = {
    0: t("TASK_SUCCESSFUL_RECOMMENDATION"),
    1: t("TASK_COMPLETED_TRANSACTION"),
    2: t("TASK_AADHAR_VERIFICATION"),
    3: rp >= 0 ? t("TASK_REWARDED_BY_ADMIN") : t("TASK_SLASHED_BY_ADMIN"),
    4: t("TASK_COMPLETED_SELL_ORDER"),
    5: t("TASK_DISPUTE_SETTLEMENT_DEDUCTION"),
    6: t("TASK_LYING_PAID_DEDUCTION"),
    7: t("TASK_MARKETING_CAMPAIGN"),
    8: t("TASK_LINKEDIN_VERIFICATION"),
    9: t("TASK_GITHUB_VERIFICATION"),
    10: t("TASK_X_VERIFICATION"),
    11: t("TASK_INSTAGRAM_VERIFICATION"),
    12: t("TASK_USER_MIGRATION"),
    13: t("TASK_FACEBOOK_VERIFICATION"),
    14: t("TASK_PASSPORT_VERIFICATION"),
    15: t("TASK_BINANCE_VERIFICATION"),
    16: t("TASK_KYC_VERIFICATION"),
    17: t("TASK_BVN_VERIFICATION"),
  };
  return taskTitles[taskType] || t("TASK_UNKNOWN", { taskType });
};

export function TaskLedger() {
  const { t } = useTranslation();
  const { taskLedger, isTaskLedgerLoading, isTaskLedgerError } =
    useTaskLedger();

  if (isTaskLedgerLoading) {
    return (
      <Card className="w-full gap-3 border-none bg-transparent py-0 shadow-none">
        <CardHeader className="p-0">
          <CardTitle className="text-left font-medium text-lg">
            {t("LIMIT_UPDATES")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 p-0">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="flex flex-row items-center gap-3 rounded-2xl border border-border bg-card p-4">
              <div className="flex flex-1 flex-row items-center justify-between">
                <div className="flex w-[100%] flex-col gap-1">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-3 w-24" />
                </div>
                <div className="flex flex-row items-center gap-1">
                  <Skeleton className="h-5 w-12" />
                  <Skeleton className="h-3 w-6" />
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (isTaskLedgerError) {
    return (
      <Card className="w-full gap-3 border-none bg-transparent py-0 shadow-none">
        <CardHeader className="p-0">
          <CardTitle className="text-left font-medium text-lg">
            {t("LIMIT_UPDATES")}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="py-4 text-left text-red-500">
            {t("ERROR_LOADING_TASK_LEDGER")}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!taskLedger || taskLedger.length === 0) {
    return (
      <Card className="w-full gap-3 border-none bg-transparent py-0 shadow-none">
        <CardHeader className="p-0">
          <CardTitle className="text-left font-medium text-lg">
            {t("LIMIT_UPDATES")}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="py-4 text-left text-muted-foreground">
            {t("NO_TASK_LEDGER_ENTRIES")}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full gap-3 border-none bg-transparent py-0 shadow-none">
      <CardHeader className="p-0">
        <CardTitle className="text-left font-medium text-lg">
          {t("LIMIT_UPDATES")}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 p-0">
        {taskLedger.map((task) => {
          const date = new Date(task.timestamp * 1000).toLocaleDateString();
          const time = new Date(task.timestamp * 1000).toLocaleTimeString();
          const taskTitle = getTaskTitle(task.taskType, task.rp, t);
          const isPositive = task.rp >= 0;
          const rpAmount = `${isPositive ? "+" : ""}${task.rp}`;

          return (
            <div
              key={task.id}
              className="flex w-full items-center justify-between gap-3 rounded-2xl border border-border bg-card p-4">
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <p className="truncate font-bold text-foreground text-sm capitalize leading-[19px]">
                  {taskTitle}
                </p>
                <p className="font-medium text-muted-foreground text-xs tabular-nums leading-4">
                  {`${time} ${date}`}
                </p>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-0.5">
                <p className="font-semibold text-[11px] text-muted-foreground leading-none tracking-wider">
                  RP
                </p>
                <p
                  className={cn(
                    "font-bold text-base tabular-nums leading-[22px]",
                    isPositive ? "text-primary" : "text-red-500",
                  )}>
                  {rpAmount}
                </p>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
