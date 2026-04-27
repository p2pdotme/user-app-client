export const orderFlowHelperAbi = [
  {
    inputs: [
      {
        internalType: "uint256",
        name: "freeAmountUsdc",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "ongoingTxnAmount",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "orderAmount",
        type: "uint256",
      },
    ],
    name: "BuyAmountExceedsUsdcLimit",
    type: "error",
  },
  {
    inputs: [],
    name: "InvalidAmount",
    type: "error",
  },
  {
    inputs: [],
    name: "InvalidMerchant",
    type: "error",
  },
  {
    inputs: [],
    name: "InvalidOrderId",
    type: "error",
  },
  {
    inputs: [],
    name: "InvalidOrderType",
    type: "error",
  },
  {
    inputs: [],
    name: "MerchantBlacklisted",
    type: "error",
  },
  {
    inputs: [],
    name: "NoFiatLiquidity",
    type: "error",
  },
  {
    inputs: [],
    name: "NotAuthorized",
    type: "error",
  },
  {
    inputs: [],
    name: "NotSuperAdmin",
    type: "error",
  },
  {
    inputs: [],
    name: "OrderExpired",
    type: "error",
  },
  {
    inputs: [],
    name: "OrderNotAssigned",
    type: "error",
  },
  {
    inputs: [],
    name: "OrderNotPaid",
    type: "error",
  },
  {
    inputs: [],
    name: "OrderNotPlaced",
    type: "error",
  },
  {
    inputs: [],
    name: "OrderStatusInvalid",
    type: "error",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "freeFiatAmount",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "ongoingTxnAmount",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "orderAmount",
        type: "uint256",
      },
    ],
    name: "SellAmountExceedsFiatLimit",
    type: "error",
  },
  {
    inputs: [],
    name: "UsdtTransferFailed",
    type: "error",
  },
  {
    inputs: [
      {
        internalType: "string",
        name: "reason",
        type: "string",
      },
    ],
    name: "UsdtTransferFailedWithErrorMessage",
    type: "error",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "errorCode",
        type: "uint256",
      },
    ],
    name: "UsdtTransferFailedWithPanic",
    type: "error",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "uint256",
        name: "orderId",
        type: "uint256",
      },
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
        indexed: false,
        internalType: "struct OrderProcessorStorage.AdditionOrderDetails",
        name: "details",
        type: "tuple",
      },
    ],
    name: "AdditionalOrderDetails",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "uint256",
        name: "orderId",
        type: "uint256",
      },
      {
        indexed: true,
        internalType: "address",
        name: "user",
        type: "address",
      },
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
        indexed: false,
        internalType: "struct OrderProcessorStorage.Order",
        name: "_order",
        type: "tuple",
      },
    ],
    name: "BuyOrderPaid",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "uint256",
        name: "orderId",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "address",
        name: "cashbackToken",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "tokenAmount",
        type: "uint256",
      },
    ],
    name: "CashbackTransferFailed",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "uint256",
        name: "orderId",
        type: "uint256",
      },
      {
        indexed: true,
        internalType: "uint256",
        name: "circleId",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
    ],
    name: "CircleAdminRewardAdjustedForOrder",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "uint256",
        name: "orderId",
        type: "uint256",
      },
      {
        indexed: true,
        internalType: "uint256",
        name: "circleId",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
    ],
    name: "CircleAdminRewardAllocatedForOrder",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "uint256",
        name: "orderId",
        type: "uint256",
      },
      {
        indexed: true,
        internalType: "uint256",
        name: "circleId",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
    ],
    name: "CircleUSDCStakeDelegationRewardAllocatedForOrder",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "merchant",
        type: "address",
      },
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
        indexed: false,
        internalType: "struct MerchantRegistryStorage.MerchantConfig",
        name: "merchantConfig",
        type: "tuple",
      },
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
        indexed: false,
        internalType: "struct MerchantRegistryStorage.MerchantDetails",
        name: "merchantDetails",
        type: "tuple",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "accountNo",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "stake",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "freeAmountUsdc",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "freeFiatAmount",
        type: "uint256",
      },
    ],
    name: "Merchant",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "uint256",
        name: "orderId",
        type: "uint256",
      },
      {
        indexed: true,
        internalType: "address",
        name: "merchant",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
    ],
    name: "MerchantRewardAdjustedForOrder",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "uint256",
        name: "orderId",
        type: "uint256",
      },
      {
        indexed: true,
        internalType: "address",
        name: "merchant",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
    ],
    name: "MerchantRewardAllocatedForOrder",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "merchant",
        type: "address",
      },
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
        indexed: false,
        internalType: "struct MerchantRegistryStorage.MerchantConfig",
        name: "merchantConfig",
        type: "tuple",
      },
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
        indexed: false,
        internalType: "struct MerchantRegistryStorage.MerchantDetails",
        name: "merchantDetails",
        type: "tuple",
      },
    ],
    name: "OnlineOfflineToggled",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "uint256",
        name: "orderId",
        type: "uint256",
      },
      {
        indexed: true,
        internalType: "address",
        name: "merchant",
        type: "address",
      },
      {
        indexed: false,
        internalType: "string",
        name: "pubKey",
        type: "string",
      },
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
        indexed: false,
        internalType: "struct OrderProcessorStorage.Order",
        name: "_order",
        type: "tuple",
      },
    ],
    name: "OrderAccepted",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "uint256",
        name: "orderId",
        type: "uint256",
      },
      {
        indexed: true,
        internalType: "address",
        name: "user",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "completedTimestamp",
        type: "uint256",
      },
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
        indexed: false,
        internalType: "struct OrderProcessorStorage.Order",
        name: "_order",
        type: "tuple",
      },
    ],
    name: "OrderCompleted",
    type: "event",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "_orderId",
        type: "uint256",
      },
      {
        internalType: "string",
        name: "_userEncUpi",
        type: "string",
      },
      {
        internalType: "string",
        name: "_pubKey",
        type: "string",
      },
    ],
    name: "acceptOrder",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "_orderId",
        type: "uint256",
      },
      {
        internalType: "string",
        name: "merchantUpi",
        type: "string",
      },
    ],
    name: "completeOrder",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "ts",
        type: "uint256",
      },
    ],
    name: "getDayKey",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "pure",
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
        internalType: "uint256",
        name: "ts",
        type: "uint256",
      },
    ],
    name: "getYear",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "pure",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "ts",
        type: "uint256",
      },
    ],
    name: "getYearMonth",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "pure",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "_orderId",
        type: "uint256",
      },
    ],
    name: "paidBuyOrder",
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
        internalType: "uint256",
        name: "_maxBuyTxLimit",
        type: "uint256",
      },
    ],
    name: "setMaxBuyTxLimit",
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
        internalType: "uint256",
        name: "_maxSellTxLimit",
        type: "uint256",
      },
    ],
    name: "setMaxSellTxLimit",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "bytes32",
        name: "_currency",
        type: "bytes32",
      },
      {
        internalType: "uint256",
        name: "_limit",
        type: "uint256",
      },
    ],
    name: "setMonthlyBuyOrderLimitByCurrency",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "_userYearlyVolumeLimit",
        type: "uint256",
      },
      {
        internalType: "bytes32",
        name: "_currency",
        type: "bytes32",
      },
    ],
    name: "setUserYearlyVolumeLimit",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "_orderId",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "_tipAmount",
        type: "uint256",
      },
    ],
    name: "tipMerchant",
    outputs: [],
    stateMutability: "nonpayable",
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
        internalType: "bool",
        name: "reverse",
        type: "bool",
      },
    ],
    name: "updateOrderAccounting",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
] as const;
