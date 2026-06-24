export const getterFacetAbi = [
  {
    inputs: [],
    name: "CircleNotActive",
    type: "error",
  },
  {
    inputs: [],
    name: "CurrencyNotSupported",
    type: "error",
  },
  {
    inputs: [],
    name: "ThresholdNotConfigured",
    type: "error",
  },
  {
    inputs: [
      {
        internalType: "bytes32",
        name: "_currency",
        type: "bytes32",
      },
      {
        internalType: "address",
        name: "_merchant",
        type: "address",
      },
      {
        internalType: "address",
        name: "_user",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "_usdtAmount",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "_fiatAmount",
        type: "uint256",
      },
      {
        internalType: "int256",
        name: "_orderType",
        type: "int256",
      },
      {
        internalType: "uint256",
        name: "_preferredPCConfigId",
        type: "uint256",
      },
    ],
    name: "checkAssignable",
    outputs: [
      {
        internalType: "enum OrderProcessorStorage.Assignment",
        name: "",
        type: "uint8",
      },
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "currentPaymentChannelCount",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "_merchant",
        type: "address",
      },
    ],
    name: "fetchMerchantAcceptedOrders",
    outputs: [
      {
        components: [
          {
            internalType: "uint256",
            name: "amount",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "fiatAmount",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "placedTimestamp",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "completedTimestamp",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "userCompletedTimestamp",
            type: "uint256",
          },
          {
            internalType: "address",
            name: "acceptedMerchant",
            type: "address",
          },
          {
            internalType: "address",
            name: "user",
            type: "address",
          },
          {
            internalType: "address",
            name: "recipientAddr",
            type: "address",
          },
          {
            internalType: "string",
            name: "pubkey",
            type: "string",
          },
          {
            internalType: "string",
            name: "encUpi",
            type: "string",
          },
          {
            internalType: "bool",
            name: "userCompleted",
            type: "bool",
          },
          {
            internalType: "enum OrderProcessorStorage.OrderStatus",
            name: "status",
            type: "uint8",
          },
          {
            internalType: "enum OrderProcessorStorage.OrderType",
            name: "orderType",
            type: "uint8",
          },
          {
            components: [
              {
                internalType: "enum OrderProcessorStorage.Entity",
                name: "raisedBy",
                type: "uint8",
              },
              {
                internalType: "enum OrderProcessorStorage.DisputeStatus",
                name: "status",
                type: "uint8",
              },
              {
                internalType: "uint256",
                name: "redactTransId",
                type: "uint256",
              },
              {
                internalType: "uint256",
                name: "accountNumber",
                type: "uint256",
              },
            ],
            internalType: "struct OrderProcessorStorage.Dispute",
            name: "disputeInfo",
            type: "tuple",
          },
          {
            internalType: "uint256",
            name: "id",
            type: "uint256",
          },
          {
            internalType: "string",
            name: "userPubKey",
            type: "string",
          },
          {
            internalType: "string",
            name: "encMerchantUpi",
            type: "string",
          },
          {
            internalType: "uint256",
            name: "acceptedAccountNo",
            type: "uint256",
          },
          {
            internalType: "uint256[]",
            name: "assignedAccountNos",
            type: "uint256[]",
          },
          {
            internalType: "bytes32",
            name: "currency",
            type: "bytes32",
          },
          {
            internalType: "uint256",
            name: "preferredPaymentChannelConfigId",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "circleId",
            type: "uint256",
          },
        ],
        internalType: "struct OrderProcessorStorage.Order[]",
        name: "",
        type: "tuple[]",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "_merchant",
        type: "address",
      },
    ],
    name: "fetchMerchantAssignedOrders",
    outputs: [
      {
        components: [
          {
            internalType: "uint256",
            name: "amount",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "fiatAmount",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "placedTimestamp",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "completedTimestamp",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "userCompletedTimestamp",
            type: "uint256",
          },
          {
            internalType: "address",
            name: "acceptedMerchant",
            type: "address",
          },
          {
            internalType: "address",
            name: "user",
            type: "address",
          },
          {
            internalType: "address",
            name: "recipientAddr",
            type: "address",
          },
          {
            internalType: "string",
            name: "pubkey",
            type: "string",
          },
          {
            internalType: "string",
            name: "encUpi",
            type: "string",
          },
          {
            internalType: "bool",
            name: "userCompleted",
            type: "bool",
          },
          {
            internalType: "enum OrderProcessorStorage.OrderStatus",
            name: "status",
            type: "uint8",
          },
          {
            internalType: "enum OrderProcessorStorage.OrderType",
            name: "orderType",
            type: "uint8",
          },
          {
            components: [
              {
                internalType: "enum OrderProcessorStorage.Entity",
                name: "raisedBy",
                type: "uint8",
              },
              {
                internalType: "enum OrderProcessorStorage.DisputeStatus",
                name: "status",
                type: "uint8",
              },
              {
                internalType: "uint256",
                name: "redactTransId",
                type: "uint256",
              },
              {
                internalType: "uint256",
                name: "accountNumber",
                type: "uint256",
              },
            ],
            internalType: "struct OrderProcessorStorage.Dispute",
            name: "disputeInfo",
            type: "tuple",
          },
          {
            internalType: "uint256",
            name: "id",
            type: "uint256",
          },
          {
            internalType: "string",
            name: "userPubKey",
            type: "string",
          },
          {
            internalType: "string",
            name: "encMerchantUpi",
            type: "string",
          },
          {
            internalType: "uint256",
            name: "acceptedAccountNo",
            type: "uint256",
          },
          {
            internalType: "uint256[]",
            name: "assignedAccountNos",
            type: "uint256[]",
          },
          {
            internalType: "bytes32",
            name: "currency",
            type: "bytes32",
          },
          {
            internalType: "uint256",
            name: "preferredPaymentChannelConfigId",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "circleId",
            type: "uint256",
          },
        ],
        internalType: "struct OrderProcessorStorage.Order[]",
        name: "",
        type: "tuple[]",
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
    name: "getActiveLiquidity",
    outputs: [
      {
        components: [
          {
            internalType: "uint128",
            name: "onlineStakeByCurrency",
            type: "uint128",
          },
          {
            internalType: "uint128",
            name: "onlineFiatBalanceByCurrency",
            type: "uint128",
          },
        ],
        internalType: "struct MerchantRegistryStorage.Liquidity",
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
        internalType: "uint256",
        name: "orderId",
        type: "uint256",
      },
    ],
    name: "getAdditionalOrderDetails",
    outputs: [
      {
        components: [
          {
            internalType: "uint64",
            name: "fixedFeePaid",
            type: "uint64",
          },
          {
            internalType: "uint64",
            name: "tipsPaid",
            type: "uint64",
          },
          {
            internalType: "uint128",
            name: "acceptedTimestamp",
            type: "uint128",
          },
          {
            internalType: "uint128",
            name: "paidTimestamp",
            type: "uint128",
          },
          {
            internalType: "uint128",
            name: "reserved2",
            type: "uint128",
          },
          {
            internalType: "uint256",
            name: "actualUsdtAmount",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "actualFiatAmount",
            type: "uint256",
          },
        ],
        internalType: "struct OrderProcessorStorage.AdditionOrderDetails",
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
    name: "getAssignMerchantsCount",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "circleId",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "assignUpto",
        type: "uint256",
      },
      {
        internalType: "bytes32",
        name: "currency",
        type: "bytes32",
      },
      {
        internalType: "address",
        name: "user",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "usdtAmount",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "fiatAmount",
        type: "uint256",
      },
      {
        internalType: "int256",
        name: "orderType",
        type: "int256",
      },
      {
        internalType: "uint256",
        name: "preferredPCConfigId",
        type: "uint256",
      },
    ],
    name: "getAssignableMerchantsFromCircle",
    outputs: [
      {
        internalType: "address[]",
        name: "",
        type: "address[]",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getAssignedOrdersThreshold",
    outputs: [
      {
        internalType: "uint16",
        name: "",
        type: "uint16",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "merchant",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "accountNo",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "timestamp",
        type: "uint256",
      },
    ],
    name: "getCalendarDailyVolume",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "merchant",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "accountNo",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "year",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "month",
        type: "uint256",
      },
    ],
    name: "getCalendarMonthlyVolume",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getCashbackConfig",
    outputs: [
      {
        components: [
          {
            internalType: "address",
            name: "cashbackToken",
            type: "address",
          },
          {
            internalType: "address",
            name: "quoterAddress",
            type: "address",
          },
          {
            internalType: "uint24",
            name: "quoterFee",
            type: "uint24",
          },
          {
            internalType: "uint24",
            name: "cashbackPercentage",
            type: "uint24",
          },
        ],
        internalType: "struct P2pConfigStorage.CashbackConfig",
        name: "",
        type: "tuple",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getCashbackPercentage",
    outputs: [
      {
        internalType: "uint24",
        name: "",
        type: "uint24",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getChainlinkForwarderAddress",
    outputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "circleId",
        type: "uint256",
      },
    ],
    name: "getCircleHeadMerchant",
    outputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "circleId",
        type: "uint256",
      },
    ],
    name: "getCircleMerchantListLength",
    outputs: [
      {
        internalType: "uint256",
        name: "count",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "circleId",
        type: "uint256",
      },
      {
        internalType: "address",
        name: "merchant",
        type: "address",
      },
    ],
    name: "getCircleNextMerchant",
    outputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "circleId",
        type: "uint256",
      },
    ],
    name: "getCircleTailMerchant",
    outputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "bytes32",
        name: "requestId",
        type: "bytes32",
      },
    ],
    name: "getCurrencyFromRequestId",
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
    inputs: [],
    name: "getCurrentPaymentChannelId",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "_merchant",
        type: "address",
      },
    ],
    name: "getDisputedMerchant",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "circleId",
        type: "uint256",
      },
    ],
    name: "getEligibleMerchantsByCircleId",
    outputs: [
      {
        internalType: "address[]",
        name: "",
        type: "address[]",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "bytes32",
        name: "_nativeCurrency",
        type: "bytes32",
      },
    ],
    name: "getExchangeFiatBalance",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getExchangeStatus",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getExpectedWorkflowOwner",
    outputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "merchant",
        type: "address",
      },
    ],
    name: "getFcmTokens",
    outputs: [
      {
        internalType: "string[]",
        name: "",
        type: "string[]",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getFunctionsRouter",
    outputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "bytes32",
        name: "_currency",
        type: "bytes32",
      },
    ],
    name: "getMarketPrice",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
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
    name: "getMaxBuyTxLimit",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
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
    name: "getMaxFiatThresholdPercentage",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
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
    name: "getMaxSellTxLimit",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "merchant",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "accountNo",
        type: "uint256",
      },
    ],
    name: "getMerchantAccountMonthlyVolumeUnlimitedFlag",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "_merchant",
        type: "address",
      },
    ],
    name: "getMerchantConfig",
    outputs: [
      {
        components: [
          {
            internalType: "string",
            name: "telegramId",
            type: "string",
          },
          {
            internalType: "enum MerchantRegistryStorage.RiskCategory",
            name: "riskCategory",
            type: "uint8",
          },
          {
            components: [
              {
                internalType: "uint256",
                name: "paymentChannelConfigId",
                type: "uint256",
              },
              {
                internalType: "uint256",
                name: "accountNo",
                type: "uint256",
              },
              {
                internalType: "string",
                name: "label",
                type: "string",
              },
              {
                internalType: "enum MerchantRegistryStorage.Status",
                name: "status",
                type: "uint8",
              },
              {
                internalType: "bool",
                name: "isActive",
                type: "bool",
              },
              {
                internalType: "uint256",
                name: "lastUsedDailyVolumeTimestamp",
                type: "uint256",
              },
              {
                internalType: "uint256",
                name: "lastUsedMonthlyVolumeTimestamp",
                type: "uint256",
              },
            ],
            internalType:
              "struct MerchantRegistryStorage.PaymentChannelDetails[]",
            name: "paymentChannels",
            type: "tuple[]",
          },
        ],
        internalType: "struct MerchantRegistryStorage.MerchantConfig",
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
        internalType: "address",
        name: "_merchant",
        type: "address",
      },
    ],
    name: "getMerchantDetails",
    outputs: [
      {
        components: [
          {
            internalType: "uint256",
            name: "stake",
            type: "uint256",
          },
          {
            internalType: "bool",
            name: "isOnline",
            type: "bool",
          },
          {
            internalType: "uint256",
            name: "totalVolume",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "withdrawnAmount",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "lastVolumeResetTimestamp",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "accruedFees",
            type: "uint256",
          },
          {
            internalType: "bool",
            name: "isRegistered",
            type: "bool",
          },
          {
            internalType: "bytes32",
            name: "currency",
            type: "bytes32",
          },
          {
            internalType: "uint256",
            name: "freeAmountUsdc",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "circleId",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "delegatedStake",
            type: "uint256",
          },
        ],
        internalType: "struct MerchantRegistryStorage.MerchantDetails",
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
    name: "getMerchantFeePer",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "merchant",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "yearMonthKey",
        type: "uint256",
      },
    ],
    name: "getMerchantMonthlyVolumeInfo",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "_merchant",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "_accountNo",
        type: "uint256",
      },
    ],
    name: "getMerchantPCFreeAmount",
    outputs: [
      {
        internalType: "uint256",
        name: "freeAmountFiat",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "merchant",
        type: "address",
      },
    ],
    name: "getMerchantPaymentChannels",
    outputs: [
      {
        components: [
          {
            internalType: "uint256",
            name: "paymentChannelConfigId",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "accountNo",
            type: "uint256",
          },
          {
            internalType: "string",
            name: "label",
            type: "string",
          },
          {
            internalType: "enum MerchantRegistryStorage.Status",
            name: "status",
            type: "uint8",
          },
          {
            internalType: "bool",
            name: "isActive",
            type: "bool",
          },
          {
            internalType: "uint256",
            name: "lastUsedDailyVolumeTimestamp",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "lastUsedMonthlyVolumeTimestamp",
            type: "uint256",
          },
        ],
        internalType: "struct MerchantRegistryStorage.PaymentChannelDetails[]",
        name: "",
        type: "tuple[]",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "merchantAddress",
        type: "address",
      },
    ],
    name: "getMerchantRiskCategory",
    outputs: [
      {
        internalType: "enum MerchantRegistryStorage.RiskCategory",
        name: "",
        type: "uint8",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "merchant",
        type: "address",
      },
    ],
    name: "getMerchantStake",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "merchant",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "accountNo",
        type: "uint256",
      },
    ],
    name: "getMerchantVolume",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "merchant",
        type: "address",
      },
    ],
    name: "getMigrationRequest",
    outputs: [
      {
        components: [
          {
            internalType: "uint256",
            name: "fromAccountNo",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "toAccountNo",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "fromPaymentChannelIndex",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "toPaymentChannelIndex",
            type: "uint256",
          },
          {
            internalType: "enum MerchantRegistryStorage.MigrationStatus",
            name: "status",
            type: "uint8",
          },
        ],
        internalType: "struct MerchantRegistryStorage.MigrationRequest",
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
    name: "getMinStake",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
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
    name: "getMonthlyBuyOrderLimitByCurrency",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
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
    name: "getMonthlyVolumeLimit",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getNextOrderId",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "merchant",
        type: "address",
      },
    ],
    name: "getOngoingTxnAmount",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "merchant",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "accountNo",
        type: "uint256",
      },
    ],
    name: "getOngoingTxnFiatAmountByMerchantPC",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "orderId",
        type: "uint256",
      },
      {
        internalType: "address",
        name: "merchant",
        type: "address",
      },
    ],
    name: "getOrderAssignedMerchants",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "orderId",
        type: "uint256",
      },
    ],
    name: "getOrderCashback",
    outputs: [
      {
        components: [
          {
            internalType: "uint128",
            name: "amount",
            type: "uint128",
          },
          {
            internalType: "address",
            name: "token",
            type: "address",
          },
        ],
        internalType: "struct OrderProcessorStorage.CashbackInfo",
        name: "",
        type: "tuple",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getOrderExpiry",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "orderId",
        type: "uint256",
      },
    ],
    name: "getOrderExpiresAt",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "orderId",
        type: "uint256",
      },
    ],
    name: "getOrderFixedFeePaid",
    outputs: [
      {
        internalType: "uint64",
        name: "",
        type: "uint64",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "orderId",
        type: "uint256",
      },
    ],
    name: "getOrdersById",
    outputs: [
      {
        components: [
          {
            internalType: "uint256",
            name: "amount",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "fiatAmount",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "placedTimestamp",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "completedTimestamp",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "userCompletedTimestamp",
            type: "uint256",
          },
          {
            internalType: "address",
            name: "acceptedMerchant",
            type: "address",
          },
          {
            internalType: "address",
            name: "user",
            type: "address",
          },
          {
            internalType: "address",
            name: "recipientAddr",
            type: "address",
          },
          {
            internalType: "string",
            name: "pubkey",
            type: "string",
          },
          {
            internalType: "string",
            name: "encUpi",
            type: "string",
          },
          {
            internalType: "bool",
            name: "userCompleted",
            type: "bool",
          },
          {
            internalType: "enum OrderProcessorStorage.OrderStatus",
            name: "status",
            type: "uint8",
          },
          {
            internalType: "enum OrderProcessorStorage.OrderType",
            name: "orderType",
            type: "uint8",
          },
          {
            components: [
              {
                internalType: "enum OrderProcessorStorage.Entity",
                name: "raisedBy",
                type: "uint8",
              },
              {
                internalType: "enum OrderProcessorStorage.DisputeStatus",
                name: "status",
                type: "uint8",
              },
              {
                internalType: "uint256",
                name: "redactTransId",
                type: "uint256",
              },
              {
                internalType: "uint256",
                name: "accountNumber",
                type: "uint256",
              },
            ],
            internalType: "struct OrderProcessorStorage.Dispute",
            name: "disputeInfo",
            type: "tuple",
          },
          {
            internalType: "uint256",
            name: "id",
            type: "uint256",
          },
          {
            internalType: "string",
            name: "userPubKey",
            type: "string",
          },
          {
            internalType: "string",
            name: "encMerchantUpi",
            type: "string",
          },
          {
            internalType: "uint256",
            name: "acceptedAccountNo",
            type: "uint256",
          },
          {
            internalType: "uint256[]",
            name: "assignedAccountNos",
            type: "uint256[]",
          },
          {
            internalType: "bytes32",
            name: "currency",
            type: "bytes32",
          },
          {
            internalType: "uint256",
            name: "preferredPaymentChannelConfigId",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "circleId",
            type: "uint256",
          },
        ],
        internalType: "struct OrderProcessorStorage.Order",
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
        internalType: "uint256",
        name: "id",
        type: "uint256",
      },
    ],
    name: "getPaymentChannelConfig",
    outputs: [
      {
        components: [
          {
            internalType: "uint256",
            name: "paymentChannelId",
            type: "uint256",
          },
          {
            internalType: "string",
            name: "name",
            type: "string",
          },
          {
            internalType: "uint256",
            name: "dailyVolumeLimit",
            type: "uint256",
          },
          {
            internalType: "bytes32",
            name: "currency",
            type: "bytes32",
          },
          {
            internalType: "bool",
            name: "isActive",
            type: "bool",
          },
        ],
        internalType: "struct CountryStorage.PaymentChannelConfig",
        name: "",
        type: "tuple",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getPaymentChannelConfigs",
    outputs: [
      {
        components: [
          {
            internalType: "uint256",
            name: "paymentChannelId",
            type: "uint256",
          },
          {
            internalType: "string",
            name: "name",
            type: "string",
          },
          {
            internalType: "uint256",
            name: "dailyVolumeLimit",
            type: "uint256",
          },
          {
            internalType: "bytes32",
            name: "currency",
            type: "bytes32",
          },
          {
            internalType: "bool",
            name: "isActive",
            type: "bool",
          },
        ],
        internalType: "struct CountryStorage.PaymentChannelConfig[]",
        name: "configs",
        type: "tuple[]",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "merchant",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "accountId",
        type: "uint256",
      },
    ],
    name: "getPaymentChannelFreeFiatAmount",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "merchant",
        type: "address",
      },
    ],
    name: "getPendingAssignStreak",
    outputs: [
      {
        internalType: "uint16",
        name: "",
        type: "uint16",
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
    name: "getPriceBumpPercentage",
    outputs: [
      {
        internalType: "int256",
        name: "",
        type: "int256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "bytes32",
        name: "_currency",
        type: "bytes32",
      },
    ],
    name: "getPriceConfig",
    outputs: [
      {
        components: [
          {
            internalType: "uint256",
            name: "buyPrice",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "sellPrice",
            type: "uint256",
          },
          {
            internalType: "int256",
            name: "buyPriceOffset",
            type: "int256",
          },
          {
            internalType: "uint256",
            name: "baseSpread",
            type: "uint256",
          },
        ],
        internalType: "struct P2pConfigStorage.PriceConfig",
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
        name: "_currency",
        type: "bytes32",
      },
    ],
    name: "getPriceUpdater",
    outputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getProcessingTime",
    outputs: [
      {
        components: [
          {
            internalType: "uint256",
            name: "buyMin",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "buyMax",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "sellMin",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "sellMax",
            type: "uint256",
          },
        ],
        internalType: "struct P2pConfigStorage.ProcessingTimeSecs",
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
        name: "_nativeCurrency",
        type: "bytes32",
      },
    ],
    name: "getRpPerUsdtLimitRational",
    outputs: [
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
    name: "getSmallOrderFixedFeeBuy",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
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
    name: "getSmallOrderFixedFeePay",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
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
    name: "getSmallOrderFixedFeeSell",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
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
    name: "getSmallOrderThreshold",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
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
    name: "getSourceCodeFromCurrency",
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
        name: "currency",
        type: "bytes32",
      },
    ],
    name: "getTotalStake",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "_merchant",
        type: "address",
      },
    ],
    name: "getUnstakeRequested",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "view",
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
    name: "getUser",
    outputs: [
      {
        components: [
          {
            internalType: "uint256",
            name: "numOrdersPlaced",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "numOrdersCompleted",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "usdtVolume",
            type: "uint256",
          },
          {
            components: [
              {
                internalType: "uint256",
                name: "orderId",
                type: "uint256",
              },
              {
                internalType: "uint256",
                name: "accountNo",
                type: "uint256",
              },
            ],
            internalType: "struct OrderProcessorStorage.OrderInfo[]",
            name: "orderInfos",
            type: "tuple[]",
          },
        ],
        internalType: "struct OrderProcessorStorage.User",
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
        internalType: "address",
        name: "userAddress",
        type: "address",
      },
    ],
    name: "getUserTotalVolume",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "_user",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "_year",
        type: "uint256",
      },
    ],
    name: "getUserYearlyVolume",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "bytes32",
        name: "_currency",
        type: "bytes32",
      },
    ],
    name: "getUserYearlyVolumeLimit",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "_merchant",
        type: "address",
      },
    ],
    name: "hasOngoingOrder",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "merchant",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "fiatAmount",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "accountNo",
        type: "uint256",
      },
    ],
    name: "hasSufficientFiatCapacity",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "_admin",
        type: "address",
      },
    ],
    name: "isAdmin",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "_merchant",
        type: "address",
      },
    ],
    name: "isBlacklisted",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
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
    name: "isCurrencySupported",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "orderId",
        type: "uint256",
      },
    ],
    name: "isOrderExpired",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "_admin",
        type: "address",
      },
    ],
    name: "isSuperAdmin",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "_user",
        type: "address",
      },
    ],
    name: "userOrdersArr",
    outputs: [
      {
        components: [
          {
            internalType: "uint256",
            name: "amount",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "fiatAmount",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "placedTimestamp",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "completedTimestamp",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "userCompletedTimestamp",
            type: "uint256",
          },
          {
            internalType: "address",
            name: "acceptedMerchant",
            type: "address",
          },
          {
            internalType: "address",
            name: "user",
            type: "address",
          },
          {
            internalType: "address",
            name: "recipientAddr",
            type: "address",
          },
          {
            internalType: "string",
            name: "pubkey",
            type: "string",
          },
          {
            internalType: "string",
            name: "encUpi",
            type: "string",
          },
          {
            internalType: "bool",
            name: "userCompleted",
            type: "bool",
          },
          {
            internalType: "enum OrderProcessorStorage.OrderStatus",
            name: "status",
            type: "uint8",
          },
          {
            internalType: "enum OrderProcessorStorage.OrderType",
            name: "orderType",
            type: "uint8",
          },
          {
            components: [
              {
                internalType: "enum OrderProcessorStorage.Entity",
                name: "raisedBy",
                type: "uint8",
              },
              {
                internalType: "enum OrderProcessorStorage.DisputeStatus",
                name: "status",
                type: "uint8",
              },
              {
                internalType: "uint256",
                name: "redactTransId",
                type: "uint256",
              },
              {
                internalType: "uint256",
                name: "accountNumber",
                type: "uint256",
              },
            ],
            internalType: "struct OrderProcessorStorage.Dispute",
            name: "disputeInfo",
            type: "tuple",
          },
          {
            internalType: "uint256",
            name: "id",
            type: "uint256",
          },
          {
            internalType: "string",
            name: "userPubKey",
            type: "string",
          },
          {
            internalType: "string",
            name: "encMerchantUpi",
            type: "string",
          },
          {
            internalType: "uint256",
            name: "acceptedAccountNo",
            type: "uint256",
          },
          {
            internalType: "uint256[]",
            name: "assignedAccountNos",
            type: "uint256[]",
          },
          {
            internalType: "bytes32",
            name: "currency",
            type: "bytes32",
          },
          {
            internalType: "uint256",
            name: "preferredPaymentChannelConfigId",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "circleId",
            type: "uint256",
          },
        ],
        internalType: "struct OrderProcessorStorage.Order[]",
        name: "",
        type: "tuple[]",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
] as const;
