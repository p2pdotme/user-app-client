import { useQuery } from "@tanstack/react-query";
import { useSettings } from "@/contexts";
import { getProcessingTime } from "@/core/adapters/thirdweb";
import { truncateAmount } from "@/lib/utils";
import { useThirdweb } from "./use-thirdweb";

export function useProcessingTimes() {
  const { account } = useThirdweb();
  const {
    settings: { currency },
  } = useSettings();

  return useQuery({
    queryKey: ["processing-times", currency.currency],
    queryFn: async () => {
      return getProcessingTime().match(
        (processingTimes) => {
          const processingTimesData = {
            buyMin: truncateAmount(Number(processingTimes.buyMin) / 60),
            buyMax: truncateAmount(Number(processingTimes.buyMax) / 60),
            sellMin: truncateAmount(Number(processingTimes.sellMin) / 60),
            sellMax: truncateAmount(Number(processingTimes.sellMax) / 60),
          };
          console.log(
            "[useProcessingTimes] Processing times data",
            processingTimesData,
          );
          return processingTimesData;
        },
        (error) => {
          console.error(
            "[useProcessingTimes] Error fetching processing times",
            error,
          );
          throw error;
        },
      );
    },
    enabled: !!account?.address,
  });
}
