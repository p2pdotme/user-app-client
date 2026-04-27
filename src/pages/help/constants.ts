import ASSETS from "@/assets";

export interface VideoGuide {
  id: string;
  titleKey: string;
  /**
   * Preferred: language-specific links. Keys should be i18n language codes like 'en', 'pt', 'id', 'hi'.
   */
  links?: Partial<Record<string, string>>;
  /**
   * Backward compatibility: old translation key or direct url string. Avoid using translations for links going forward.
   */
  linkKey?: string;
  /**
   * Preferred: language-specific thumbnails. Keys should be i18n language codes like 'en', 'pt', 'id', 'hi'.
   */
  thumbnails?: Partial<Record<string, string>>;
  /**
   * Optional orientation hint; true for portrait (YouTube Shorts etc.)
   */
  isPortrait?: boolean;
  excludedFrom?: string[];
}

export interface FAQ {
  id: string;
  questionKey: string;
  answerKey: string;
  excludedFrom?: string[];
  onlyForCurrencies?: string[];
}

export interface SupportPageSection {
  videoGuideIds: string[];
  faqIds: string[];
}

export const SUPPORT_PAGE_TITLES = {
  GETTING_STARTED: "getting-started",
  GENERAL: "general",
  MY_LIMITS: "my-limits",
  REFER_AND_EARN: "refer-and-earn",
  TRANSACTIONS: "transactions",
  DEPOSITS_WITHDRAWALS: "deposits-withdrawals",
} as const;

export type SupportPageTitle =
  (typeof SUPPORT_PAGE_TITLES)[keyof typeof SUPPORT_PAGE_TITLES];

export const SUPPORT_PAGE_CONTENT: Record<
  SupportPageTitle,
  SupportPageSection
> = {
  [SUPPORT_PAGE_TITLES.GETTING_STARTED]: {
    videoGuideIds: [
      "video-app-tour",
      "video-deposit-flow",
      "video-withdraw-flow",
      "video-buy-flow",
      "video-generate-referral",
      "video-claiming-referral",
      "video-increase-transaction-limit",
    ],
    faqIds: [
      "getting-started-1", // Why can't I text on the P2P.me Telegram channel? What should I do?
      "getting-started-2", // How to Deposit and Withdraw from Exchanges like Binance, MEXC or other wallets to P2P.me
      "getting-started-3", // How to Buy USDC on P2P.me Using Fiat or Local Currency
      "getting-started-4", // Can I Scan Any QR Code and Pay with USDC on P2P.me?
      "getting-started-5", // How do I sell USDC and get deposited to my payment details?
      "getting-started-6", // Where to Find Your Order or Transaction History on P2P.me
      "getting-started-7", // How do I increase my Buy/Sell limits?
      "getting-started-8", // How to Earn Money on P2P.me
      "getting-started-9", // How do I pay with Scan & Pay on P2P.me?
    ],
  },
  [SUPPORT_PAGE_TITLES.GENERAL]: {
    videoGuideIds: [],
    faqIds: [
      "general-1", // What is P2P.me?
      "general-2", // Is P2P.me safe to use?
      "general-3", // Will you ever submit my data to the government in the future?
      "general-4", // Which coins and networks does P2P.me support?
      "general-5", // Do I need KYC to use P2P.me?
      "general-6", // What are the default limits on P2P.me?
      "general-7", // How does P2P.me ensure secure transactions?
      "general-8", // What's this whole zero-knowledge thing?
      "general-9", // How are merchants selected on P2P.me?
      "general-10", // What fees does P2P.me charge?
      "general-11", // App Not Loading in Your Region? Here's How to Access It
      "general-12", // Can I use P2P.me for daily crypto spending?
      "general-13", // How do you prevent fraud?
      "general-14", // What happens if my account freezes? Will P2P.me help unfreeze it?
      "general-15", // How does P2P.me protect you from account freeze fraud?
      "general-16", // I don't want to link my social accounts — is it safe?
      "general-17", // Why are SELL USDC rates low sometimes?
      "general-18", // Will P2P take care of my taxes?
      "general-19", // Is P2P.me compliant with anti-money laundering (AML) laws?
      "general-20", // Who is building and maintaining P2P.me?
      "general-21", // What is the Bank Freeze Protection for Indian P2P.me users?
    ],
  },
  [SUPPORT_PAGE_TITLES.MY_LIMITS]: {
    videoGuideIds: [
      "video-zk-verification-instagram",
      "video-zk-verification-linkedin",
      "video-zk-verification-github",
      "video-zk-verification-aadhaar",
    ],
    faqIds: [
      "limits-1", // What are the default limits?
      "limits-2", // Where can I check my transaction limits?
      "limits-3", // Are buy and sell limits tracked separately?
      "limits-4", // Can I lose my increased limits?
      "limits-5", // How do I verify my social accounts with zk proofs to increase my limits?
      "limits-6", // How do I complete Aadhaar verification?
      "limits-7", // Why am I seeing "Didn't meet eligible criteria" at the end of verification?
    ],
  },
  [SUPPORT_PAGE_TITLES.REFER_AND_EARN]: {
    videoGuideIds: [
      "video-generate-referral",
      "video-claiming-rewards-general",
    ],
    faqIds: [
      "refer-earn-1", // What is Refer & Earn on P2P.me?
      "refer-earn-2", // How much can I earn?
      "refer-earn-3", // When do I become eligible to earn?
      "refer-earn-4", // How do I start earning?
      "refer-earn-5", // How many users can I refer?
      "refer-earn-6", // Where do I view and claim my rewards?
      "refer-earn-7", // Are there any risks in referring someone?
    ],
  },
  [SUPPORT_PAGE_TITLES.TRANSACTIONS]: {
    videoGuideIds: [
      "video-buy-flow",
      "video-sell-flow",
      "video-scan-and-pay",
      "video-raise-dispute",
    ],
    faqIds: [
      "transactions-1", // Where can I view all my transactions on P2P.me?
      "transactions-2", // What are the different statuses of an order?
      "transactions-3", // Can I download my transaction history?
      "transactions-4", // What are Disputed transactions?
      "transactions-5", // When should I raise a dispute for a Buy order?
      "transactions-6", // When should I raise a dispute for a Sell order?
      "transactions-7", // How can I raise a dispute?
      "transactions-8", // What happens if I raise a false dispute?
      "transactions-9", // The shopkeeper is asking to see the payment – what should I do?
    ],
  },
  [SUPPORT_PAGE_TITLES.DEPOSITS_WITHDRAWALS]: {
    videoGuideIds: [
      "video-deposit-flow-detailed",
      "video-withdraw-flow-detailed",
      "video-rango-support-ticket",
    ],
    faqIds: [
      "deposits-withdrawals-1", // How can I deposit USDC into my P2P.me wallet?
      "deposits-withdrawals-2", // Are deposits and withdrawals gasless?
      "deposits-withdrawals-3", // What networks are supported for deposits?
      "deposits-withdrawals-4", // What if my cross-chain transaction gets stuck?
      "deposits-withdrawals-5", // How do I withdraw funds from P2P.me?
      "deposits-withdrawals-6", // Can I withdraw USDC to other networks?
      "deposits-withdrawals-7", // Who handles cross-chain transactions?
      "deposits-withdrawals-8", // Where can I find my deposit and withdrawal history?
      "deposits-withdrawals-9", // Are there any withdrawal limits?
      "deposits-withdrawals-10", // What should I do if my withdrawal hasn't arrived?
      "deposits-withdrawals-11", // How do I recover my funds if I sent the wrong token or used the wrong network?
    ],
  },
};

export const FAQ_ON_PAGES = {
  DEPOSIT_PAGE: {
    faqIds: [
      "deposits-withdrawals-11", // How do I recover my funds if I sent the wrong token or used the wrong network?
      "deposits-withdrawals-8", // Where can I find my deposit and withdrawal history?
      "deposits-withdrawals-4", // What if my cross-chain transaction gets stuck?
    ],
  },

  WITHDRAW_PAGE: {
    faqIds: [
      "deposits-withdrawals-10", // What should I do if my withdrawal hasn't arrived?
      "deposits-withdrawals-8", // Where can I find my deposit and withdrawal history?
      "deposits-withdrawals-4", // What if my cross-chain transaction gets stuck?
    ],
  },

  LIMITS_PAGE: {
    faqIds: [
      "limits-1", // What are the default limits?
      "limits-3", // Are buy and sell limits tracked separately?
      "limits-4", // Can I lose my increased limits?
    ],
  },

  REFERRAL_PAGE: {
    faqIds: [
      "refer-earn-3", // When do I become eligible to earn?
      "refer-earn-4", // How do I start earning?
      "refer-earn-7", // Are there any risks in referring someone?
    ],
  },

  TRANSACTIONS_PAGE: {
    faqIds: [
      "transactions-7", // How can I raise a dispute?
      "transactions-8", // What happens if I raise a false dispute?
      "transactions-9", // The shopkeeper is asking to see the payment – what should I do?
      "general-21", // What is the Bank Freeze Protection for Indian P2P.me users?
    ],
  },

  BUY_PAGE: {
    faqIds: [
      "getting-started-3", // How to Buy USDC on P2P.me Using Fiat or Local Currency
      "general-10", // What fees does P2P.me charge?
      "general-7", // How does P2P.me ensure secure transactions?
    ],
  },

  SELL_PAGE: {
    faqIds: [
      "getting-started-5", // How do I sell USDC and get deposited to my payment details?
      "general-17", // Why are SELL USDC rates low sometimes?
      "general-10", // What fees does P2P.me charge?
    ],
  },

  PAY_PAGE: {
    faqIds: [
      "getting-started-4", // Can I Scan Any QR Code and Pay with USDC on P2P.me?
      "transactions-9", // The shopkeeper is asking to see the payment – what should I do?
      "general-12", // Can I use P2P.me for daily crypto spending?
    ],
  },

  SELL_COMPLETED_PAGE: {
    faqIds: [
      "transactions-9", // The shopkeeper is asking to see the payment – what should I do?
    ],
  },

  PAY_COMPLETED_PAGE: {
    faqIds: [
      "transactions-9", // The shopkeeper is asking to see the payment – what should I do?
    ],
  },
};

export const ALL_FAQS: FAQ[] = [
  {
    id: "getting-started-1",
    questionKey: "FAQ_WHY_CANT_TEXT_TELEGRAM_CHANNEL",
    answerKey: "FAQ_WHY_CANT_TEXT_TELEGRAM_CHANNEL_ANSWER",
  },
  {
    id: "getting-started-2",
    questionKey: "FAQ_HOW_TO_DEPOSIT_WITHDRAW_EXCHANGES",
    answerKey: "FAQ_HOW_TO_DEPOSIT_WITHDRAW_EXCHANGES_ANSWER",
  },
  {
    id: "getting-started-3",
    questionKey: "FAQ_HOW_TO_BUY_USDC_FIAT",
    answerKey: "FAQ_HOW_TO_BUY_USDC_FIAT_ANSWER",
  },
  {
    id: "getting-started-4",
    questionKey: "FAQ_HOW_TO_SCAN_PAY_QR",
    answerKey: "FAQ_HOW_TO_SCAN_PAY_QR_ANSWER",
  },
  {
    id: "getting-started-5",
    questionKey: "FAQ_HOW_TO_SELL_USDC",
    answerKey: "FAQ_HOW_TO_SELL_USDC_ANSWER",
  },
  {
    id: "getting-started-6",
    questionKey: "FAQ_WHERE_TO_FIND_TRANSACTION_HISTORY",
    answerKey: "FAQ_WHERE_TO_FIND_TRANSACTION_HISTORY_ANSWER",
  },
  {
    id: "getting-started-7",
    questionKey: "FAQ_HOW_TO_INCREASE_LIMITS",
    answerKey: "FAQ_HOW_TO_INCREASE_LIMITS_ANSWER",
  },
  {
    id: "getting-started-8",
    questionKey: "FAQ_HOW_TO_EARN_MONEY",
    answerKey: "FAQ_HOW_TO_EARN_MONEY_ANSWER",
  },
  {
    id: "getting-started-9",
    questionKey: "FAQ_HOW_TO_PAY_WITH_SCAN_PAY",
    answerKey: "FAQ_HOW_TO_PAY_WITH_SCAN_PAY_ANSWER",
  },
  {
    id: "general-1",
    questionKey: "FAQ_WHAT_IS_P2P_ME",
    answerKey: "FAQ_WHAT_IS_P2P_ME_ANSWER",
  },
  {
    id: "general-2",
    questionKey: "FAQ_IS_P2P_ME_SAFE",
    answerKey: "FAQ_IS_P2P_ME_SAFE_ANSWER",
  },
  {
    id: "general-3",
    questionKey: "FAQ_WILL_YOU_SUBMIT_DATA_GOVERNMENT",
    answerKey: "FAQ_WILL_YOU_SUBMIT_DATA_GOVERNMENT_ANSWER",
  },
  {
    id: "general-4",
    questionKey: "FAQ_WHICH_COINS_NETWORKS_SUPPORTED",
    answerKey: "FAQ_WHICH_COINS_NETWORKS_SUPPORTED_ANSWER",
  },
  {
    id: "general-5",
    questionKey: "FAQ_DO_I_NEED_KYC",
    answerKey: "FAQ_DO_I_NEED_KYC_ANSWER",
  },
  {
    id: "general-6",
    questionKey: "FAQ_WHAT_ARE_DEFAULT_LIMITS",
    answerKey: "FAQ_WHAT_ARE_DEFAULT_LIMITS_ANSWER",
  },
  {
    id: "general-7",
    questionKey: "FAQ_HOW_SECURE_TRANSACTIONS",
    answerKey: "FAQ_HOW_SECURE_TRANSACTIONS_ANSWER",
  },
  {
    id: "general-8",
    questionKey: "FAQ_WHAT_IS_ZERO_KNOWLEDGE",
    answerKey: "FAQ_WHAT_IS_ZERO_KNOWLEDGE_ANSWER",
  },
  {
    id: "general-9",
    questionKey: "FAQ_HOW_MERCHANTS_SELECTED",
    answerKey: "FAQ_HOW_MERCHANTS_SELECTED_ANSWER",
  },
  {
    id: "general-10",
    questionKey: "FAQ_WHAT_FEES_CHARGED",
    answerKey: "FAQ_WHAT_FEES_CHARGED_ANSWER",
  },
  {
    id: "general-11",
    questionKey: "FAQ_WHY_APP_BLOCKED_REGIONS",
    answerKey: "FAQ_WHY_APP_BLOCKED_REGIONS_ANSWER",
  },
  {
    id: "general-12",
    questionKey: "FAQ_CAN_USE_DAILY_CRYPTO_SPENDING",
    answerKey: "FAQ_CAN_USE_DAILY_CRYPTO_SPENDING_ANSWER",
  },
  {
    id: "general-13",
    questionKey: "FAQ_HOW_PREVENT_FRAUD",
    answerKey: "FAQ_HOW_PREVENT_FRAUD_ANSWER",
  },
  {
    id: "general-14",
    questionKey: "FAQ_WHAT_IF_BANK_FROZEN",
    answerKey: "FAQ_WHAT_IF_BANK_FROZEN_ANSWER",
  },
  {
    id: "general-15",
    questionKey: "FAQ_HOW_PROTECT_ACCOUNT_FREEZE",
    answerKey: "FAQ_HOW_PROTECT_ACCOUNT_FREEZE_ANSWER",
  },
  {
    id: "general-16",
    questionKey: "FAQ_DONT_WANT_LINK_SOCIAL_SAFE",
    answerKey: "FAQ_DONT_WANT_LINK_SOCIAL_SAFE_ANSWER",
  },
  {
    id: "general-17",
    questionKey: "FAQ_WHY_SELL_RATES_LOW",
    answerKey: "FAQ_WHY_SELL_RATES_LOW_ANSWER",
  },
  {
    id: "general-18",
    questionKey: "FAQ_WILL_P2P_HANDLE_TAXES",
    answerKey: "FAQ_WILL_P2P_HANDLE_TAXES_ANSWER",
  },
  {
    id: "general-19",
    questionKey: "FAQ_IS_P2P_ME_AML_COMPLIANT",
    answerKey: "FAQ_IS_P2P_ME_AML_COMPLIANT_ANSWER",
  },
  {
    id: "general-20",
    questionKey: "FAQ_WHO_IS_BUILDING_P2P_ME",
    answerKey: "FAQ_WHO_IS_BUILDING_P2P_ME_ANSWER",
  },
  {
    id: "general-21",
    questionKey: "FAQ_BANK_FREEZE_PROTECTION_INR_USERS",
    answerKey: "FAQ_BANK_FREEZE_PROTECTION_INR_USERS_ANSWER",
    onlyForCurrencies: ["INR"],
  },
  {
    id: "refer-earn-1",
    questionKey: "FAQ_WHAT_IS_REFER_AND_EARN",
    answerKey: "FAQ_WHAT_IS_REFER_AND_EARN_ANSWER",
  },
  {
    id: "refer-earn-2",
    questionKey: "FAQ_HOW_MUCH_CAN_I_EARN",
    answerKey: "FAQ_HOW_MUCH_CAN_I_EARN_ANSWER",
  },
  {
    id: "refer-earn-3",
    questionKey: "FAQ_WHEN_DO_I_BECOME_ELIGIBLE",
    answerKey: "FAQ_WHEN_DO_I_BECOME_ELIGIBLE_ANSWER",
  },
  {
    id: "refer-earn-4",
    questionKey: "FAQ_HOW_DO_I_START_EARNING",
    answerKey: "FAQ_HOW_DO_I_START_EARNING_ANSWER",
  },
  {
    id: "refer-earn-5",
    questionKey: "FAQ_HOW_MANY_USERS_CAN_I_REFER",
    answerKey: "FAQ_HOW_MANY_USERS_CAN_I_REFER_ANSWER",
  },
  {
    id: "refer-earn-6",
    questionKey: "FAQ_WHERE_VIEW_CLAIM_REWARDS",
    answerKey: "FAQ_WHERE_VIEW_CLAIM_REWARDS_ANSWER",
  },
  {
    id: "refer-earn-7",
    questionKey: "FAQ_ARE_THERE_RISKS_REFERRING",
    answerKey: "FAQ_ARE_THERE_RISKS_REFERRING_ANSWER",
  },
  {
    id: "transactions-1",
    questionKey: "FAQ_WHERE_VIEW_ALL_TRANSACTIONS",
    answerKey: "FAQ_WHERE_VIEW_ALL_TRANSACTIONS_ANSWER",
  },
  {
    id: "transactions-2",
    questionKey: "FAQ_WHAT_ARE_ORDER_STATUSES",
    answerKey: "FAQ_WHAT_ARE_ORDER_STATUSES_ANSWER",
  },
  {
    id: "transactions-3",
    questionKey: "FAQ_CAN_DOWNLOAD_TRANSACTION_HISTORY",
    answerKey: "FAQ_CAN_DOWNLOAD_TRANSACTION_HISTORY_ANSWER",
  },
  {
    id: "transactions-4",
    questionKey: "FAQ_WHAT_ARE_DISPUTED_TRANSACTIONS",
    answerKey: "FAQ_WHAT_ARE_DISPUTED_TRANSACTIONS_ANSWER",
  },
  {
    id: "transactions-5",
    questionKey: "FAQ_WHEN_RAISE_DISPUTE_BUY_ORDER",
    answerKey: "FAQ_WHEN_RAISE_DISPUTE_BUY_ORDER_ANSWER",
  },
  {
    id: "transactions-6",
    questionKey: "FAQ_WHEN_RAISE_DISPUTE_SELL_ORDER",
    answerKey: "FAQ_WHEN_RAISE_DISPUTE_SELL_ORDER_ANSWER",
  },
  {
    id: "transactions-7",
    questionKey: "FAQ_HOW_CAN_I_RAISE_DISPUTE",
    answerKey: "FAQ_HOW_CAN_I_RAISE_DISPUTE_ANSWER",
  },
  {
    id: "transactions-8",
    questionKey: "FAQ_WHAT_HAPPENS_FALSE_DISPUTE",
    answerKey: "FAQ_WHAT_HAPPENS_FALSE_DISPUTE_ANSWER",
  },
  {
    id: "transactions-9",
    questionKey: "FAQ_SHOPKEEPER_ASKING_PAYMENT_PROOF",
    answerKey: "FAQ_SHOPKEEPER_ASKING_PAYMENT_PROOF_ANSWER",
  },
  {
    id: "limits-1",
    questionKey: "FAQ_WHAT_ARE_DEFAULT_LIMITS_MY_LIMITS",
    answerKey: "FAQ_WHAT_ARE_DEFAULT_LIMITS_MY_LIMITS_ANSWER",
  },
  {
    id: "limits-2",
    questionKey: "FAQ_WHERE_CHECK_TRANSACTION_LIMITS",
    answerKey: "FAQ_WHERE_CHECK_TRANSACTION_LIMITS_ANSWER",
  },
  {
    id: "limits-3",
    questionKey: "FAQ_ARE_BUY_SELL_LIMITS_TRACKED_SEPARATELY",
    answerKey: "FAQ_ARE_BUY_SELL_LIMITS_TRACKED_SEPARATELY_ANSWER",
  },
  {
    id: "limits-4",
    questionKey: "FAQ_CAN_I_LOSE_INCREASED_LIMITS",
    answerKey: "FAQ_CAN_I_LOSE_INCREASED_LIMITS_ANSWER",
  },
  {
    id: "limits-5",
    questionKey: "FAQ_HOW_VERIFY_SOCIAL_ACCOUNTS_ZK_PROOFS",
    answerKey: "FAQ_HOW_VERIFY_SOCIAL_ACCOUNTS_ZK_PROOFS_ANSWER",
  },
  {
    id: "limits-6",
    questionKey: "FAQ_HOW_COMPLETE_AADHAAR_VERIFICATION",
    answerKey: "FAQ_HOW_COMPLETE_AADHAAR_VERIFICATION_ANSWER",
    excludedFrom: ["id", "pt"],
  },
  {
    id: "limits-7",
    questionKey: "FAQ_WHY_SEEING_DIDNT_MEET_ELIGIBLE_CRITERIA",
    answerKey: "FAQ_WHY_SEEING_DIDNT_MEET_ELIGIBLE_CRITERIA_ANSWER",
  },
  {
    id: "deposits-withdrawals-1",
    questionKey: "FAQ_HOW_DEPOSIT_USDC_WALLET",
    answerKey: "FAQ_HOW_DEPOSIT_USDC_WALLET_ANSWER",
  },
  {
    id: "deposits-withdrawals-2",
    questionKey: "FAQ_ARE_DEPOSITS_WITHDRAWALS_GASLESS",
    answerKey: "FAQ_ARE_DEPOSITS_WITHDRAWALS_GASLESS_ANSWER",
  },
  {
    id: "deposits-withdrawals-3",
    questionKey: "FAQ_WHAT_NETWORKS_SUPPORTED_DEPOSITS",
    answerKey: "FAQ_WHAT_NETWORKS_SUPPORTED_DEPOSITS_ANSWER",
  },
  {
    id: "deposits-withdrawals-4",
    questionKey: "FAQ_WHAT_IF_CROSS_CHAIN_STUCK",
    answerKey: "FAQ_WHAT_IF_CROSS_CHAIN_STUCK_ANSWER",
  },
  {
    id: "deposits-withdrawals-5",
    questionKey: "FAQ_HOW_WITHDRAW_FUNDS",
    answerKey: "FAQ_HOW_WITHDRAW_FUNDS_ANSWER",
  },
  {
    id: "deposits-withdrawals-6",
    questionKey: "FAQ_CAN_WITHDRAW_OTHER_NETWORKS",
    answerKey: "FAQ_CAN_WITHDRAW_OTHER_NETWORKS_ANSWER",
  },
  {
    id: "deposits-withdrawals-7",
    questionKey: "FAQ_WHO_HANDLES_CROSS_CHAIN",
    answerKey: "FAQ_WHO_HANDLES_CROSS_CHAIN_ANSWER",
  },
  {
    id: "deposits-withdrawals-8",
    questionKey: "FAQ_WHERE_FIND_DEPOSIT_WITHDRAWAL_HISTORY",
    answerKey: "FAQ_WHERE_FIND_DEPOSIT_WITHDRAWAL_HISTORY_ANSWER",
  },
  {
    id: "deposits-withdrawals-9",
    questionKey: "FAQ_ARE_THERE_WITHDRAWAL_LIMITS",
    answerKey: "FAQ_ARE_THERE_WITHDRAWAL_LIMITS_ANSWER",
  },
  {
    id: "deposits-withdrawals-10",
    questionKey: "FAQ_WITHDRAWAL_HASNT_ARRIVED",
    answerKey: "FAQ_WITHDRAWAL_HASNT_ARRIVED_ANSWER",
  },
  {
    id: "deposits-withdrawals-11",
    questionKey: "FAQ_HOW_RECOVER_FUNDS_WRONG_TOKEN_NETWORK",
    answerKey: "FAQ_HOW_RECOVER_FUNDS_WRONG_TOKEN_NETWORK_ANSWER",
  },
];

export const ALL_VIDEO_GUIDES: VideoGuide[] = [
  {
    id: "video-app-tour",
    titleKey: "VIDEO_APP_TOUR",
    links: {
      en: "https://youtu.be/gnJJdkWDMaU",
      pt: "https://youtu.be/ZZVdy4EqDvA",
      id: "https://youtu.be/KtMHbp38k0M",
      hi: "https://youtu.be/gnJJdkWDMaU",
    },
    thumbnails: {
      en: ASSETS.IMAGES.THUMBNAILS.APP_TOUR,
    },
  },
  {
    id: "video-deposit-flow",
    titleKey: "VIDEO_DIRECT_DEPOSIT",
    links: {
      en: "https://youtube.com/watch?v=aMiFT-mlphY",
      pt: "https://youtube.com/watch?v=CsDTfTJYNzc",
      id: "https://youtube.com/watch?v=aMiFT-mlphY",
      hi: "https://youtube.com/watch?v=J16ETq7dYoc",
      es: "https://youtube.com/watch?v=NAFGo4XvZi4",
    },
    thumbnails: {
      en: ASSETS.IMAGES.THUMBNAILS.DEPOSIT_DIRECT,
      pt: ASSETS.IMAGES.THUMBNAILS.DEPOSIT_DIRECT_PT,
      es: ASSETS.IMAGES.THUMBNAILS.DEPOSIT_DIRECT_ES,
    },
  },
  {
    id: "video-withdraw-flow",
    titleKey: "VIDEO_DIRECT_WITHDRAW",
    links: {
      en: "https://youtube.com/watch?v=2TJAklqCuK4",
      pt: "https://youtube.com/watch?v=XtW2MSQNeSU",
      id: "https://youtube.com/watch?v=2TJAklqCuK4",
      hi: "https://youtube.com/watch?v=AE4oLoSY9tk",
      es: "https://youtube.com/watch?v=qbUQQIQK7Bc",
    },
    thumbnails: {
      en: ASSETS.IMAGES.THUMBNAILS.WITHDRAW_DIRECT,
      pt: ASSETS.IMAGES.THUMBNAILS.WITHDRAW_DIRECT_PT,
      es: ASSETS.IMAGES.THUMBNAILS.WITHDRAW_DIRECT_ES,
    },
  },
  {
    id: "video-buy-flow",
    titleKey: "VIDEO_BUY_FLOW",
    links: {
      en: "https://youtube.com/watch?v=pqo7QpX6JJE",
      pt: "https://youtube.com/watch?v=g_cxu3JHw-M",
      id: "https://youtube.com/watch?v=pqo7QpX6JJE",
      hi: "https://youtube.com/watch?v=LcWbk4qbNkQ",
      es: "https://youtube.com/watch?v=012Z8AawMfs",
    },
    thumbnails: {
      en: ASSETS.IMAGES.THUMBNAILS.PLACE_BUY_ORDER,
      pt: ASSETS.IMAGES.THUMBNAILS.PLACE_BUY_ORDER_PT,
      es: ASSETS.IMAGES.THUMBNAILS.PLACE_BUY_ORDER_ES,
    },
  },
  // New: Sell Flow
  {
    id: "video-sell-flow",
    titleKey: "VIDEO_SELL_FLOW",
    links: {
      en: "https://youtube.com/watch?v=ZJfuiYenRDA",
      pt: "https://youtube.com/watch?v=OthmzGky9Sc",
      id: "https://youtube.com/watch?v=ZJfuiYenRDA",
      hi: "https://youtube.com/watch?v=o33uK2h45lI",
      es: "https://youtube.com/watch?v=qS7JnwwyPsY",
    },
    thumbnails: {
      en: ASSETS.IMAGES.THUMBNAILS.PLACE_SELL_ORDER,
      pt: ASSETS.IMAGES.THUMBNAILS.PLACE_SELL_ORDER_PT,
      es: ASSETS.IMAGES.THUMBNAILS.PLACE_SELL_ORDER_ES,
    },
  },

  // New: Generate Referral (Shorts)
  {
    id: "video-generate-referral",
    titleKey: "VIDEO_GENERATE_REFERRAL",
    links: {
      en: "https://youtube.com/watch?v=0WeIZ1WtJWs",
      pt: "https://youtube.com/watch?v=ypOmALhmUwY",
      id: "https://youtube.com/watch?v=0WeIZ1WtJWs",
      hi: "https://youtube.com/watch?v=HCf9xcO0YX8",
      es: "https://youtube.com/watch?v=gLjlSFZq-8w",
    },
    thumbnails: {
      en: ASSETS.IMAGES.THUMBNAILS.GENERATE_REFERRAL_LINK,
      pt: ASSETS.IMAGES.THUMBNAILS.GENERATE_REFERRAL_LINK_PT,
      es: ASSETS.IMAGES.THUMBNAILS.GENERATE_REFERRAL_LINK_ES,
    },
    isPortrait: true,
  },
  {
    id: "video-claiming-referral",
    titleKey: "VIDEO_CLAIM_REFERRAL",
    links: {
      en: "https://youtube.com/watch?v=RSY1JZ1OSyQ",
      pt: "https://www.youtube.com/watch?v=pnLluK_-dto",
      id: "https://youtube.com/watch?v=RSY1JZ1OSyQ",
      hi: "https://youtube.com/watch?v=DLdLXRgrGxY",
      es: "https://youtube.com/watch?v=bQTVPQW3FG4",
    },
    thumbnails: {
      en: ASSETS.IMAGES.THUMBNAILS.CLAIM_REFERRAL_REWARDS,
      pt: ASSETS.IMAGES.THUMBNAILS.CLAIM_REFERRAL_REWARDS_PT,
      es: ASSETS.IMAGES.THUMBNAILS.CLAIM_REFERRAL_REWARDS_ES,
    },
  },
  {
    id: "video-increase-transaction-limit",
    titleKey: "VIDEO_INCREASE_LIMITS",
    links: {
      en: "https://youtube.com/watch?v=KKL2h8FCPeM",
      pt: "https://youtube.com/watch?v=Ztn_jUmoVRQ",
      id: "https://youtube.com/watch?v=KKL2h8FCPeM",
      hi: "https://youtube.com/watch?v=YvcR4d4Udso",
      es: "https://youtube.com/watch?v=ZqpX1K225hM",
    },
    thumbnails: {
      en: ASSETS.IMAGES.THUMBNAILS.INCREASE_TRANSACTION_LIMITS,
      pt: ASSETS.IMAGES.THUMBNAILS.INCREASE_TRANSACTION_LIMITS_PT,
      es: ASSETS.IMAGES.THUMBNAILS.INCREASE_TRANSACTION_LIMITS_ES,
    },
  },
  {
    id: "video-zk-verification-github",
    titleKey: "VIDEO_GITHUB_VERIFICATION",
    links: {
      en: "https://www.youtube.com/watch?v=E6fE3at0sWc",
      pt: "https://youtube.com/watch?v=2hPVQywHev8",
      id: "https://www.youtube.com/watch?v=E6fE3at0sWc",
      hi: "https://youtube.com/watch?v=ZwQvAHP-Aoo",
      es: "https://youtube.com/watch?v=ahpSxeI3ZJM",
    },
    thumbnails: {
      en: ASSETS.IMAGES.THUMBNAILS.ZK_VERIFY_GITHUB,
      pt: ASSETS.IMAGES.THUMBNAILS.ZK_VERIFY_GITHUB_PT,
      es: ASSETS.IMAGES.THUMBNAILS.ZK_VERIFY_GITHUB_ES,
    },
  },
  {
    id: "video-zk-verification-aadhaar",
    titleKey: "VIDEO_AADHAR_VERIFICATION",
    links: {
      en: "https://youtu.be/jsnfzUufD0s",
      pt: "https://youtu.be/jsnfzUufD0s",
      id: "https://youtu.be/jsnfzUufD0s",
      hi: "https://youtube.com/watch?v=uvvHZkAnUvE",
      es: "https://youtu.be/jsnfzUufD0s",
    },
    thumbnails: {
      en: ASSETS.IMAGES.THUMBNAILS.ZK_VERIFY_AADHAAR,
    },
    excludedFrom: ["id", "pt", "es"],
  },

  {
    id: "video-claiming-rewards-general",
    titleKey: "VIDEO_CLAIM_REFERRAL_REWARDS",
    links: {
      en: "https://youtube.com/watch?v=k3M8pjxT44k",
      pt: "https://youtube.com/watch?v=XxXBOSOgfCw",
      id: "https://youtube.com/watch?v=k3M8pjxT44k",
      hi: "https://youtube.com/watch?v=ezROyDVOguI",
      es: "https://youtube.com/watch?v=uyVM-DF6lkY",
    },
    thumbnails: {
      en: ASSETS.IMAGES.THUMBNAILS.CLAIM_REFERRAL_REWARDS,
      pt: ASSETS.IMAGES.THUMBNAILS.CLAIM_REFERRAL_REWARDS_PT,
      es: ASSETS.IMAGES.THUMBNAILS.CLAIM_REFERRAL_REWARDS_ES,
    },
  },
  {
    id: "video-raise-dispute",
    titleKey: "VIDEO_RAISE_DISPUTE_SHORT",
    links: {
      en: "https://www.youtube.com/watch?v=QRiJIF30LfA",
      pt: "https://youtube.com/watch?v=0kPUHO_RhAA",
      id: "https://www.youtube.com/watch?v=QRiJIF30LfA",
      hi: "https://youtube.com/watch?v=Gb6pVXlptig",
      es: "https://youtube.com/watch?v=9crU4FW6a84",
    },
    thumbnails: {
      en: ASSETS.IMAGES.THUMBNAILS.RAISE_DISPUTE_ON_ORDER,
      pt: ASSETS.IMAGES.THUMBNAILS.RAISE_DISPUTE_ON_ORDER_PT,
      es: ASSETS.IMAGES.THUMBNAILS.RAISE_DISPUTE_ON_ORDER_ES,
    },
  },
  {
    id: "video-deposit-flow-detailed",
    titleKey: "VIDEO_CROSSCHAIN_DEPOSIT",
    links: {
      en: "https://youtu.be/wNNuaN4elCU",
      pt: "https://youtube.com/watch?v=o9pkLE2rkJ4",
      id: "https://youtu.be/wNNuaN4elCU",
      hi: "https://youtu.be/l60Mqy2DuJE",
      es: "https://youtube.com/watch?v=2d82Tgm0Mes",
    },
    thumbnails: {
      en: ASSETS.IMAGES.THUMBNAILS.CROSS_CHAIN_DEPOSIT,
      pt: ASSETS.IMAGES.THUMBNAILS.CROSS_CHAIN_DEPOSIT_PT,
      es: ASSETS.IMAGES.THUMBNAILS.CROSS_CHAIN_DEPOSIT_ES,
    },
  },
  {
    id: "video-withdraw-flow-detailed",
    titleKey: "VIDEO_CROSSCHAIN_WITHDRAW",
    links: {
      en: "https://youtube.com/watch?v=xmzIlZN_Jco",
      pt: "https://youtube.com/watch?v=n0e9V7rsg6Q",
      id: "https://youtube.com/watch?v=xmzIlZN_Jco",
      hi: "https://youtu.be/TsNqTZbpZcw",
      es: "https://youtube.com/watch?v=ROjtY5mv2jY",
    },
    thumbnails: {
      en: ASSETS.IMAGES.THUMBNAILS.CROSS_CHAIN_WITHDRAWAL,
      pt: ASSETS.IMAGES.THUMBNAILS.CROSS_CHAIN_WITHDRAWAL_PT,
      es: ASSETS.IMAGES.THUMBNAILS.CROSS_CHAIN_WITHDRAWAL_ES,
    },
  },
  {
    id: "video-rango-support-ticket",
    titleKey: "VIDEO_RANGO_SUPPORT",
    links: {
      en: "https://youtu.be/rB5QSTBsTMw",
      pt: "https://youtube.com/watch?v=aUtYYsq-aFI",
      id: "https://youtu.be/rB5QSTBsTMw",
      hi: "https://youtu.be/UGVRs50fm5E",
      es: "https://youtube.com/watch?v=xegoaxZXP5Y",
    },
    thumbnails: {
      en: ASSETS.IMAGES.THUMBNAILS.RAISE_RANGO_SUPPORT_TICKET,
      pt: ASSETS.IMAGES.THUMBNAILS.RAISE_RANGO_SUPPORT_TICKET_PT,
      es: ASSETS.IMAGES.THUMBNAILS.RAISE_RANGO_SUPPORT_TICKET_ES,
    },
  },
  // New: Scan & Pay
  {
    id: "video-scan-and-pay",
    titleKey: "VIDEO_SCAN_AND_PAY",
    links: {
      en: "https://youtube.com/watch?v=di9MwYjvSBA",
      pt: "https://youtube.com/watch?v=KmE7sNS33gk",
      id: "https://youtube.com/watch?v=di9MwYjvSBA",
      hi: "https://youtube.com/watch?v=ijUXtSDhIm8",
      es: "https://youtube.com/watch?v=IKVSayI8EI8",
    },
    thumbnails: {
      en: ASSETS.IMAGES.THUMBNAILS.SCAN_AND_PAY_ORDER,
      pt: ASSETS.IMAGES.THUMBNAILS.SCAN_AND_PAY_ORDER_PT,
      es: ASSETS.IMAGES.THUMBNAILS.SCAN_AND_PAY_ORDER_ES,
    },
  },
  // New: Instagram verification
  {
    id: "video-zk-verification-instagram",
    titleKey: "VIDEO_INSTAGRAM_VERIFICATION",
    links: {
      en: "https://youtube.com/watch?v=RKnWHbm8xgw",
      pt: "https://youtube.com/watch?v=FRRmW1scOm4",
      id: "https://youtube.com/watch?v=RKnWHbm8xgw",
      hi: "https://youtube.com/watch?v=Q4TeHpzTlB0",
      es: "https://youtube.com/watch?v=PGHplZMtgAI",
    },
    thumbnails: {
      en: ASSETS.IMAGES.THUMBNAILS.ZK_VERIFY_INSTAGRAM,
      pt: ASSETS.IMAGES.THUMBNAILS.ZK_VERIFY_INSTAGRAM_PT,
      es: ASSETS.IMAGES.THUMBNAILS.ZK_VERIFY_INSTAGRAM_ES,
    },
  },
  // New: LinkedIn verification
  {
    id: "video-zk-verification-linkedin",
    titleKey: "VIDEO_LINKEDIN_VERIFICATION",
    links: {
      en: "https://youtube.com/watch?v=OH6oCeLxxAA",
      pt: "https://youtube.com/watch?v=I5J0Te7UZ2o",
      id: "https://youtube.com/watch?v=OH6oCeLxxAA",
      hi: "https://youtube.com/watch?v=0lV4hGSs-e8",
      es: "https://youtube.com/watch?v=_l-E7NWgZRA",
    },
    thumbnails: {
      en: ASSETS.IMAGES.THUMBNAILS.ZK_VERIFY_LINKEDIN,
      pt: ASSETS.IMAGES.THUMBNAILS.ZK_VERIFY_LINKEDIN_PT,
      es: ASSETS.IMAGES.THUMBNAILS.ZK_VERIFY_LINKEDIN_ES,
    },
  },
  // New: Funds Recovery
  {
    id: "video-funds-recovery",
    titleKey: "VIDEO_FUNDS_RECOVERY",
    links: {
      en: "https://www.youtube.com/watch?v=jyDLUi9tc3Y",
      pt: "https://youtube.com/watch?v=qWd9DaQbpaE",
      id: "https://www.youtube.com/watch?v=jyDLUi9tc3Y",
      hi: "https://youtube.com/watch?v=MYbRQ0tHLgo",
      es: "https://youtube.com/watch?v=vWzUnuo4NV4",
    },
    thumbnails: {
      en: ASSETS.IMAGES.THUMBNAILS.RECOVER_UNSUPPORTED_TOKEN_DEPOSIT,
      pt: ASSETS.IMAGES.THUMBNAILS.RECOVER_UNSUPPORTED_TOKEN_DEPOSIT_PT,
      es: ASSETS.IMAGES.THUMBNAILS.RECOVER_UNSUPPORTED_TOKEN_DEPOSIT_ES,
    },
  },
];

export const getFAQById = (id: string): FAQ | undefined => {
  return ALL_FAQS.find((faq) => faq.id === id);
};

export const getFAQsByIds = (ids: string[]): FAQ[] => {
  return ids
    .map((id) => getFAQById(id))
    .filter((faq): faq is FAQ => faq !== undefined);
};

export const getSupportPageFAQs = (pageTitle: SupportPageTitle): FAQ[] => {
  return getFAQsByIds(SUPPORT_PAGE_CONTENT[pageTitle].faqIds);
};

export const getVideoGuideById = (id: string): VideoGuide | undefined => {
  return ALL_VIDEO_GUIDES.find((video) => video.id === id);
};

export const getVideoGuidesByIds = (ids: string[]): VideoGuide[] => {
  return ids
    .map((id) => getVideoGuideById(id))
    .filter((video): video is VideoGuide => video !== undefined);
};

export const getSupportPageVideoGuides = (
  pageTitle: SupportPageTitle,
): VideoGuide[] => {
  if (pageTitle === SUPPORT_PAGE_TITLES.GENERAL) {
    return ALL_VIDEO_GUIDES;
  }
  return getVideoGuidesByIds(SUPPORT_PAGE_CONTENT[pageTitle].videoGuideIds);
};

export const getPageFAQs = (pageKey: keyof typeof FAQ_ON_PAGES): FAQ[] => {
  const faqIds = FAQ_ON_PAGES[pageKey].faqIds;
  return getFAQsByIds(faqIds);
};

export const getPageFAQIds = (pageKey: keyof typeof FAQ_ON_PAGES): string[] => {
  return FAQ_ON_PAGES[pageKey].faqIds;
};
