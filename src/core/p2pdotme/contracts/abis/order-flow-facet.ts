export const orderFlowFacetAbi = [
  {
    inputs: [],
    name: "BuyOrderAmountExceedsLimit",
    type: "error",
  },
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
    name: "DailyBuyOrderLimitExceeded",
    type: "error",
  },
  {
    inputs: [],
    name: "InvalidInput",
    type: "error",
  },
  {
    inputs: [],
    name: "InvalidOrderAmount",
    type: "error",
  },
  {
    inputs: [],
    name: "InvalidOrderType",
    type: "error",
  },
  {
    inputs: [],
    name: "InvalidOrderUpi",
    type: "error",
  },
  {
    inputs: [],
    name: "MonthlyBuyOrderLimitExceeded",
    type: "error",
  },
  {
    inputs: [],
    name: "NotAuthorized",
    type: "error",
  },
  {
    inputs: [],
    name: "NotEnoughEligibleMerchants",
    type: "error",
  },
  {
    inputs: [],
    name: "OrderAlreadyPaid",
    type: "error",
  },
  {
    inputs: [],
    name: "OrderExpired",
    type: "error",
  },
  {
    inputs: [],
    name: "OrderStatusInvalid",
    type: "error",
  },
  {
    inputs: [],
    name: "OrderTooEarlyForReassignment",
    type: "error",
  },
  {
    inputs: [],
    name: "OrderTooLateForReassignment",
    type: "error",
  },
  {
    inputs: [],
    name: "ReAssignmentNotRequired",
    type: "error",
  },
  {
    inputs: [],
    name: "SellOrderAmountExceedsLimit",
    type: "error",
  },
  {
    inputs: [],
    name: "SellOrderAmountLimitExceeded",
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
    inputs: [],
    name: "UserHasNoReputation",
    type: "error",
  },
  {
    inputs: [],
    name: "UserIsBlacklisted",
    type: "error",
  },
  {
    inputs: [],
    name: "UserYearlyVolumeLimitExceeded",
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
    name: "CancelledOrders",
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
        internalType: "uint256",
        name: "accountNo",
        type: "uint256",
      },
    ],
    name: "MerchantAssignedNewOrder",
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
        internalType: "uint256",
        name: "accountNo",
        type: "uint256",
      },
    ],
    name: "MerchantReAssignedNewOrder",
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
        indexed: false,
        internalType: "uint256",
        name: "accountNo",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "dailyVolume",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "monthlyVolume",
        type: "uint256",
      },
    ],
    name: "MerchantVolume",
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
    ],
    name: "MerchantsReAssigned",
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
        name: "cancelledBy",
        type: "address",
      },
    ],
    name: "OrderCancelledBy",
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
      {
        indexed: false,
        internalType: "enum OrderProcessorStorage.OrderType",
        name: "orderType",
        type: "uint8",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "placedTimestamp",
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
    name: "OrderPlaced",
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
    name: "SellOrderUpiSet",
    type: "event",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "_orderId",
        type: "uint256",
      },
    ],
    name: "assignMerchants",
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
    ],
    name: "cancelOrder",
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
        internalType: "string",
        name: "_pubKey",
        type: "string",
      },
      {
        internalType: "uint256",
        name: "_amount",
        type: "uint256",
      },
      {
        internalType: "address",
        name: "_recipientAddr",
        type: "address",
      },
      {
        internalType: "enum OrderProcessorStorage.OrderType",
        name: "_orderType",
        type: "uint8",
      },
      {
        internalType: "string",
        name: "_userUpi",
        type: "string",
      },
      {
        internalType: "string",
        name: "_userPubKey",
        type: "string",
      },
      {
        internalType: "bytes32",
        name: "_currency",
        type: "bytes32",
      },
      {
        internalType: "uint256",
        name: "preferredPaymentChannelConfigId",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "_circleId",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "_fiatAmountLimit",
        type: "uint256",
      },
    ],
    name: "placeOrder",
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
        name: "_userEncUpi",
        type: "string",
      },
      {
        internalType: "uint256",
        name: "_updatedAmount",
        type: "uint256",
      },
    ],
    name: "setSellOrderUpi",
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
      {
        internalType: "bytes32",
        name: "_nativeCurrency",
        type: "bytes32",
      },
    ],
    name: "userBuyLimit",
    outputs: [
      {
        internalType: "uint256",
        name: "userTxBuyLimit",
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
        internalType: "bytes32",
        name: "_nativeCurrency",
        type: "bytes32",
      },
    ],
    name: "userSellLimit",
    outputs: [
      {
        internalType: "uint256",
        name: "userTxSellLimit",
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
        internalType: "bytes32",
        name: "_nativeCurrency",
        type: "bytes32",
      },
    ],
    name: "userTxLimit",
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
    ],
    stateMutability: "view",
    type: "function",
  },
] as const;
