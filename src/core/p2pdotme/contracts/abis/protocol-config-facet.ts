export const protocolConfigFacetAbi = [
  {
    inputs: [],
    name: "InvalidInput",
    type: "error",
  },
  {
    inputs: [],
    name: "NotSuperAdmin",
    type: "error",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "updater",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "admin",
        type: "address",
      },
      {
        indexed: false,
        internalType: "bool",
        name: "status",
        type: "bool",
      },
    ],
    name: "AdminUpdated",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "admin",
        type: "address",
      },
      {
        indexed: true,
        internalType: "bytes32",
        name: "currency",
        type: "bytes32",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "numerator",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "denominator",
        type: "uint256",
      },
    ],
    name: "CircleStakeToDelegationRatioUpdated",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "admin",
        type: "address",
      },
      {
        indexed: true,
        internalType: "bytes32",
        name: "currency",
        type: "bytes32",
      },
      {
        components: [
          {
            internalType: "uint256",
            name: "circleAdminUnstakeCooldown",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "circleStakerUnstakeCooldown",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "merchantUnstakeCooldown",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "delegatedStakeUnstakeCooldown",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "circleAdminRewardLockBps",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "circleAdminRewardLockPeriod",
            type: "uint256",
          },
        ],
        indexed: false,
        internalType:
          "struct ProtocolConfigStorage.ProtocolLockAndCooldownConfig",
        name: "currConfig",
        type: "tuple",
      },
      {
        components: [
          {
            internalType: "uint256",
            name: "circleAdminUnstakeCooldown",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "circleStakerUnstakeCooldown",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "merchantUnstakeCooldown",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "delegatedStakeUnstakeCooldown",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "circleAdminRewardLockBps",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "circleAdminRewardLockPeriod",
            type: "uint256",
          },
        ],
        indexed: false,
        internalType:
          "struct ProtocolConfigStorage.ProtocolLockAndCooldownConfig",
        name: "updatedConfig",
        type: "tuple",
      },
    ],
    name: "LockAndCooldownConfigUpdated",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "admin",
        type: "address",
      },
      {
        indexed: true,
        internalType: "bytes32",
        name: "currency",
        type: "bytes32",
      },
      {
        components: [
          {
            internalType: "uint256",
            name: "merchantRewardBps",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "circleAdminRewardBps",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "circleStakerRewardBps",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "delegatedStakeMerchantShareBps",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "delegatedStakeAdminShareBps",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "delegatedStakePoolShareBps",
            type: "uint256",
          },
        ],
        indexed: false,
        internalType: "struct ProtocolConfigStorage.RewardsConfig",
        name: "currConfig",
        type: "tuple",
      },
      {
        components: [
          {
            internalType: "uint256",
            name: "merchantRewardBps",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "circleAdminRewardBps",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "circleStakerRewardBps",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "delegatedStakeMerchantShareBps",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "delegatedStakeAdminShareBps",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "delegatedStakePoolShareBps",
            type: "uint256",
          },
        ],
        indexed: false,
        internalType: "struct ProtocolConfigStorage.RewardsConfig",
        name: "updatedConfig",
        type: "tuple",
      },
    ],
    name: "RewardsConfigUpdated",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "admin",
        type: "address",
      },
      {
        indexed: true,
        internalType: "bytes32",
        name: "currency",
        type: "bytes32",
      },
      {
        components: [
          {
            internalType: "uint256",
            name: "circleAdminSlashBps",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "circleStakerSlashBps",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "misconductSlashThreshold",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "invalidClaimSlashThreshold",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "maxMerchantFaultLossCoverage",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "maxNonMerchantFaultLossCoverage",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "maxAdminSettlementAmount",
            type: "uint256",
          },
          {
            internalType: "uint16",
            name: "disputeThreshold",
            type: "uint16",
          },
        ],
        indexed: false,
        internalType: "struct ProtocolConfigStorage.SlashConfig",
        name: "currConfig",
        type: "tuple",
      },
      {
        components: [
          {
            internalType: "uint256",
            name: "circleAdminSlashBps",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "circleStakerSlashBps",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "misconductSlashThreshold",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "invalidClaimSlashThreshold",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "maxMerchantFaultLossCoverage",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "maxNonMerchantFaultLossCoverage",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "maxAdminSettlementAmount",
            type: "uint256",
          },
          {
            internalType: "uint16",
            name: "disputeThreshold",
            type: "uint16",
          },
        ],
        indexed: false,
        internalType: "struct ProtocolConfigStorage.SlashConfig",
        name: "updatedConfig",
        type: "tuple",
      },
    ],
    name: "SlashConfigUpdated",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "admin",
        type: "address",
      },
      {
        indexed: true,
        internalType: "bytes32",
        name: "currency",
        type: "bytes32",
      },
      {
        components: [
          {
            internalType: "uint256",
            name: "minCircleAdminP2PStake",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "minMerchantUSDCStake",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "maxMerchantUSDCStake",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "maxMerchantsPerCircle",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "circleStakeToDelegationNumerator",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "circleStakeToDelegationDenominator",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "merchantSelfStakeDelegationNumerator",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "merchantSelfStakeDelegationDenominator",
            type: "uint256",
          },
        ],
        indexed: false,
        internalType: "struct ProtocolConfigStorage.StakeConfig",
        name: "currConfig",
        type: "tuple",
      },
      {
        components: [
          {
            internalType: "uint256",
            name: "minCircleAdminP2PStake",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "minMerchantUSDCStake",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "maxMerchantUSDCStake",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "maxMerchantsPerCircle",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "circleStakeToDelegationNumerator",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "circleStakeToDelegationDenominator",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "merchantSelfStakeDelegationNumerator",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "merchantSelfStakeDelegationDenominator",
            type: "uint256",
          },
        ],
        indexed: false,
        internalType: "struct ProtocolConfigStorage.StakeConfig",
        name: "updatedConfig",
        type: "tuple",
      },
    ],
    name: "StakeConfigUpdated",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "updater",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "updatedAddress",
        type: "address",
      },
      {
        indexed: false,
        internalType: "bool",
        name: "status",
        type: "bool",
      },
    ],
    name: "SuperAdminUpdated",
    type: "event",
  },
  {
    inputs: [
      {
        internalType: "bytes32",
        name: "currency",
        type: "bytes32",
      },
    ],
    name: "getProtocolConfigs",
    outputs: [
      {
        components: [
          {
            internalType: "uint256",
            name: "minCircleAdminP2PStake",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "minMerchantUSDCStake",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "maxMerchantUSDCStake",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "maxMerchantsPerCircle",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "circleStakeToDelegationNumerator",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "circleStakeToDelegationDenominator",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "merchantSelfStakeDelegationNumerator",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "merchantSelfStakeDelegationDenominator",
            type: "uint256",
          },
        ],
        internalType: "struct ProtocolConfigStorage.StakeConfig",
        name: "",
        type: "tuple",
      },
      {
        components: [
          {
            internalType: "uint256",
            name: "circleAdminUnstakeCooldown",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "circleStakerUnstakeCooldown",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "merchantUnstakeCooldown",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "delegatedStakeUnstakeCooldown",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "circleAdminRewardLockBps",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "circleAdminRewardLockPeriod",
            type: "uint256",
          },
        ],
        internalType:
          "struct ProtocolConfigStorage.ProtocolLockAndCooldownConfig",
        name: "",
        type: "tuple",
      },
      {
        components: [
          {
            internalType: "uint256",
            name: "merchantRewardBps",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "circleAdminRewardBps",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "circleStakerRewardBps",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "delegatedStakeMerchantShareBps",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "delegatedStakeAdminShareBps",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "delegatedStakePoolShareBps",
            type: "uint256",
          },
        ],
        internalType: "struct ProtocolConfigStorage.RewardsConfig",
        name: "",
        type: "tuple",
      },
      {
        components: [
          {
            internalType: "uint256",
            name: "circleAdminSlashBps",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "circleStakerSlashBps",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "misconductSlashThreshold",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "invalidClaimSlashThreshold",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "maxMerchantFaultLossCoverage",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "maxNonMerchantFaultLossCoverage",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "maxAdminSettlementAmount",
            type: "uint256",
          },
          {
            internalType: "uint16",
            name: "disputeThreshold",
            type: "uint16",
          },
        ],
        internalType: "struct ProtocolConfigStorage.SlashConfig",
        name: "",
        type: "tuple",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "bytes32",
        name: "currency",
        type: "bytes32",
      },
    ],
    name: "getProtocolLockAndCooldownConfig",
    outputs: [
      {
        components: [
          {
            internalType: "uint256",
            name: "circleAdminUnstakeCooldown",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "circleStakerUnstakeCooldown",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "merchantUnstakeCooldown",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "delegatedStakeUnstakeCooldown",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "circleAdminRewardLockBps",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "circleAdminRewardLockPeriod",
            type: "uint256",
          },
        ],
        internalType:
          "struct ProtocolConfigStorage.ProtocolLockAndCooldownConfig",
        name: "",
        type: "tuple",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "bytes32",
        name: "currency",
        type: "bytes32",
      },
    ],
    name: "getRewardsConfig",
    outputs: [
      {
        components: [
          {
            internalType: "uint256",
            name: "merchantRewardBps",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "circleAdminRewardBps",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "circleStakerRewardBps",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "delegatedStakeMerchantShareBps",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "delegatedStakeAdminShareBps",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "delegatedStakePoolShareBps",
            type: "uint256",
          },
        ],
        internalType: "struct ProtocolConfigStorage.RewardsConfig",
        name: "",
        type: "tuple",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "bytes32",
        name: "currency",
        type: "bytes32",
      },
    ],
    name: "getSlashConfig",
    outputs: [
      {
        components: [
          {
            internalType: "uint256",
            name: "circleAdminSlashBps",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "circleStakerSlashBps",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "misconductSlashThreshold",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "invalidClaimSlashThreshold",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "maxMerchantFaultLossCoverage",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "maxNonMerchantFaultLossCoverage",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "maxAdminSettlementAmount",
            type: "uint256",
          },
          {
            internalType: "uint16",
            name: "disputeThreshold",
            type: "uint16",
          },
        ],
        internalType: "struct ProtocolConfigStorage.SlashConfig",
        name: "",
        type: "tuple",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "bytes32",
        name: "currency",
        type: "bytes32",
      },
    ],
    name: "getStakeConfig",
    outputs: [
      {
        components: [
          {
            internalType: "uint256",
            name: "minCircleAdminP2PStake",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "minMerchantUSDCStake",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "maxMerchantUSDCStake",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "maxMerchantsPerCircle",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "circleStakeToDelegationNumerator",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "circleStakeToDelegationDenominator",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "merchantSelfStakeDelegationNumerator",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "merchantSelfStakeDelegationDenominator",
            type: "uint256",
          },
        ],
        internalType: "struct ProtocolConfigStorage.StakeConfig",
        name: "",
        type: "tuple",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "bytes32",
        name: "currency",
        type: "bytes32",
      },
      {
        internalType: "uint256",
        name: "numerator",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "denominator",
        type: "uint256",
      },
    ],
    name: "setCircleStakeToDelegationRatio",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "bytes32",
        name: "currency",
        type: "bytes32",
      },
      {
        components: [
          {
            internalType: "uint256",
            name: "circleAdminUnstakeCooldown",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "circleStakerUnstakeCooldown",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "merchantUnstakeCooldown",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "delegatedStakeUnstakeCooldown",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "circleAdminRewardLockBps",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "circleAdminRewardLockPeriod",
            type: "uint256",
          },
        ],
        internalType:
          "struct ProtocolConfigStorage.ProtocolLockAndCooldownConfig",
        name: "cfg",
        type: "tuple",
      },
    ],
    name: "setProtocolLockAndCooldownConfig",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "bytes32",
        name: "currency",
        type: "bytes32",
      },
      {
        components: [
          {
            internalType: "uint256",
            name: "merchantRewardBps",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "circleAdminRewardBps",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "circleStakerRewardBps",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "delegatedStakeMerchantShareBps",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "delegatedStakeAdminShareBps",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "delegatedStakePoolShareBps",
            type: "uint256",
          },
        ],
        internalType: "struct ProtocolConfigStorage.RewardsConfig",
        name: "cfg",
        type: "tuple",
      },
    ],
    name: "setRewardsConfig",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "bytes32",
        name: "currency",
        type: "bytes32",
      },
      {
        components: [
          {
            internalType: "uint256",
            name: "circleAdminSlashBps",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "circleStakerSlashBps",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "misconductSlashThreshold",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "invalidClaimSlashThreshold",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "maxMerchantFaultLossCoverage",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "maxNonMerchantFaultLossCoverage",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "maxAdminSettlementAmount",
            type: "uint256",
          },
          {
            internalType: "uint16",
            name: "disputeThreshold",
            type: "uint16",
          },
        ],
        internalType: "struct ProtocolConfigStorage.SlashConfig",
        name: "cfg",
        type: "tuple",
      },
    ],
    name: "setSlashConfig",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "bytes32",
        name: "currency",
        type: "bytes32",
      },
      {
        components: [
          {
            internalType: "uint256",
            name: "minCircleAdminP2PStake",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "minMerchantUSDCStake",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "maxMerchantUSDCStake",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "maxMerchantsPerCircle",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "circleStakeToDelegationNumerator",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "circleStakeToDelegationDenominator",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "merchantSelfStakeDelegationNumerator",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "merchantSelfStakeDelegationDenominator",
            type: "uint256",
          },
        ],
        internalType: "struct ProtocolConfigStorage.StakeConfig",
        name: "cfg",
        type: "tuple",
      },
    ],
    name: "setStakeConfig",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
] as const;
