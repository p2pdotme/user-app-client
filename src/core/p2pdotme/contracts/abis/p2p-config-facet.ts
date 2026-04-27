export const p2pConfigFacetAbi = [
  {
    inputs: [],
    name: "ArrayLengthMismatch",
    type: "error",
  },
  {
    inputs: [],
    name: "CurrencyNotSupported",
    type: "error",
  },
  {
    inputs: [],
    name: "EmptySource",
    type: "error",
  },
  {
    inputs: [],
    name: "InvalidAddress",
    type: "error",
  },
  {
    inputs: [],
    name: "InvalidComputedPrices",
    type: "error",
  },
  {
    inputs: [],
    name: "InvalidInput",
    type: "error",
  },
  {
    inputs: [],
    name: "NoInlineSecrets",
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
    inputs: [
      {
        internalType: "bytes32",
        name: "currency",
        type: "bytes32",
      },
      {
        internalType: "address",
        name: "expectedUpdater",
        type: "address",
      },
      {
        internalType: "address",
        name: "actualUpdater",
        type: "address",
      },
    ],
    name: "NotPriceUpdaterForCurrency",
    type: "error",
  },
  {
    inputs: [],
    name: "NotSuperAdmin",
    type: "error",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "expectedRouter",
        type: "address",
      },
      {
        internalType: "address",
        name: "actualRouter",
        type: "address",
      },
    ],
    name: "OnlyRouterCanFulfill",
    type: "error",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "x",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "y",
        type: "uint256",
      },
    ],
    name: "PRBMath_MulDiv18_Overflow",
    type: "error",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "x",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "y",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "denominator",
        type: "uint256",
      },
    ],
    name: "PRBMath_MulDiv_Overflow",
    type: "error",
  },
  {
    inputs: [],
    name: "PRBMath_SD59x18_Div_InputTooSmall",
    type: "error",
  },
  {
    inputs: [
      {
        internalType: "SD59x18",
        name: "x",
        type: "int256",
      },
      {
        internalType: "SD59x18",
        name: "y",
        type: "int256",
      },
    ],
    name: "PRBMath_SD59x18_Div_Overflow",
    type: "error",
  },
  {
    inputs: [
      {
        internalType: "SD59x18",
        name: "x",
        type: "int256",
      },
    ],
    name: "PRBMath_SD59x18_Exp2_InputTooBig",
    type: "error",
  },
  {
    inputs: [
      {
        internalType: "SD59x18",
        name: "x",
        type: "int256",
      },
    ],
    name: "PRBMath_SD59x18_Exp_InputTooBig",
    type: "error",
  },
  {
    inputs: [],
    name: "PRBMath_SD59x18_Mul_InputTooSmall",
    type: "error",
  },
  {
    inputs: [
      {
        internalType: "SD59x18",
        name: "x",
        type: "int256",
      },
      {
        internalType: "SD59x18",
        name: "y",
        type: "int256",
      },
    ],
    name: "PRBMath_SD59x18_Mul_Overflow",
    type: "error",
  },
  {
    inputs: [
      {
        internalType: "bytes32",
        name: "requestId",
        type: "bytes32",
      },
      {
        internalType: "bytes",
        name: "errorMessage",
        type: "bytes",
      },
    ],
    name: "RequestFailed",
    type: "error",
  },
  {
    inputs: [
      {
        internalType: "bytes32",
        name: "expectedSourceCode",
        type: "bytes32",
      },
      {
        internalType: "bytes32",
        name: "actualSourceCode",
        type: "bytes32",
      },
    ],
    name: "SourceCodeMismatch",
    type: "error",
  },
  {
    inputs: [
      {
        internalType: "bytes32",
        name: "",
        type: "bytes32",
      },
    ],
    name: "UnexpectedRequestId",
    type: "error",
  },
  {
    inputs: [],
    name: "ZeroMarketPrice",
    type: "error",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "address",
        name: "admin",
        type: "address",
      },
      {
        indexed: false,
        internalType: "bytes32",
        name: "currency",
        type: "bytes32",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "currExchangeINRPrice",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "updatedExchangeINRPrice",
        type: "uint256",
      },
    ],
    name: "BuyPriceUpdated",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "address",
        name: "admin",
        type: "address",
      },
      {
        indexed: false,
        internalType: "bytes32",
        name: "currency",
        type: "bytes32",
      },
      {
        indexed: false,
        internalType: "int256",
        name: "oldPercentage",
        type: "int256",
      },
      {
        indexed: false,
        internalType: "int256",
        name: "newPercentage",
        type: "int256",
      },
    ],
    name: "PriceBumpPercentageUpdated",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "address",
        name: "admin",
        type: "address",
      },
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
        indexed: false,
        internalType: "struct P2pConfigStorage.ProcessingTimeSecs",
        name: "currTime",
        type: "tuple",
      },
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
        indexed: false,
        internalType: "struct P2pConfigStorage.ProcessingTimeSecs",
        name: "updatedTime",
        type: "tuple",
      },
    ],
    name: "ProcessingTimeUpdated",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "bytes32",
        name: "currency",
        type: "bytes32",
      },
      {
        indexed: true,
        internalType: "bytes32",
        name: "requestId",
        type: "bytes32",
      },
    ],
    name: "RequestFulfilled",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "bytes32",
        name: "currency",
        type: "bytes32",
      },
      {
        indexed: true,
        internalType: "bytes32",
        name: "requestId",
        type: "bytes32",
      },
    ],
    name: "RequestSent",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "address",
        name: "admin",
        type: "address",
      },
      {
        indexed: false,
        internalType: "bytes32",
        name: "currency",
        type: "bytes32",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "currExchangeINRPrice",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "updatedExchangeINRPrice",
        type: "uint256",
      },
    ],
    name: "SellPriceUpdated",
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
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "address",
        name: "admin",
        type: "address",
      },
      {
        indexed: false,
        internalType: "bool",
        name: "currStatus",
        type: "bool",
      },
      {
        indexed: false,
        internalType: "bool",
        name: "updatedStatus",
        type: "bool",
      },
    ],
    name: "UpdatedExchangeStatus",
    type: "event",
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
        name: "_marketPrice",
        type: "uint256",
      },
    ],
    name: "computePrices",
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
    inputs: [],
    name: "getGelatoAddress",
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
        name: "requestId",
        type: "bytes32",
      },
      {
        internalType: "bytes",
        name: "response",
        type: "bytes",
      },
      {
        internalType: "bytes",
        name: "err",
        type: "bytes",
      },
    ],
    name: "handleOracleFulfillment",
    outputs: [],
    stateMutability: "nonpayable",
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
        internalType: "bytes32",
        name: "currency",
        type: "bytes32",
      },
      {
        internalType: "string",
        name: "source",
        type: "string",
      },
    ],
    name: "isValidSourceCode",
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
      {
        internalType: "string",
        name: "source",
        type: "string",
      },
      {
        internalType: "uint8",
        name: "secretsSlotId",
        type: "uint8",
      },
      {
        internalType: "uint64",
        name: "secretsVersion",
        type: "uint64",
      },
      {
        internalType: "uint64",
        name: "subscriptionId",
        type: "uint64",
      },
      {
        internalType: "uint32",
        name: "gasLimit",
        type: "uint32",
      },
      {
        internalType: "bytes32",
        name: "donId",
        type: "bytes32",
      },
    ],
    name: "requestToUpdatePrice",
    outputs: [
      {
        internalType: "bytes32",
        name: "requestId",
        type: "bytes32",
      },
    ],
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
        name: "_spread",
        type: "uint256",
      },
    ],
    name: "setBaseSpread",
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
        name: "_buyPrice",
        type: "uint256",
      },
    ],
    name: "setBuyPrice",
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
        internalType: "int256",
        name: "_buyPriceOffset",
        type: "int256",
      },
    ],
    name: "setBuyPriceOffset",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "_cashbackToken",
        type: "address",
      },
      {
        internalType: "address",
        name: "_quoterAddress",
        type: "address",
      },
      {
        internalType: "uint24",
        name: "_quoterFee",
        type: "uint24",
      },
    ],
    name: "setCashbackConfig",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint24",
        name: "_cashbackPercentage",
        type: "uint24",
      },
    ],
    name: "setCashbackPercentage",
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
        internalType: "bytes32",
        name: "sourceCode",
        type: "bytes32",
      },
    ],
    name: "setCurrencyToSourceCode",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "_functionsRouter",
        type: "address",
      },
    ],
    name: "setFunctionsRouter",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "_updater",
        type: "address",
      },
    ],
    name: "setGelatoAddressConfig",
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
        name: "_sellPrice",
        type: "uint256",
      },
    ],
    name: "setSellPrice",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "_address",
        type: "address",
      },
      {
        internalType: "bool",
        name: "_status",
        type: "bool",
      },
    ],
    name: "setSuperAdmin",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "string",
        name: "str",
        type: "string",
      },
    ],
    name: "stringToBytes32",
    outputs: [
      {
        internalType: "bytes32",
        name: "",
        type: "bytes32",
      },
    ],
    stateMutability: "pure",
    type: "function",
  },
  {
    inputs: [],
    name: "toggleExchangeStatus",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "_admin",
        type: "address",
      },
      {
        internalType: "bool",
        name: "_status",
        type: "bool",
      },
    ],
    name: "updateAdmin",
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
        internalType: "int256",
        name: "newBumpPercentage",
        type: "int256",
      },
    ],
    name: "updatePriceBumpPercentage",
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
        name: "_priceUpdater",
        type: "address",
      },
    ],
    name: "updatePriceUpdater",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "bytes32[]",
        name: "currencies",
        type: "bytes32[]",
      },
      {
        internalType: "uint256[]",
        name: "buyPrices",
        type: "uint256[]",
      },
      {
        internalType: "uint256[]",
        name: "sellPrices",
        type: "uint256[]",
      },
    ],
    name: "updatePrices",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
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
        name: "_processingTime",
        type: "tuple",
      },
    ],
    name: "updateProcessingTime",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
] as const;
