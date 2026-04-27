export const orderProcessorFacetAbi = [
  {
    inputs: [],
    name: "CannotRaiseDisputeTwice",
    type: "error",
  },
  {
    inputs: [],
    name: "DisputeAlreadySettled",
    type: "error",
  },
  {
    inputs: [],
    name: "DisputeNotRaised",
    type: "error",
  },
  {
    inputs: [],
    name: "InvalidInput",
    type: "error",
  },
  {
    inputs: [],
    name: "InvalidOrderStatusToRaiseDispute",
    type: "error",
  },
  {
    inputs: [],
    name: "InvalidOrderType",
    type: "error",
  },
  {
    inputs: [],
    name: "NotAdmin",
    type: "error",
  },
  {
    inputs: [],
    name: "NotAuthorized",
    type: "error",
  },
  {
    inputs: [],
    name: "NotCircleAdmin",
    type: "error",
  },
  {
    inputs: [],
    name: "NotSuperAdmin",
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
        internalType: "address",
        name: "caller",
        type: "address",
      },
      {
        indexed: true,
        internalType: "uint256",
        name: "circleId",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "enum CircleStorage.CircleStatus",
        name: "newStatus",
        type: "uint8",
      },
    ],
    name: "CircleStatusUpdated",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "by",
        type: "address",
      },
      {
        indexed: true,
        internalType: "uint256",
        name: "orderId",
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
    name: "DisputeTransIdSet",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "by",
        type: "address",
      },
      {
        indexed: true,
        internalType: "uint256",
        name: "orderId",
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
      {
        indexed: false,
        internalType: "enum OrderProcessorStorage.FaultType",
        name: "faultType",
        type: "uint8",
      },
    ],
    name: "OrderDispute",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "reputationManager",
        type: "address",
      },
    ],
    name: "ReputationManagerSet",
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
        internalType: "enum OrderProcessorStorage.FaultType",
        name: "faultType",
        type: "uint8",
      },
    ],
    name: "adminSettleDispute",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256[]",
        name: "orderIds",
        type: "uint256[]",
      },
    ],
    name: "autoCancelExpiredOrders",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
    ],
    name: "failSafe",
    outputs: [],
    stateMutability: "nonpayable",
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
    inputs: [
      {
        internalType: "bytes32",
        name: "_nativeCurrency",
        type: "bytes32",
      },
    ],
    name: "getExchangeLiquidityBalance",
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
    name: "getSmallOrderFixedFee",
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
        internalType: "uint256",
        name: "_orderId",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "redactTransId",
        type: "uint256",
      },
    ],
    name: "raiseDispute",
    outputs: [],
    stateMutability: "nonpayable",
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
        name: "amount",
        type: "uint256",
      },
    ],
    name: "reduceExchangeFiatBalance",
    outputs: [],
    stateMutability: "nonpayable",
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
        name: "amount",
        type: "uint256",
      },
    ],
    name: "releaseMerchantFunds",
    outputs: [],
    stateMutability: "nonpayable",
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
    name: "resetDisputeCounterForCircle",
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
        name: "count",
        type: "uint256",
      },
    ],
    name: "setAssignMerchantsCount",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint16",
        name: "threshold",
        type: "uint16",
      },
    ],
    name: "setAssignedOrdersThreshold",
    outputs: [],
    stateMutability: "nonpayable",
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
        internalType: "enum CircleStorage.CircleStatus",
        name: "status",
        type: "uint8",
      },
    ],
    name: "setCircleStatus",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "percentage",
        type: "uint256",
      },
    ],
    name: "setMaxFiatThresholdPercentage",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "addr",
        type: "address",
      },
    ],
    name: "setReputationManager",
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
        internalType: "uint64",
        name: "fee",
        type: "uint64",
      },
    ],
    name: "setSmallOrderFixedFee",
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
        name: "threshold",
        type: "uint256",
      },
    ],
    name: "setSmallOrderThreshold",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
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
      {
        internalType: "bytes32",
        name: "_nativeCurrency",
        type: "bytes32",
      },
    ],
    name: "updateRpPerUsdtLimitRational",
    outputs: [],
    stateMutability: "nonpayable",
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
