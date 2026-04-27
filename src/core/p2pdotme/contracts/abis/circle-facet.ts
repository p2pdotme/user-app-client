export const circleFacetAbi = [
  {
    inputs: [],
    name: "AdminAlreadyHasCircle",
    type: "error",
  },
  {
    inputs: [],
    name: "CurrencyNotSupported",
    type: "error",
  },
  {
    inputs: [],
    name: "InvalidAdminCommunityUrl",
    type: "error",
  },
  {
    inputs: [],
    name: "InvalidCommunityUrl",
    type: "error",
  },
  {
    inputs: [],
    name: "InvalidName",
    type: "error",
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
        internalType: "uint256",
        name: "circleId",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "bytes32",
        name: "currency",
        type: "bytes32",
      },
      {
        indexed: false,
        internalType: "string",
        name: "name",
        type: "string",
      },
      {
        indexed: false,
        internalType: "string",
        name: "communityUrl",
        type: "string",
      },
      {
        indexed: false,
        internalType: "string",
        name: "adminCommunityUrl",
        type: "string",
      },
      {
        indexed: false,
        internalType: "bool",
        name: "autoApprovePaymentChannels",
        type: "bool",
      },
    ],
    name: "CircleCreated",
    type: "event",
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
        name: "name",
        type: "string",
      },
      {
        internalType: "string",
        name: "communityUrl",
        type: "string",
      },
      {
        internalType: "string",
        name: "adminCommunityUrl",
        type: "string",
      },
      {
        internalType: "bool",
        name: "autoApprovePaymentChannels",
        type: "bool",
      },
    ],
    name: "createCircle",
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
    name: "getAdminByCircleId",
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
    name: "getCircle",
    outputs: [
      {
        components: [
          {
            internalType: "uint256",
            name: "id",
            type: "uint256",
          },
          {
            internalType: "address",
            name: "admin",
            type: "address",
          },
          {
            internalType: "bool",
            name: "autoApprovePaymentChannels",
            type: "bool",
          },
          {
            internalType: "bytes32",
            name: "currency",
            type: "bytes32",
          },
          {
            internalType: "uint256",
            name: "merchantCount",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "paymentChannelCount",
            type: "uint256",
          },
          {
            internalType: "string",
            name: "name",
            type: "string",
          },
          {
            internalType: "string",
            name: "communityUrl",
            type: "string",
          },
          {
            internalType: "string",
            name: "adminCommunityUrl",
            type: "string",
          },
          {
            internalType: "uint256",
            name: "circleMerchantTotalStakedUsdc",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "circleExchangeLiquidityBalance",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "circleExchangeFiatBalance",
            type: "uint256",
          },
          {
            internalType: "uint16",
            name: "disputeCounter",
            type: "uint16",
          },
          {
            internalType: "enum CircleStorage.CircleStatus",
            name: "status",
            type: "uint8",
          },
        ],
        internalType: "struct CircleStorage.Circle",
        name: "",
        type: "tuple",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getCircleCount",
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
    ],
    name: "getCircleExchangeFiatBalance",
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
    ],
    name: "getCircleExchangeLiquidityBalance",
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
        name: "admin",
        type: "address",
      },
    ],
    name: "getCircleIdByAdmin",
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
    ],
    name: "getCircleMerchantTotalStakedUsdc",
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
    ],
    name: "isCircleActive",
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
] as const;
