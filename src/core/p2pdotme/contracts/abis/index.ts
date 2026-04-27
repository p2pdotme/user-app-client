import type { Address } from "thirdweb";
import { erc20Abi } from "viem";
import { circleFacetAbi } from "./circle-facet";
import { diamondAbi } from "./diamond";
import { diamondInfoAbi } from "./diamond-info";
import { orderFlowFacetAbi } from "./order-flow-facet";
import { orderFlowHelperAbi } from "./order-flow-helper";
import { orderProcessorFacetAbi } from "./order-processor-facet";
import { p2pConfigFacetAbi } from "./p2p-config-facet";
import { protocolConfigFacetAbi } from "./protocol-config-facet";
import { reputationManagerAbi } from "./reputation-manager";
import { rpHelperAbi } from "./rp-helper";
import { rPHelper1Abi } from "./rp-helper-1";

const DIAMOND_ABI = [
  ...diamondAbi,
  ...circleFacetAbi,
  ...orderFlowFacetAbi,
  ...orderProcessorFacetAbi,
  ...p2pConfigFacetAbi,
  ...rpHelperAbi,
  ...diamondInfoAbi,
  ...orderFlowHelperAbi,
  ...protocolConfigFacetAbi,
] as const;

const REPUTATION_MANAGER_ABI = [
  ...reputationManagerAbi,
  ...rpHelperAbi,
  ...rPHelper1Abi,
] as const;

export const ABIS = {
  DIAMOND: DIAMOND_ABI,
  REPUTATION_MANAGER: REPUTATION_MANAGER_ABI,
  FACETS: {
    CONFIG: p2pConfigFacetAbi,
    ORDER_FLOW: orderFlowFacetAbi,
    ORDER_PROCESSOR: orderProcessorFacetAbi,
  },
  EXTERNAL: {
    USDC: erc20Abi,
  },
} as const;

export const CONTRACT_ADDRESSES = {
  DIAMOND: import.meta.env.VITE_CONTRACT_ADDRESS_DIAMOND as Address,
  USDC: import.meta.env.VITE_CONTRACT_ADDRESS_USDC as Address,
  REPUTATION_MANAGER: import.meta.env
    .VITE_CONTRACT_ADDRESS_REPUTATION_MANAGER as Address,
} as const;
