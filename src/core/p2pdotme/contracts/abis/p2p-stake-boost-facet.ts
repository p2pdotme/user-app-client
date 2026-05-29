export const p2pStakeBoostFacetAbi = [
  {
    inputs: [
      {
        internalType: "address",
        name: "target",
        type: "address",
      },
    ],
    name: "AddressEmptyCode",
    type: "error",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "account",
        type: "address",
      },
    ],
    name: "AddressInsufficientBalance",
    type: "error",
  },
  {
    inputs: [],
    name: "FailedInnerCall",
    type: "error",
  },
  {
    inputs: [],
    name: "InvalidAddress",
    type: "error",
  },
  {
    inputs: [],
    name: "NoStakeToClaim",
    type: "error",
  },
  {
    inputs: [],
    name: "NotAdmin",
    type: "error",
  },
  {
    inputs: [],
    name: "NotSuperAdmin",
    type: "error",
  },
  {
    inputs: [],
    name: "P2PStakeTokenNotSet",
    type: "error",
  },
  {
    inputs: [],
    name: "ReentrancyGuard",
    type: "error",
  },
  {
    inputs: [
      {
        internalType: "uint8",
        name: "bits",
        type: "uint8",
      },
      {
        internalType: "uint256",
        name: "value",
        type: "uint256",
      },
    ],
    name: "SafeCastOverflowedUintDowncast",
    type: "error",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "token",
        type: "address",
      },
    ],
    name: "SafeERC20FailedOperation",
    type: "error",
  },
  {
    inputs: [],
    name: "StakeAlreadyActive",
    type: "error",
  },
  {
    inputs: [],
    name: "StakeAmountZero",
    type: "error",
  },
  {
    inputs: [],
    name: "StakeCooldownAlreadyExtended",
    type: "error",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "requested",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "maxTokens",
        type: "uint256",
      },
    ],
    name: "StakeExceedsMaxTokens",
    type: "error",
  },
  {
    inputs: [],
    name: "StakeNotActive",
    type: "error",
  },
  {
    inputs: [],
    name: "StakeNotInCooldown",
    type: "error",
  },
  {
    inputs: [],
    name: "StakeSeized",
    type: "error",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "availableAt",
        type: "uint256",
      },
    ],
    name: "UnstakeCooldownActive",
    type: "error",
  },
  {
    inputs: [],
    name: "UserNotBlacklistedForExtension",
    type: "error",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "user",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "newCooldownEnd",
        type: "uint256",
      },
    ],
    name: "P2PStakeCooldownExtended",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "user",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
      {
        indexed: true,
        internalType: "address",
        name: "fraudReserve",
        type: "address",
      },
    ],
    name: "P2PStakeSeized",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "user",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "newTotal",
        type: "uint256",
      },
    ],
    name: "P2PStakeToppedUp",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "user",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "newTotal",
        type: "uint256",
      },
    ],
    name: "P2PStaked",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "user",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
    ],
    name: "P2PUnstakeClaimed",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "user",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "cooldownEnd",
        type: "uint256",
      },
    ],
    name: "P2PUnstakeRequested",
    type: "event",
  },
  {
    inputs: [],
    name: "p2pBoostClaimUnstake",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "user",
        type: "address",
      },
    ],
    name: "p2pBoostExtendCooldownForBlacklist",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "user",
        type: "address",
      },
    ],
    name: "p2pBoostForceUnstake",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "p2pBoostRequestUnstake",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "tokens",
        type: "uint256",
      },
    ],
    name: "p2pBoostStake",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "tokens",
        type: "uint256",
      },
    ],
    name: "p2pBoostTopUp",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
] as const;
