import { useQuery } from "@tanstack/react-query";
import type { Address } from "thirdweb";
import { formatUnits } from "viem";
import { getUserTaskLedger } from "@/core/adapters/thirdweb/actions/reputation-manager";
import type { Task } from "@/core/p2pdotme/shared/validation";
import { ZodTaskSchema } from "@/core/p2pdotme/shared/validation";
import { useThirdweb } from "./use-thirdweb";

export function useTaskLedger() {
  const { account } = useThirdweb();

  const {
    data: taskLedger,
    isLoading: isTaskLedgerLoading,
    isError: isTaskLedgerError,
    error: taskLedgerError,
  } = useQuery({
    queryKey: ["task-ledger", account?.address],
    queryFn: async () => {
      if (!account?.address) {
        throw new Error("No account connected");
      }

      return getUserTaskLedger({
        userAddr: account.address as Address,
      }).match(
        (rawTasks) => {
          // Validate and transform the raw task data
          const validatedTasks: Task[] = [];

          for (const rawTask of rawTasks) {
            const validationResult = ZodTaskSchema.safeParse(rawTask);
            if (validationResult.success) {
              validatedTasks.push(validationResult.data);
            } else {
              console.warn(
                "Invalid task data:",
                rawTask,
                validationResult.error,
              );
            }
          }

          // Sort tasks by timestamp (newest first)
          const sortedTasks = validatedTasks.sort(
            (a, b) => Number(b.timestamp) - Number(a.timestamp),
          );

          // Transform tasks for display
          const transformedTasks = sortedTasks.map((task, index) => ({
            id: index,
            taskType: task.taskType,
            rp: Number(formatUnits(task.rp, 0)), // Assuming RP has 0 decimals
            timestamp: Number(task.timestamp),
          }));

          console.log("[useTaskLedger] Task ledger data", transformedTasks);
          return transformedTasks;
        },
        (error) => {
          console.error("[useTaskLedger] Error fetching task ledger", error);
          throw error;
        },
      );
    },
    enabled: !!account?.address,
  });

  return {
    taskLedger: taskLedger || [],
    isTaskLedgerLoading,
    isTaskLedgerError,
    taskLedgerError,
  };
}
