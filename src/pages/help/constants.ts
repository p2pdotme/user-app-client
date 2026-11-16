import { INTERNAL_HREFS } from "@/lib/constants";

export interface FAQ {
  id: string;
  questionKey: string;
  answerKey: string;
  excludedFrom?: string[];
  onlyForCurrencies?: string[];
  /** Optional in-app route rendered as a link below the answer. */
  linkHref?: string;
  /** i18n key for the link label; required when linkHref is set. */
  linkLabelKey?: string;
}

export interface SupportPageSection {
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
    faqIds: [
      "getting-started-10", // What is USDC, and what is the Base network?
      "getting-started-1", // Why can't I send messages in the P2P.me Telegram group?
      "getting-started-2", // How do I move USDC between an exchange (like Binance) and P2P.me?
      "getting-started-3", // How do I buy USDC with my local currency?
      "getting-started-11", // Why can't I place a buy order?
      "getting-started-4", // Which QR codes can I pay with Scan & Pay?
      "getting-started-5", // How do I sell USDC and get paid to my bank or payment app?
      "transactions-1", // Where can I see my orders?
      "getting-started-7", // How do I increase my limits?
      "getting-started-8", // How can I earn with P2P.me?
      "getting-started-9", // How do I pay a shop with Scan & Pay?
    ],
  },
  [SUPPORT_PAGE_TITLES.GENERAL]: {
    faqIds: [
      "general-1", // What is P2P.me?
      "getting-started-10", // What is USDC, and what is the Base network?
      "general-2", // Is P2P.me safe to use?
      "general-3", // Will P2P.me share my data with the government?
      "general-4", // Which coins and networks does P2P.me support?
      "general-5", // Do I need to verify my ID (KYC)?
      "general-7", // How does P2P.me keep my orders safe?
      "general-8", // What is "zero-knowledge" (zk) verification?
      "general-9", // How are merchants selected on P2P.me?
      "general-10", // What fees does P2P.me charge?
      "general-11", // The app won't load in my region. What can I do?
      "general-12", // Can I use P2P.me for everyday payments?
      "general-14", // My bank account was frozen after a P2P.me order. What do I do?
      "general-15", // How can I avoid a bank account freeze?
      "general-16", // Do I have to link my social accounts?
      "general-17", // Why is the sell price sometimes lower?
      "general-18", // Does P2P.me handle my taxes?
      "general-19", // Does P2P.me follow anti-money-laundering (AML) rules?
      "general-20", // Who is building and maintaining P2P.me?
      "general-21", // What is Bank Freeze Protection (India)?
      "general-22", // How do I calculate tax on my P2P.me orders?
    ],
  },
  [SUPPORT_PAGE_TITLES.MY_LIMITS]: {
    faqIds: [
      "limits-1", // What are the starting limits?
      "getting-started-11", // Why can't I place a buy order?
      "limits-2", // Where can I check my transaction limits?
      "limits-3", // Are buy and sell limits tracked separately?
      "limits-4", // Can I lose my increased limits?
      "limits-5", // How do I verify a social account to raise my limits?
      "limits-9", // I verified, but my limit didn't go up. Why?
      "limits-10", // What does "Finish verification" mean?
      "limits-7", // Why do I see "You do not meet the eligibility criteria" when I verify?
      "limits-8", // What will happen if I'm found doing fraudulent activity?
    ],
  },
  [SUPPORT_PAGE_TITLES.REFER_AND_EARN]: {
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
    faqIds: [
      "transactions-1", // Where can I see my orders?
      "transactions-2", // What are the different statuses of an order?
      "transactions-11", // Why can't I cancel while waiting for a merchant?
      "transactions-3", // Can I download my transaction history?
      "transactions-4", // What is a dispute?
      "transactions-5", // When should I raise a dispute for a Buy order?
      "transactions-10", // I paid, but my buy order was cancelled or the timer ran out. What now?
      "transactions-6", // When should I raise a dispute for a Sell order?
      "transactions-7", // How can I raise a dispute?
      "transactions-8", // What happens if I raise a false dispute?
      "transactions-9", // The shopkeeper is asking to see the payment. What should I do?
    ],
  },
  [SUPPORT_PAGE_TITLES.DEPOSITS_WITHDRAWALS]: {
    faqIds: [
      "deposits-withdrawals-1", // How can I deposit USDC into my P2P.me wallet?
      "deposits-withdrawals-2", // Do I pay network fees (gas)?
      "deposits-withdrawals-3", // What networks are supported for deposits?
      "deposits-withdrawals-4", // My cross-chain deposit or withdrawal is stuck. What do I do?
      "deposits-withdrawals-5", // How do I withdraw funds from P2P.me?
      "deposits-withdrawals-8", // Where can I find my deposit and withdrawal history?
      "deposits-withdrawals-9", // Are there any withdrawal limits?
      "deposits-withdrawals-10", // What should I do if my withdrawal hasn't arrived?
      "deposits-withdrawals-11", // I sent funds on the wrong network. Can I get them back?
      "deposits-withdrawals-12", // How do I recover funds using my private key?
    ],
  },
};

export const FAQ_ON_PAGES = {
  LIMITS_PAGE: {
    faqIds: [
      "limits-1", // What are the starting limits?
      "limits-9", // I verified, but my limit didn't go up. Why?
      "limits-3", // Are buy and sell limits tracked separately?
      "limits-4", // Can I lose my increased limits?
      "limits-8", // What will happen if I'm found doing fraudulent activity?
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
      "transactions-10", // I paid, but my buy order was cancelled or the timer ran out. What now?
      "transactions-7", // How can I raise a dispute?
      "transactions-8", // What happens if I raise a false dispute?
      "transactions-9", // The shopkeeper is asking to see the payment. What should I do?
      "general-21", // What is Bank Freeze Protection (India)?
    ],
  },

  PAY_COMPLETED_PAGE: {
    faqIds: [
      "transactions-9", // The shopkeeper is asking to see the payment. What should I do?
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
    id: "general-22",
    questionKey: "FAQ_HOW_TO_CALCULATE_TAX_INDIA",
    answerKey: "FAQ_HOW_TO_CALCULATE_TAX_INDIA_ANSWER",
    onlyForCurrencies: ["INR"],
    linkHref: INTERNAL_HREFS.TAX,
    linkLabelKey: "TAX_REPORT_HELP_CTA",
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
    id: "limits-7",
    questionKey: "FAQ_WHY_SEEING_DIDNT_MEET_ELIGIBLE_CRITERIA",
    answerKey: "FAQ_WHY_SEEING_DIDNT_MEET_ELIGIBLE_CRITERIA_ANSWER",
  },
  {
    id: "limits-8",
    questionKey: "FAQ_WHAT_HAPPENS_IF_FRAUDULENT_ACTIVITY",
    answerKey: "FAQ_WHAT_HAPPENS_IF_FRAUDULENT_ACTIVITY_ANSWER",
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
  {
    id: "deposits-withdrawals-12",
    questionKey: "FAQ_RECOVER_FUNDS_PRIVATE_KEY",
    answerKey: "FAQ_RECOVER_FUNDS_PRIVATE_KEY_ANSWER",
    linkHref: INTERNAL_HREFS.RECOVER,
    linkLabelKey: "RECOVER_WALLET",
  },
  {
    id: "getting-started-10",
    questionKey: "FAQ_WHAT_IS_USDC",
    answerKey: "FAQ_WHAT_IS_USDC_ANSWER",
  },
  {
    id: "getting-started-11",
    questionKey: "FAQ_WHY_CANT_I_BUY",
    answerKey: "FAQ_WHY_CANT_I_BUY_ANSWER",
  },
  {
    id: "transactions-10",
    questionKey: "FAQ_PAID_BUT_ORDER_CANCELLED",
    answerKey: "FAQ_PAID_BUT_ORDER_CANCELLED_ANSWER",
  },
  {
    id: "transactions-11",
    questionKey: "FAQ_CANT_CANCEL_WAITING_MERCHANT",
    answerKey: "FAQ_CANT_CANCEL_WAITING_MERCHANT_ANSWER",
  },
  {
    id: "limits-9",
    questionKey: "FAQ_VERIFIED_LIMIT_NOT_CHANGED",
    answerKey: "FAQ_VERIFIED_LIMIT_NOT_CHANGED_ANSWER",
  },
  {
    id: "limits-10",
    questionKey: "FAQ_FINISH_VERIFICATION",
    answerKey: "FAQ_FINISH_VERIFICATION_ANSWER",
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

export const getPageFAQs = (pageKey: keyof typeof FAQ_ON_PAGES): FAQ[] => {
  const faqIds = FAQ_ON_PAGES[pageKey].faqIds;
  return getFAQsByIds(faqIds);
};
