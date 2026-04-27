export type Domain =
  | "WalletAddressBook"
  | "SellAddressBook"
  | "Settings"
  | "User"
  | "ThirdwebAdapter"
  | "Subgraph"
  | "Utils"
  | "QRParser"
  | "RangoDeposit"
  | "RangoWithdraw"
  | "Subgraph"
  | "SellQuiz";

export type ErrorCode =
  | "StorageError"
  | "NotFoundError"
  | "ValidationError"
  | "AlreadyExistsError"
  | "TWEstimateGasError"
  | "TWMaxPriorityFeeError"
  | "TWPreprareTxError"
  | "TWSendAndConfirmTransactionError"
  | "TWReadContractError"
  | "TWValidateError"
  | "SGNetworkError"
  | "SGParseError"
  | "SGGraphQLError"
  | "SGNoDataError"
  | "SGConfigurationError"
  | "SGUnreachable"
  | "RelayIdentityError"
  | "QRParserError"
  | "RangoBalanceFetchError"
  | "RangoQuoteError"
  | "RangoSwapError"
  | "RangoApproveError"
  | "RangoDepositError"
  | "RangoWithdrawError"
  | "AccountAddressNotAvailable";

export interface AppError<D extends Domain = Domain> {
  readonly domain: D; // where the error occurred
  readonly code: ErrorCode; // what kind of error it is
  readonly message: string; // Human/developer-readable message
  readonly cause?: unknown; // Original error for debugging
  readonly context?: Record<string, unknown>; // Additional relevant data
}

/**
 * Creates a generic AppError
 * @param message - Human/developer-readable message
 * @param options - Additional options
 * @returns AppError
 */
export function createAppError<D extends Domain = Domain>(
  message: string,
  options: {
    domain: D;
    code: ErrorCode;
    cause: unknown;
    context: Record<string, unknown>;
  },
): AppError<D> {
  return {
    domain: options.domain,
    code: options.code,
    message,
    cause: options.cause,
    context: options.context,
  };
}

export const contractErrors = {
  NotAdmin: "NOT_ADMIN",
  NotSuperAdmin: "NOT_SUPER_ADMIN",
  NotAuthorized: "NOT_AUTHORIZED",
  ExchangeNotOperational: "EXCHANGE_NOT_OPERATIONAL",
  OrderNotPlaced: "ORDER_NOT_PLACED_TO_BE_ACCEPTED",
  OrderNotPaid: "ONLY_PAID_BUY_ORDERS_CAN_BE_MARKED_COMPLETE",
  OrderStatusInvalid: "ORDER_WITH_PLACED_STATUS_ONLY_CAN_BE_REASSIGNED",
  OrderExpired: "ORDER_EXPIRED",
  OrderAlreadyPaid: "PAYMENT_ADDRESS_ALREADY_SENT",
  OrderAlreadyCompleted: "ORDER_ALREADY_MARKED_COMPLETED",
  InvalidOrderType: "INVALID_ORDER_TYPE",
  DailyBuyOrderLimitExceeded: "DAILY_BUY_ORDER_COUNT_LIMIT_EXCEEDED",
  MonthlyBuyOrderLimitExceeded: "MONTHLY_BUY_ORDER_COUNT_LIMIT_EXCEEDED",
  SellOrderAmountLimitExceeded: "SELL_ORDER_AMOUNT_LIMIT_EXCEEDED",
  DisputeTimeNotReached:
    "DISPUTE_CAN_ONLY_BE_RAISED_AFTER_T_MINUTES_OF_ORDER_PLACEMEN",
  DisputeTimeExpired:
    "DISPUTE_CAN_ONLY_BE_RAISED_AFTER_T_HOURS_OF_ORDER_PLACEMENT",
  TransactionIdMismatch: "TRANSACTION_ID_DOES_NOT_MATCH",
  AccountNumberMismatch: "ACCOUNT_NUMBER_DOES_NOT_MATCH",
  NotPaidBuyOrder: "NOT_A_PAID_BUY_ORDER",
  NoFiatLiquidity: "NO_FIAT_LIQUIDITY_ON_EXCHANGE_TO_COMPLETE_ORDER",
  InvalidAddress: "INVALID_ADDRESS",
  InvalidBlockAmount: "INVALID_BLOCK_AMOUNT",
  UserIsBlacklisted: "USER_IS_BLACKLISTED",
  ZeroReputationPoints: "CANNOT_PLACE_BUY_ORDERS_WITH_0_RP",
  BuyOrderAmountExceedsLimit: "BUY_ORDER_AMOUNT_EXCEEDS_LIMIT",
  SellOrderAmountExceedsLimit: "SELL_ORDER_AMOUNT_EXCEEDS_LIMIT",
  NotEnoughEligibleMerchants: "NOT_ENOUGH_ELIGIBLE_MERCHANTS",
  MerchantNotRegistered: "MERCHANT_IS_NOT_REGISTERED",
  MerchantNotApproved: "MERCHANT_IS_NOT_APPROVED",
  MerchantAlreadyRegistered: "MERCHANT_ALREADY_REGISTERED",
  StakeAmountTooLow: "STAKE_AMOUNT_TOO_LOW",
  InvalidAmount: "INVALID_AMOUNT",
  UnstakeRequestPending: "UNSTAKE_REQUEST_IS_ALREADY_PENDING",
  MerchantAlreadyRejected: "MERCHANT_ALREADY_REJECTED",
  NoWithdrawableAmount: "NO_WITHDRAWABLE_AMOUNT",
  PaymentChannelNotFound: "PAYMENT_CHANNEL_NOT_FOUND",
  PaymentChannelNotActive: "PAYMENT_CHANNEL_NOT_ACTIVE",
  InvalidPaymentChannelId: "INVALID_PAYMENT_CHANNEL_ID",
  DuplicatePaymentChannel: "DUPLICATE_PAYMENT_CHANNEL",
  DailyVolumeLimitExceeded: "DAILY_VOLUME_LIMIT_EXCEEDED",
  OrderNotAccepted: "ORDER_NOT_PLACED_TO_BE_ACCEPTED",
  UpiAlreadySent: "PAYMENT_ADDRESS_ALREADY_SENT",
  InvalidOrderUpi: "INVALID_ORDER_PAYMENT_ADDRESS",
  UsdtTransferFailed: "USDC_TRANSFER_FAILED",
  UsdtTransferFailedWithErrorMessage: "USDC_TRANSFER_FAILED_WITH_ERROR_MESSAGE",
  UsdtTransferFailedWithPanic: "USDC_TRANSFER_FAILED_WITH_PANIC",
  CurrencyNotSupported: "CURRENCY_NOT_SUPPORTED",
  PaymentChannelNotApproved: "PAYMENT_CHANNEL_NOT_APPROVED",
  OrderTypeIncorrect: "INCORRECT_ORDER_TYPE",
  MonthlyVolumeLimitExceeded: "MONTHLY_VOLUME_LIMIT_EXCEEDED",
  OldPaymentChannelNotFound: "OLD_PAYMENT_CHANNEL_NOT_FOUND",
  NewPaymentChannelNotFound: "NEW_PAYMENT_CHANNEL_NOT_FOUND",
  SamePaymentChannel: "OLD_AND_NEW_PAYMENT_CHANNELS_ARE_THE_SAME",
  OldPaymentChannelShouldBeInactive: "OLD_PAYMENT_CHANNEL_SHOULD_BE_INACTIVE",
  NewPaymentChannelShouldBeActive: "NEW_PAYMENT_CHANNEL_SHOULD_BE_ACTIVE",
  InvalidMigrationStatus: "INVALID_MIGRATION_STATUS",
  MigrationRequestNotPending: "NO_PENDING_MIGRATION_REQUEST",
  MigrationAlreadyRequested: "MIGRATION_ALREADY_REQUESTED",
  OrderAmountExceedsLimit: "ORDER_AMOUNT_EXCEEDS_LIMIT",
  BuyAmountExceedsUsdcLimit: "BUY_AMOUNT_EXCEEDS_USDC_LIMIT",
  SellAmountExceedsFiatLimit: "SELL_AMOUNT_EXCEEDS_FIAT_LIMIT",
  UnstakeRequestNotPending: "NO_PENDING_UNSTAKE_REQUEST",
  UserHasNoReputation: "USER_HAS_NO_REPUTATION",
  TokenAlreadyExists: "TOKEN_ALREADY_EXISTS",
  TokenNotFound: "TOKEN_NOT_FOUND",
  TokenEmpty: "TOKEN_EMPTY",
  InvalidOrderStatusToRaiseDispute: "INVALID_ORDER_STATUS_TO_RAISE_DISPUTE",
  DisputeNotRaised: "DISPUTE_NOT_RAISED",
  CannotRaiseDisputeTwice: "CANNOT_RAISE_DISPUTE_TWICE",
  DisputeAlreadySettled: "DISPUTE_ALREADY_SETTLED",
  UserYearlyVolumeLimitExceeded: "USER_YEARLY_VOLUME_LIMIT_EXCEEDED",
  MerchantBlacklisted: "MERCHANT_BLACKLISTED",
  OrderNotAssigned: "ORDER_NOT_ASSIGNED",
  MerchantNotBlacklisted: "MERCHANT_NOT_BLACKLISTED",
  MerchantAlreadyBlacklisted: "MERCHANT_ALREADY_BLACKLISTED",
  InsufficientStakedAmount: "INSUFFICIENT_STAKED_AMOUNT",
  NoRewardsToClaim: "NO_REWARDS_TO_CLAIM",
  ArrayLengthMismatch: "ARRAY_LENGTH_MISMATCH",
  NoStake: "NO_STAKE",
  UnstakeAmountExceeded: "UNSTAKE_AMOUNT_EXCEEDED",
  ZKPassportVerifierNotSet: "ZK_PASSPORT_VERIFIER_NOT_SET",
  ZKPassportDomainEmpty: "ZK_PASSPORT_DOMAIN_EMPTY",
  ZKPassportScopeEmpty: "ZK_PASSPORT_SCOPE_EMPTY",
  PassportAlreadyVerified: "PASSPORT_ALREADY_VERIFIED",
  ZKPassportProofInvalid: "ZK_PASSPORT_PROOF_INVALID",
  ZKPassportIdentifierAlreadyVerified:
    "ZK_PASSPORT_IDENTIFIER_ALREADY_VERIFIED",
  ZKPassportInvalidScope: "ZK_PASSPORT_INVALID_SCOPE",
  ZKPassportUnexpectedSender: "ZK_PASSPORT_UNEXPECTED_SENDER",
  ZKPassportAgeBelowMinimum: "ZK_PASSPORT_AGE_BELOW_MINIMUM",
  ZKPassportMinAgeTooHigh: "ZK_PASSPORT_MIN_AGE_TOO_HIGH",
  CannotVoteYourself: "CANNOT_VOTE_YOURSELF",
  // RpHelper errors (via Errors.sol)
  NoReputation: "NO_REPUTATION",
  NullifierAlreadyVerified: "NULLIFIER_ALREADY_VERIFIED",
  VerificationFailed: "VERIFICATION_FAILED",
  InvalidSocialPlatform: "INVALID_SOCIAL_PLATFORM",
  SocialAlreadyVerified: "SOCIAL_ALREADY_VERIFIED",
  YearFieldNotInProof: "YEAR_FIELD_NOT_FOUND_IN_PROOF",
  UserIdFieldNotInProof: "USER_ID_FIELD_NOT_FOUND_IN_PROOF",
  UserIdAlreadyVerified: "USER_ID_ALREADY_VERIFIED",
  UsernameAlreadyVerified: "USERNAME_ALREADY_VERIFIED",
  UsernameNotInProof: "USERNAME_FIELD_NOT_FOUND_IN_PROOF",
  LinkedInOnlyRpUpdates: "LINKEDIN_ONLY_SUPPORTS_RP_UPDATES",
  FacebookOnlyRpUpdates: "FACEBOOK_ONLY_RP_UPDATES",
  RecommendationAlreadyClaimed: "RECOMMENDATION_ALREADY_CLAIMED",
  SignatureValidationFailed: "SIGNATURE_VALIDATION_FAILED",
  VotesPerEpochExceeded: "VOTES_PER_EPOCH_EXCEEDED",
  InsufficientRP: "INSUFFICIENT_RP",
  AlreadyVoted: "ALREADY_VOTED",
  FunctionNotFound: "FUNCTION_NOT_FOUND",
  SelfReferralNotAllowed: "SELF_REFERRAL_NOT_ALLOWED",
  AlreadyReferred: "ALREADY_REFERRED",
  MerchantMonthlyReferralLimitReached:
    "MERCHANT_MONTHLY_REFERRAL_LIMIT_REACHED",
  NotWhitelisted: "NOT_WHITELISTED",
  CampaignNotActive: "CAMPAIGN_NOT_ACTIVE",
  InvalidManagerDetails: "INVALID_MANAGER_DETAILS",
  UserIsBlacklistedAddr: "USER_IS_BLACKLISTED",
  UnclaimedRewardsExist: "UNCLAIMED_REWARDS_EXIST",
  RewardAlreadyClaimed: "REWARD_ALREADY_CLAIMED",
  OnlyNewUsersAllowed: "ONLY_NEW_USERS_ALLOWED",
  ManagerNotFound: "MANAGER_NOT_FOUND",
  ManagerInactive: "MANAGER_INACTIVE",
  BatchTooLarge: "BATCH_TOO_LARGE",
  NoRewards: "NO_REWARDS",
  InvalidCampaignId: "INVALID_CAMPAIGN_ID",
  ZeroAddress: "ZERO_ADDRESS",
  CannotClaimRevenueForCurrentMonth: "CANNOT_CLAIM_REVENUE_FOR_CURRENT_MONTH",
  MerchantNotFulfilledEligibilityThreshold:
    "MERCHANT_NOT_FULFILLED_ELIGIBILITY_THRESHOLD",
};

export const errorMessages = {
  "Error - Not admin": "NOT_ADMIN",
  "Error - Not super admin": "NOT_SUPER_ADMIN",
  "Error - Not whitelisted": "NOT_WHITELISTED",
  "Error - Not Authorised": "NOT_AUTHORISED",
  "Error - Not authorised": "NOT_AUTHORISED",
  "Error - Can't vote yourself": "CANNOT_VOTE_SELF",
  "Error - Only 50 people per month": "ONLY_50_PEOPLE_PER_MONTH",
  "Error - Only 4 people in a month": "ONLY_4_PEOPLE_PER_MONTH",
  "Error - Need atleast 150 RP": "NEED_AT_LEAST_150_RP",
  "Error - Already voted": "ALREADY_VOTED",
  "Error - No rewards accrued": "NO_REWARDS_ACCRUED",
  "Error - Recommendation already claimed": "RECOMMENDATION_ALREADY_CLAIMED",
  "Error - Signature Validation Failed.": "SIGNATURE_VALIDATION_FAILED",
  "Error - Campaign is not active": "CAMPAIGN_NOT_ACTIVE",
  "Error - Invalid manager details": "INVALID_MANAGER_DETAILS",
  "Error - User blacklisted": "USER_BLACKLISTED",
  "Error - Unclaimed USDC rewards": "UNCLAIMED_USDC_REWARDS",
  "Error - Reward already claimed": "REWARD_ALREADY_CLAIMED",
  "Error - Only new users allowed": "ONLY_NEW_USERS_ALLOWED",
  "Error - Manager is inactive": "MANAGER_INACTIVE",
  "Error - No rewards": "NO_REWARDS",
  "Error - Invalid campaign ID": "INVALID_CAMPAIGN_ID",
  "Error - Zero address": "ZERO_ADDRESS",
  "Error - Get recommendation first": "GET_RECOMMENDATION_FIRST",
  "Error - Already verified": "ALREADY_VERIFIED",
  "Error - Verification failed": "VERIFICATION_FAILED",
  "Error - Invalid social platform": "INVALID_SOCIAL_PLATFORM",
  "Error - Year field not found in proof": "YEAR_FIELD_NOT_FOUND_IN_PROOF",
  "Error - User ID field not found in proof":
    "USER_ID_FIELD_NOT_FOUND_IN_PROOF",
  "Error - User ID already verified": "USER_ID_ALREADY_VERIFIED",
  "Error - Username already verified": "USERNAME_ALREADY_VERIFIED",
  "Error - Username field not found in proof":
    "USERNAME_FIELD_NOT_FOUND_IN_PROOF",
  "Error - LinkedIn only supports RP updates":
    "LINKEDIN_ONLY_SUPPORTS_RP_UPDATES",
  "Error - !social": "NOT_SOCIAL",
  "Error - No function exists!": "NO_FUNCTION_EXISTS",
  "Error - User address mismatch": "USER_ADDRESS_MISMATCH",
  "Error - Eligibility criteria not met": "ELIGIBILITY_CRITERIA_NOT_MET",
  "Error - ExchangeNotOperational": "EXCHANGE_NOT_OPERATIONAL",
  "Error - No merchants to migrate": "NO_MERCHANTS_TO_MIGRATE",
  "Error - Underflow: cannot subtract more than balance":
    "UNDERFLOW_CANNOT_SUBTRACT_MORE_THAN_BALANCE",
  "Error - Invalid address": "INVALID_ADDRESS",
  "Error - Cooldown period not elapsed": "COOLDOWN_PERIOD_NOT_ELAPSED",
  "Error - Stake amount must be greater than 0":
    "STAKE_AMOUNT_MUST_BE_GREATER_THAN_0",
  "Error - No staked amount": "NO_STAKED_AMOUNT",
  "Error - Unstake amount exceeds total staked":
    "UNSTAKE_AMOUNT_EXCEEDS_TOTAL_STAKED",
  "Error - No unstake request pending": "NO_PENDING_UNSTAKE_REQUEST",
  "Error - ZK verification required": "ZK_VERIFICATION_REQUIRED",
  "Error - Diamond: Function does not exist": "DIAMOND_FUNCTION_DOES_NOT_EXIST",
  "Error - LibDiamond: Must be contract owner":
    "LIB_DIAMOND_MUST_BE_CONTRACT_OWNER",
  "Error - LibDiamondCut: No selectors in facet to cut":
    "LIB_DIAMOND_CUT_NO_SELECTORS_IN_FACET_TO_CUT",
  "Error - LibDiamondCut: Add facet can't be address(0)":
    "LIB_DIAMOND_CUT_ADD_FACET_CANT_BE_ADDRESS_0",
  "Error - LibDiamondCut: Can't remove immutable function":
    "LIB_DIAMOND_CUT_CANT_REMOVE_IMMUTABLE_FUNCTION",
  "Error - LibDiamondCut: Incorrect FacetCutAction":
    "LIB_DIAMOND_CUT_INCORRECT_FACET_CUT_ACTION",
  "Error - LibDiamondCut: New facet has no code":
    "LIB_DIAMOND_CUT_NEW_FACET_HAS_NO_CODE",
  "Error - LibDiamondCut: _init address has no code":
    "LIB_DIAMOND_CUT_INIT_ADDRESS_HAS_NO_CODE",
  "Error - target is longer than data": "TARGET_IS_LONGER_THAN_DATA",
};

export const hexContractErrors = {
  "0x7bfa4b9f": contractErrors.NotAdmin,
  "0x16c726b1": contractErrors.NotSuperAdmin,
  "0xea8e4eb5": contractErrors.NotAuthorized,
  "0x4bbac5de": contractErrors.ExchangeNotOperational,
  "0x58db8ed6": contractErrors.OrderNotPlaced,
  "0x1e3b9629": contractErrors.OrderNotPaid,
  "0x181b1b2e": contractErrors.OrderStatusInvalid,
  "0xc56873ba": contractErrors.OrderExpired,
  "0x7f61b868": contractErrors.OrderAlreadyPaid,
  "0x03683687": contractErrors.OrderAlreadyCompleted,
  "0x688c176f": contractErrors.InvalidOrderType,
  "0xe595a7bf": contractErrors.DailyBuyOrderLimitExceeded,
  "0x675dbc86": contractErrors.MonthlyBuyOrderLimitExceeded,
  "0x64301cb8": contractErrors.SellOrderAmountLimitExceeded,
  "0x07a2454f": contractErrors.DisputeTimeNotReached,
  "0xb28c3e29": contractErrors.DisputeTimeExpired,
  "0x6131d13d": contractErrors.TransactionIdMismatch,
  "0x8ec051b8": contractErrors.AccountNumberMismatch,
  "0xf8bfad32": contractErrors.NotPaidBuyOrder,
  "0x81c2b982": contractErrors.NoFiatLiquidity,
  "0xe6c4247b": contractErrors.InvalidAddress,
  "0x3eb17c88": contractErrors.InvalidBlockAmount,
  "0xebb6f34b": contractErrors.UserIsBlacklisted,
  "0xd2e1e6e0": contractErrors.ZeroReputationPoints,
  "0x91da284f": contractErrors.BuyOrderAmountExceedsLimit,
  "0xb407b9ec": contractErrors.SellOrderAmountExceedsLimit,
  "0x5d04ff4c": contractErrors.NotEnoughEligibleMerchants,
  "0xa6af7ebe": contractErrors.MerchantNotRegistered,
  "0x7290a612": contractErrors.MerchantNotApproved,
  "0xf4a1e014": contractErrors.MerchantAlreadyRegistered,
  "0x3fd2347e": contractErrors.StakeAmountTooLow,
  "0x2c5211c6": contractErrors.InvalidAmount,
  "0xa9de99ae": contractErrors.UnstakeRequestPending,
  "0x8713aaba": contractErrors.MerchantAlreadyRejected,
  "0x1b1d7861": contractErrors.NoWithdrawableAmount,
  "0x552ff5ec": contractErrors.PaymentChannelNotFound,
  "0xfccd93cf": contractErrors.PaymentChannelNotActive,
  "0x99c8ef4d": contractErrors.InvalidPaymentChannelId,
  "0x0569ab3e": contractErrors.DuplicatePaymentChannel,
  "0x7e2ee654": contractErrors.DailyVolumeLimitExceeded,
  "0x6b1b90b4": contractErrors.OrderNotAccepted,
  "0xc1654697": contractErrors.UpiAlreadySent,
  "0xaa60ec26": contractErrors.InvalidOrderUpi,
  "0x149f9fca": contractErrors.UsdtTransferFailed,
  "0x47bfece5": contractErrors.UsdtTransferFailedWithErrorMessage,
  "0x279bbc0c": contractErrors.UsdtTransferFailedWithPanic,
  "0x02a6fdd2": contractErrors.CurrencyNotSupported,
  "0x6764f4d6": contractErrors.PaymentChannelNotApproved,
  "0x2e757a60": contractErrors.OrderTypeIncorrect,
  "0x49de1789": contractErrors.MonthlyVolumeLimitExceeded,
  "0xff4f83ca": contractErrors.OldPaymentChannelNotFound,
  "0xb1198199": contractErrors.NewPaymentChannelNotFound,
  "0xc905b99a": contractErrors.SamePaymentChannel,
  "0xcedb41f1": contractErrors.OldPaymentChannelShouldBeInactive,
  "0x487add97": contractErrors.NewPaymentChannelShouldBeActive,
  "0x92aa7d0f": contractErrors.InvalidMigrationStatus,
  "0x7ff47425": contractErrors.MigrationRequestNotPending,
  "0x88ddec46": contractErrors.MigrationAlreadyRequested,
  "0xf42e41a1": contractErrors.OrderAmountExceedsLimit,
  "0x4b29cf0a": contractErrors.BuyAmountExceedsUsdcLimit,
  "0xbba2edf9": contractErrors.SellAmountExceedsFiatLimit,
  "0x0b7c70f3": contractErrors.UnstakeRequestNotPending,
  "0x071ea33c": contractErrors.UserHasNoReputation,
  "0xc991cbb1": contractErrors.TokenAlreadyExists,
  "0xcbdb7b30": contractErrors.TokenNotFound,
  "0x9f11a53f": contractErrors.TokenEmpty,
  "0x2a829f07": contractErrors.InvalidOrderStatusToRaiseDispute,
  "0x88d039ce": contractErrors.DisputeNotRaised,
  "0x3764a75c": contractErrors.CannotRaiseDisputeTwice,
  "0x866e9f89": contractErrors.DisputeAlreadySettled,
  "0xb14a1ff3": contractErrors.UserYearlyVolumeLimitExceeded,
  "0x9ae55bc7": contractErrors.MerchantBlacklisted,
  "0x1775c43e": contractErrors.OrderNotAssigned,
  "0x0ee0b659": contractErrors.MerchantNotBlacklisted,
  "0x5f765689": contractErrors.MerchantAlreadyBlacklisted,
  "0xd06ff88e": contractErrors.InsufficientStakedAmount,
  "0x73380d99": contractErrors.NoRewardsToClaim,
  "0xa24a13a6": contractErrors.ArrayLengthMismatch,
  "0xcacf989a": contractErrors.NoStake,
  "0xe665491f": contractErrors.UnstakeAmountExceeded,
  "0xfd8d4a6d": contractErrors.ZKPassportVerifierNotSet,
  "0xb87078f9": contractErrors.ZKPassportDomainEmpty,
  "0x5eadc4c2": contractErrors.ZKPassportScopeEmpty,
  "0x7642fe15": contractErrors.PassportAlreadyVerified,
  "0x1fa24b35": contractErrors.ZKPassportProofInvalid,
  "0x36bdb7b6": contractErrors.ZKPassportIdentifierAlreadyVerified,
  "0xd13a7934": contractErrors.ZKPassportInvalidScope,
  "0x69f5bfe7": contractErrors.ZKPassportUnexpectedSender,
  "0x0464115c": contractErrors.ZKPassportAgeBelowMinimum,
  "0x48183836": contractErrors.ZKPassportMinAgeTooHigh,
  "0x74785d0f": contractErrors.CannotVoteYourself,
  "0x3c0ca622": contractErrors.NoReputation,
  "0x0f165e7b": contractErrors.NullifierAlreadyVerified,
  "0x439cc0cd": contractErrors.VerificationFailed,
  "0x2366073b": contractErrors.InvalidSocialPlatform,
  "0x2f850b6b": contractErrors.SocialAlreadyVerified,
  "0x466f52a8": contractErrors.YearFieldNotInProof,
  "0x4d460588": contractErrors.UserIdFieldNotInProof,
  "0xa18ea4e8": contractErrors.UserIdAlreadyVerified,
  "0x69470b13": contractErrors.UsernameAlreadyVerified,
  "0x8390b2dd": contractErrors.UsernameNotInProof,
  "0xef053cf4": contractErrors.LinkedInOnlyRpUpdates,
  "0x355b0709": contractErrors.FacebookOnlyRpUpdates,
  "0x0ece93a6": contractErrors.RecommendationAlreadyClaimed,
  "0x2fdec18b": contractErrors.SignatureValidationFailed,
  "0xc26d5f75": contractErrors.VotesPerEpochExceeded,
  "0x412dd2b1": contractErrors.InsufficientRP,
  "0x7c9a1cf9": contractErrors.AlreadyVoted,
  "0x403e7fa6": contractErrors.FunctionNotFound,
  "0x83463f4a": contractErrors.SelfReferralNotAllowed,
  "0x7aabdfe3": contractErrors.AlreadyReferred,
  "0x1b19ad97": contractErrors.MerchantMonthlyReferralLimitReached,
  "0x584a7938": contractErrors.NotWhitelisted,
  "0x7a551e38": contractErrors.CampaignNotActive,
  "0x668ca75d": contractErrors.InvalidManagerDetails,
  "0xc23cefef": contractErrors.UserIsBlacklistedAddr,
  "0x2f950361": contractErrors.UnclaimedRewardsExist,
  "0x626b7c00": contractErrors.RewardAlreadyClaimed,
  "0x902ade67": contractErrors.OnlyNewUsersAllowed,
  "0x22a5e34b": contractErrors.ManagerNotFound,
  "0xa1610e37": contractErrors.ManagerInactive,
  "0xbb1cb70b": contractErrors.BatchTooLarge,
  "0x3fb087f4": contractErrors.NoRewards,
  "0x3eedee0f": contractErrors.InvalidCampaignId,
  "0xd92e233d": contractErrors.ZeroAddress,
  "0x302c5138": contractErrors.CannotClaimRevenueForCurrentMonth,
  "0x70d753bd": contractErrors.MerchantNotFulfilledEligibilityThreshold,
};

export function parseContractError(error: unknown) {
  if (!error) return null;

  // Handle string errors directly
  if (typeof error === "string") {
    // Check if it's a hex error code
    if (
      error.startsWith("0x") &&
      hexContractErrors[error as keyof typeof hexContractErrors]
    ) {
      return hexContractErrors[error as keyof typeof hexContractErrors];
    }

    // Check if it contains a hex error code
    const hexMatch = error.match(/0x[a-fA-F0-9]{8}/);
    if (
      hexMatch &&
      hexContractErrors[hexMatch[0] as keyof typeof hexContractErrors]
    ) {
      return hexContractErrors[hexMatch[0] as keyof typeof hexContractErrors];
    }

    return null;
  }

  // Handle error objects
  if (typeof error === "object" && error !== null) {
    const errorObj = error as {
      data?: string | { data?: string };
      message?: string;
      cause?: unknown;
    };

    // Check data field (common in contract errors)
    if (errorObj.data) {
      const hexCode =
        typeof errorObj.data === "string" ? errorObj.data : errorObj.data.data;
      if (
        hexCode &&
        hexContractErrors[hexCode as keyof typeof hexContractErrors]
      ) {
        return hexContractErrors[hexCode as keyof typeof hexContractErrors];
      }
    }

    // Check message field for hex codes
    if (errorObj.message && typeof errorObj.message === "string") {
      const hexMatch = errorObj.message.match(/0x[a-fA-F0-9]{8}/);
      if (
        hexMatch &&
        hexContractErrors[hexMatch[0] as keyof typeof hexContractErrors]
      ) {
        return hexContractErrors[hexMatch[0] as keyof typeof hexContractErrors];
      }

      if (errorMessages[errorObj.message as keyof typeof errorMessages]) {
        return errorMessages[errorObj.message as keyof typeof errorMessages];
      }
    }

    // Check cause field recursively
    if (errorObj.cause) {
      return parseContractError(errorObj.cause);
    }
  }

  return null;
}

/** Returns the i18n key for a placeOrder error.
 *  "No eligible circles found" → NO_LIQUIDITY_FOR_ORDER
 *  anything else              → FAILED_TO_PLACE_ORDER */
export function placeOrderErrorKey(error: {
  message: string;
}): "NO_LIQUIDITY_FOR_ORDER" | "FAILED_TO_PLACE_ORDER" {
  return error.message.includes("No eligible circles found")
    ? "NO_LIQUIDITY_FOR_ORDER"
    : "FAILED_TO_PLACE_ORDER";
}
