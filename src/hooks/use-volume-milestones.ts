import { useQuery } from "@tanstack/react-query";
import { formatUnits } from "viem";
import {
  getVolumeMilestoneFour,
  getVolumeMilestoneOne,
  getVolumeMilestoneThree,
  getVolumeMilestoneTwo,
} from "@/core/adapters/thirdweb/actions/reputation-manager";

export function useVolumeMilestones() {
  const {
    data: milestones,
    isLoading: isMilestonesLoading,
    isError: isMilestonesError,
    error: milestonesError,
  } = useQuery({
    queryKey: ["volume-milestones"],
    queryFn: async () => {
      // Fetch all milestones in parallel
      const [
        milestoneOneResult,
        milestoneTwoResult,
        milestoneThreeResult,
        milestoneFourResult,
      ] = await Promise.all([
        getVolumeMilestoneOne(),
        getVolumeMilestoneTwo(),
        getVolumeMilestoneThree(),
        getVolumeMilestoneFour(),
      ]);

      // Handle errors
      if (milestoneOneResult.isErr()) {
        console.error(
          "[useVolumeMilestones] Error fetching milestone one",
          milestoneOneResult.error,
        );
        throw milestoneOneResult.error;
      }
      if (milestoneTwoResult.isErr()) {
        console.error(
          "[useVolumeMilestones] Error fetching milestone two",
          milestoneTwoResult.error,
        );
        throw milestoneTwoResult.error;
      }
      if (milestoneThreeResult.isErr()) {
        console.error(
          "[useVolumeMilestones] Error fetching milestone three",
          milestoneThreeResult.error,
        );
        throw milestoneThreeResult.error;
      }
      if (milestoneFourResult.isErr()) {
        console.error(
          "[useVolumeMilestones] Error fetching milestone four",
          milestoneFourResult.error,
        );
        throw milestoneFourResult.error;
      }

      const milestoneOne = Number(formatUnits(milestoneOneResult.value, 6));
      const milestoneTwo = Number(formatUnits(milestoneTwoResult.value, 6));
      const milestoneThree = Number(formatUnits(milestoneThreeResult.value, 6));
      const milestoneFour = Number(formatUnits(milestoneFourResult.value, 6));

      const milestonesArray = [
        milestoneOne,
        milestoneTwo,
        milestoneThree,
        milestoneFour,
      ];

      console.log(
        "[useVolumeMilestones] Volume milestones data",
        milestonesArray,
      );
      return milestonesArray;
    },
  });

  return {
    milestones: milestones || [],
    isMilestonesLoading,
    isMilestonesError,
    milestonesError,
  };
}
