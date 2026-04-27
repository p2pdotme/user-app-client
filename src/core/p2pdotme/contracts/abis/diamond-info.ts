export const diamondInfoAbi = [
  {
    inputs: [],
    name: "NotSuperAdmin",
    type: "error",
  },
  {
    inputs: [],
    name: "contractVersion",
    outputs: [
      {
        internalType: "bytes32",
        name: "",
        type: "bytes32",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "bytes32",
        name: "_version",
        type: "bytes32",
      },
    ],
    name: "setContractVersion",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
] as const;
