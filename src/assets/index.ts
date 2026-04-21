// Base URL for assets in the CDN bucket
const BASE_CDN_URL =
  "https://firebasestorage.googleapis.com/v0/b/p2px-421205.appspot.com/o/user-app%2Fv2";

// Helper function to create CDN URLs with name as alt
const createAssetUrl = (path: string) =>
  `${BASE_CDN_URL}%2F${encodeURIComponent(path)}?alt=media`;

// ANIMATIONS (CDN)
const CANCELLED = createAssetUrl("animations/cancelled.lottie");
const COMPLETED = createAssetUrl("animations/completed.lottie");
const GIFT_BOX = createAssetUrl("animations/gift-box.lottie");
const ORDER_ASSIGNMENT = createAssetUrl("animations/order-assignment.lottie");
const VERIFIED = createAssetUrl("animations/verified.lottie");
const WAITING_TRANSFER = createAssetUrl("animations/waiting-transfer.lottie");
// AUDIO (CDN)
const FAILED = createAssetUrl("audio/FAILED.mp3");
const QR_SCANNED = createAssetUrl("audio/QR_SCANNED.wav");
const SUCCESS = createAssetUrl("audio/SUCCESS.mp3");

import { ActionDeposit } from "./icons/action-deposit";
import { ActionSupport } from "./icons/action-support";
import { ActionWallet } from "./icons/action-wallet";
import { ActionWithdraw } from "./icons/action-withdraw";
import { Binance } from "./icons/binance";
import { Buy } from "./icons/buy";
import { DepositCross } from "./icons/deposit-cross";
import { DepositDirect } from "./icons/deposit-direct";
import { Discord } from "./icons/discord";
import { Facebook } from "./icons/facebook";
import { Github } from "./icons/github";
import { GoPay } from "./icons/gopay";
import { Instagram } from "./icons/instagram";
import { Linkedin } from "./icons/linkedin";
// ICONS
import { Logo } from "./icons/logo";
import { NetworkArbitrum } from "./icons/network-arbitrum";
import { NetworkBase } from "./icons/network-base";
import { NetworkBsc } from "./icons/network-bsc";
import { NetworkEthereum } from "./icons/network-ethereum";
import { NetworkOptimism } from "./icons/network-optimism";
import { NetworkPolygon } from "./icons/network-polygon";
import { NetworkSolana } from "./icons/network-solana";
import { Pay } from "./icons/pay";

const RANGO_LOGO = createAssetUrl("icons/rango-logo.png");

import { ReferralClaimableBadge } from "./icons/referral-claimable-badge";
import { Sell } from "./icons/sell";
import { SidebarLimits } from "./icons/sidebar-limits";
import { SidebarReferral } from "./icons/sidebar-referral";
import { SidebarTransactions } from "./icons/sidebar-transactions";
import { SwapRouteRightArrow } from "./icons/swap-route-right-arrow";
import { Telegram } from "./icons/telegram";
import { TokenSolana } from "./icons/token-solana";
import { Twitter } from "./icons/twitter";
import { Usdc } from "./icons/usdc";
import { WithdrawCross } from "./icons/withdraw-cross";
import { WithdrawDirect } from "./icons/withdraw-direct";
import { ZkPassport } from "./icons/zk-passport";

const APP_CLIP_CLICK_HERE = createAssetUrl("images/appclip-click-here.png");
const BUY_MERCHANT_ASSIGNMENT = createAssetUrl(
  "images/buy-merchant-assignment.png",
);
// IMAGES (CDN except TSX components)
const COINSME_BANNER_LIGHT = createAssetUrl("images/coinsme-banner-dark.svg");
const COINSME_BANNER_DARK = createAssetUrl("images/coinsme-banner-light.svg");
const HOME_GUIDE_BANNER_BG = createAssetUrl("images/home-guide-banner-bg.png");
const TGE_BANNER = createAssetUrl("images/p2ptgebannerapp.png");
const P2P_FOUNDATION_LOGO = createAssetUrl("images/p2pfoundationlogo.svg");
const INSTANT_APP_CLICK_HERE = createAssetUrl(
  "images/instant-app-click-here-latest.png",
);

import { LoginPoster } from "./images/login-poster";

const MASCOT_404 = createAssetUrl("images/mascot-404.png");
const MASCOT_MAINTENANCE = createAssetUrl("images/mascot-maintenance.png");
const REFERRAL_BADGE = createAssetUrl("images/referral-badge.svg");
const REFERRAL_GIFTS = createAssetUrl("images/referral-gifts.svg");
const THUMBNAIL_APP_TOUR = createAssetUrl("images/thumbnails/app-tour.png");

const THUMBNAIL_CLAIM_REFERRAL_REWARDS = createAssetUrl(
  "images/thumbnails/claim-referral-rewards.png",
);
const THUMBNAIL_CLAIM_REFERRAL_REWARDS_PT = createAssetUrl(
  "images/thumbnails/claim-referral-rewards-pt.png",
);
const THUMBNAIL_CROSS_CHAIN_DEPOSIT = createAssetUrl(
  "images/thumbnails/cross-chain-deposit.png",
);
const THUMBNAIL_CROSS_CHAIN_DEPOSIT_PT = createAssetUrl(
  "images/thumbnails/cross-chain-deposit-pt.png",
);
const THUMBNAIL_CROSS_CHAIN_WITHDRAWAL = createAssetUrl(
  "images/thumbnails/cross-chain-withdrawal.png",
);
const THUMBNAIL_CROSS_CHAIN_WITHDRAWAL_PT = createAssetUrl(
  "images/thumbnails/cross-chain-withdrawal-pt.png",
);
const THUMBNAIL_DEPOSIT_DIRECT = createAssetUrl(
  "images/thumbnails/deposit-direct.png",
);
const THUMBNAIL_DEPOSIT_DIRECT_PT = createAssetUrl(
  "images/thumbnails/deposit-direct-pt.png",
);
const THUMBNAIL_DEPOSIT_DIRECT_ES = createAssetUrl(
  "images/thumbnails/deposit-direct-es.png",
);
const THUMBNAIL_GENERATE_REFERRAL_LINK = createAssetUrl(
  "images/thumbnails/generate-referral-link.png",
);
const THUMBNAIL_GENERATE_REFERRAL_LINK_PT = createAssetUrl(
  "images/thumbnails/generate-referral-link-pt.png",
);
const THUMBNAIL_GENERATE_REFERRAL_LINK_ES = createAssetUrl(
  "images/thumbnails/generate-referral-link-es.png",
);
const THUMBNAIL_INCREASE_TRANSACTION_LIMITS = createAssetUrl(
  "images/thumbnails/increase-transaction-limits.png",
);
const THUMBNAIL_INCREASE_TRANSACTION_LIMITS_PT = createAssetUrl(
  "images/thumbnails/increase-transaction-limits-pt.png",
);
const THUMBNAIL_INCREASE_TRANSACTION_LIMITS_ES = createAssetUrl(
  "images/thumbnails/increase-transaction-limits-es.png",
);
const THUMBNAIL_PLACE_BUY_ORDER = createAssetUrl(
  "images/thumbnails/place-buy-order.png",
);
const THUMBNAIL_PLACE_BUY_ORDER_PT = createAssetUrl(
  "images/thumbnails/place-buy-order-pt.png",
);
const THUMBNAIL_PLACE_BUY_ORDER_ES = createAssetUrl(
  "images/thumbnails/place-buy-order-es.png",
);
const THUMBNAIL_PLACE_SELL_ORDER = createAssetUrl(
  "images/thumbnails/place-sell-order.png",
);
const THUMBNAIL_PLACE_SELL_ORDER_PT = createAssetUrl(
  "images/thumbnails/place-sell-order-pt.png",
);
const THUMBNAIL_PLACE_SELL_ORDER_ES = createAssetUrl(
  "images/thumbnails/place-sell-order-es.png",
);
const THUMBNAIL_RAISE_DISPUTE_ON_ORDER = createAssetUrl(
  "images/thumbnails/raise-dispute-on-order.png",
);
const THUMBNAIL_RAISE_DISPUTE_ON_ORDER_PT = createAssetUrl(
  "images/thumbnails/raise-dispute-on-order-pt.png",
);
const THUMBNAIL_RAISE_DISPUTE_ON_ORDER_ES = createAssetUrl(
  "images/thumbnails/raise-dispute-on-order-es.png",
);
const THUMBNAIL_RAISE_RANGO_SUPPORT_TICKET = createAssetUrl(
  "images/thumbnails/raise-rango-support-ticket.png",
);
const THUMBNAIL_RAISE_RANGO_SUPPORT_TICKET_PT = createAssetUrl(
  "images/thumbnails/raise-rango-support-ticket-pt.png",
);
const THUMBNAIL_RAISE_RANGO_SUPPORT_TICKET_ES = createAssetUrl(
  "images/thumbnails/raise-rango-support-ticket-es.png",
);
const THUMBNAIL_RECOVER_UNSUPPORTED_TOKEN_DEPOSIT = createAssetUrl(
  "images/thumbnails/recover-unsupported-token-deposit.png",
);
const THUMBNAIL_RECOVER_UNSUPPORTED_TOKEN_DEPOSIT_PT = createAssetUrl(
  "images/thumbnails/recover-unsupported-token-deposit-pt.png",
);
const THUMBNAIL_RECOVER_UNSUPPORTED_TOKEN_DEPOSIT_ES = createAssetUrl(
  "images/thumbnails/recover-unsupported-token-deposit-es.png",
);
const THUMBNAIL_SCAN_AND_PAY_ORDER = createAssetUrl(
  "images/thumbnails/scan-and-pay-order.png",
);
const THUMBNAIL_SCAN_AND_PAY_ORDER_PT = createAssetUrl(
  "images/thumbnails/scan-and-pay-order-pt.png",
);
const THUMBNAIL_SCAN_AND_PAY_ORDER_ES = createAssetUrl(
  "images/thumbnails/scan-and-pay-order-es.png",
);
const THUMBNAIL_WITHDRAW_DIRECT = createAssetUrl(
  "images/thumbnails/withdraw-direct.png",
);
const THUMBNAIL_WITHDRAW_DIRECT_PT = createAssetUrl(
  "images/thumbnails/withdraw-direct-pt.png",
);
const THUMBNAIL_WITHDRAW_DIRECT_ES = createAssetUrl(
  "images/thumbnails/withdraw-direct-es.png",
);
const THUMBNAIL_ZK_VERIFY_AADHAAR = createAssetUrl(
  "images/thumbnails/zk-verify-aadhaar.png",
);
const THUMBNAIL_ZK_VERIFY_GITHUB = createAssetUrl(
  "images/thumbnails/zk-verify-github.png",
);
const THUMBNAIL_ZK_VERIFY_GITHUB_PT = createAssetUrl(
  "images/thumbnails/zk-verify-github-pt.png",
);
const THUMBNAIL_ZK_VERIFY_GITHUB_ES = createAssetUrl(
  "images/thumbnails/zk-verify-github-es.png",
);
const THUMBNAIL_ZK_VERIFY_INSTAGRAM = createAssetUrl(
  "images/thumbnails/zk-verify-instagram.png",
);
const THUMBNAIL_ZK_VERIFY_INSTAGRAM_PT = createAssetUrl(
  "images/thumbnails/zk-verify-instagram-pt.png",
);
const THUMBNAIL_ZK_VERIFY_INSTAGRAM_ES = createAssetUrl(
  "images/thumbnails/zk-verify-instagram-es.png",
);
const THUMBNAIL_ZK_VERIFY_LINKEDIN = createAssetUrl(
  "images/thumbnails/zk-verify-linkedin.png",
);
const THUMBNAIL_ZK_VERIFY_LINKEDIN_PT = createAssetUrl(
  "images/thumbnails/zk-verify-linkedin-pt.png",
);
const THUMBNAIL_ZK_VERIFY_LINKEDIN_ES = createAssetUrl(
  "images/thumbnails/zk-verify-linkedin-es.png",
);
const THUMBNAIL_CROSS_CHAIN_DEPOSIT_ES = createAssetUrl(
  "images/thumbnails/cross-chain-deposit-es.png",
);
const THUMBNAIL_CROSS_CHAIN_WITHDRAWAL_ES = createAssetUrl(
  "images/thumbnails/cross-chain-withdrawal-es.png",
);
const THUMBNAIL_CLAIM_REFERRAL_REWARDS_ES = createAssetUrl(
  "images/thumbnails/claim-referral-rewards-es.png",
);

import { USDCFiatOverlapped } from "./images/usdc-fiat-overlapped";

const ASSETS = {
  ICONS: {
    Logo,
    ActionSupport,
    ActionDeposit,
    ActionWithdraw,
    ActionWallet,
    Sell,
    Buy,
    Pay,
    Usdc,
    ReferralClaimableBadge,
    Github,
    Instagram,
    Linkedin,
    Twitter,
    Telegram,
    Discord,
    Facebook,
    Binance,
    DepositDirect,
    DepositCross,
    WithdrawDirect,
    WithdrawCross,
    NetworkArbitrum,
    NetworkBsc,
    NetworkEthereum,
    NetworkOptimism,
    NetworkPolygon,
    NetworkSolana,
    NetworkBase,
    RANGO_LOGO,
    SwapRouteRightArrow,
    TokenSolana,
    SidebarLimits,
    SidebarTransactions,
    SidebarReferral,
    GoPay,
    ZkPassport,
  },
  IMAGES: {
    HOME_GUIDE_BANNER_BG,
    COINSME_BANNER_LIGHT,
    COINSME_BANNER_DARK,
    REFERRAL_BADGE,
    REFERRAL_GIFTS,
    MASCOT_404,
    MASCOT_MAINTENANCE,
    USDCFiatOverlapped,
    BUY_MERCHANT_ASSIGNMENT,
    LoginPoster,
    APP_CLIP_CLICK_HERE,
    INSTANT_APP_CLICK_HERE,
    TGE_BANNER,
    P2P_FOUNDATION_LOGO,
    THUMBNAILS: {
      RAISE_RANGO_SUPPORT_TICKET: THUMBNAIL_RAISE_RANGO_SUPPORT_TICKET,
      RAISE_RANGO_SUPPORT_TICKET_PT: THUMBNAIL_RAISE_RANGO_SUPPORT_TICKET_PT,
      RAISE_RANGO_SUPPORT_TICKET_ES: THUMBNAIL_RAISE_RANGO_SUPPORT_TICKET_ES,
      INCREASE_TRANSACTION_LIMITS: THUMBNAIL_INCREASE_TRANSACTION_LIMITS,
      INCREASE_TRANSACTION_LIMITS_PT: THUMBNAIL_INCREASE_TRANSACTION_LIMITS_PT,
      INCREASE_TRANSACTION_LIMITS_ES: THUMBNAIL_INCREASE_TRANSACTION_LIMITS_ES,
      PLACE_BUY_ORDER: THUMBNAIL_PLACE_BUY_ORDER,
      PLACE_BUY_ORDER_PT: THUMBNAIL_PLACE_BUY_ORDER_PT,
      PLACE_BUY_ORDER_ES: THUMBNAIL_PLACE_BUY_ORDER_ES,
      RECOVER_UNSUPPORTED_TOKEN_DEPOSIT:
        THUMBNAIL_RECOVER_UNSUPPORTED_TOKEN_DEPOSIT,
      RECOVER_UNSUPPORTED_TOKEN_DEPOSIT_PT:
        THUMBNAIL_RECOVER_UNSUPPORTED_TOKEN_DEPOSIT_PT,
      RECOVER_UNSUPPORTED_TOKEN_DEPOSIT_ES:
        THUMBNAIL_RECOVER_UNSUPPORTED_TOKEN_DEPOSIT_ES,
      ZK_VERIFY_GITHUB: THUMBNAIL_ZK_VERIFY_GITHUB,
      ZK_VERIFY_GITHUB_PT: THUMBNAIL_ZK_VERIFY_GITHUB_PT,
      ZK_VERIFY_GITHUB_ES: THUMBNAIL_ZK_VERIFY_GITHUB_ES,
      RAISE_DISPUTE_ON_ORDER: THUMBNAIL_RAISE_DISPUTE_ON_ORDER,
      RAISE_DISPUTE_ON_ORDER_PT: THUMBNAIL_RAISE_DISPUTE_ON_ORDER_PT,
      RAISE_DISPUTE_ON_ORDER_ES: THUMBNAIL_RAISE_DISPUTE_ON_ORDER_ES,
      PLACE_SELL_ORDER: THUMBNAIL_PLACE_SELL_ORDER,
      PLACE_SELL_ORDER_PT: THUMBNAIL_PLACE_SELL_ORDER_PT,
      PLACE_SELL_ORDER_ES: THUMBNAIL_PLACE_SELL_ORDER_ES,
      CROSS_CHAIN_DEPOSIT: THUMBNAIL_CROSS_CHAIN_DEPOSIT,
      CROSS_CHAIN_DEPOSIT_PT: THUMBNAIL_CROSS_CHAIN_DEPOSIT_PT,
      CROSS_CHAIN_DEPOSIT_ES: THUMBNAIL_CROSS_CHAIN_DEPOSIT_ES,
      ZK_VERIFY_AADHAAR: THUMBNAIL_ZK_VERIFY_AADHAAR,
      SCAN_AND_PAY_ORDER: THUMBNAIL_SCAN_AND_PAY_ORDER,
      SCAN_AND_PAY_ORDER_PT: THUMBNAIL_SCAN_AND_PAY_ORDER_PT,
      SCAN_AND_PAY_ORDER_ES: THUMBNAIL_SCAN_AND_PAY_ORDER_ES,
      ZK_VERIFY_LINKEDIN: THUMBNAIL_ZK_VERIFY_LINKEDIN,
      ZK_VERIFY_LINKEDIN_PT: THUMBNAIL_ZK_VERIFY_LINKEDIN_PT,
      ZK_VERIFY_LINKEDIN_ES: THUMBNAIL_ZK_VERIFY_LINKEDIN_ES,
      ZK_VERIFY_INSTAGRAM: THUMBNAIL_ZK_VERIFY_INSTAGRAM,
      ZK_VERIFY_INSTAGRAM_PT: THUMBNAIL_ZK_VERIFY_INSTAGRAM_PT,
      ZK_VERIFY_INSTAGRAM_ES: THUMBNAIL_ZK_VERIFY_INSTAGRAM_ES,
      GENERATE_REFERRAL_LINK: THUMBNAIL_GENERATE_REFERRAL_LINK,
      GENERATE_REFERRAL_LINK_PT: THUMBNAIL_GENERATE_REFERRAL_LINK_PT,
      GENERATE_REFERRAL_LINK_ES: THUMBNAIL_GENERATE_REFERRAL_LINK_ES,
      WITHDRAW_DIRECT: THUMBNAIL_WITHDRAW_DIRECT,
      WITHDRAW_DIRECT_PT: THUMBNAIL_WITHDRAW_DIRECT_PT,
      WITHDRAW_DIRECT_ES: THUMBNAIL_WITHDRAW_DIRECT_ES,
      DEPOSIT_DIRECT: THUMBNAIL_DEPOSIT_DIRECT,
      DEPOSIT_DIRECT_PT: THUMBNAIL_DEPOSIT_DIRECT_PT,
      DEPOSIT_DIRECT_ES: THUMBNAIL_DEPOSIT_DIRECT_ES,
      CROSS_CHAIN_WITHDRAWAL: THUMBNAIL_CROSS_CHAIN_WITHDRAWAL,
      CROSS_CHAIN_WITHDRAWAL_PT: THUMBNAIL_CROSS_CHAIN_WITHDRAWAL_PT,
      CROSS_CHAIN_WITHDRAWAL_ES: THUMBNAIL_CROSS_CHAIN_WITHDRAWAL_ES,
      CLAIM_REFERRAL_REWARDS: THUMBNAIL_CLAIM_REFERRAL_REWARDS,
      CLAIM_REFERRAL_REWARDS_PT: THUMBNAIL_CLAIM_REFERRAL_REWARDS_PT,
      CLAIM_REFERRAL_REWARDS_ES: THUMBNAIL_CLAIM_REFERRAL_REWARDS_ES,
      APP_TOUR: THUMBNAIL_APP_TOUR,
    },
  },
  ANIMATIONS: {
    ORDER_ASSIGNMENT,
    VERIFIED,
    COMPLETED,
    CANCELLED,
    GIFT_BOX,
    WAITING_TRANSFER,
  },
  AUDIO: {
    QR_SCANNED,
    SUCCESS,
    FAILED,
  },
} as const;

export const CDN_ASSET_URLS = [
  // Animations
  ORDER_ASSIGNMENT,
  VERIFIED,
  COMPLETED,
  CANCELLED,
  GIFT_BOX,
  WAITING_TRANSFER,
  // Audio
  QR_SCANNED,
  SUCCESS,
  FAILED,
  // Icons (non-TSX)
  RANGO_LOGO,
  // Images
  HOME_GUIDE_BANNER_BG,
  COINSME_BANNER_LIGHT,
  COINSME_BANNER_DARK,
  REFERRAL_BADGE,
  REFERRAL_GIFTS,
  MASCOT_404,
  MASCOT_MAINTENANCE,
  BUY_MERCHANT_ASSIGNMENT,
  APP_CLIP_CLICK_HERE,
  INSTANT_APP_CLICK_HERE,
  TGE_BANNER,
  P2P_FOUNDATION_LOGO,
  // Thumbnails
  THUMBNAIL_RAISE_RANGO_SUPPORT_TICKET,
  THUMBNAIL_RAISE_RANGO_SUPPORT_TICKET_PT,
  THUMBNAIL_RAISE_RANGO_SUPPORT_TICKET_ES,
  THUMBNAIL_INCREASE_TRANSACTION_LIMITS,
  THUMBNAIL_INCREASE_TRANSACTION_LIMITS_PT,
  THUMBNAIL_INCREASE_TRANSACTION_LIMITS_ES,
  THUMBNAIL_PLACE_BUY_ORDER,
  THUMBNAIL_PLACE_BUY_ORDER_PT,
  THUMBNAIL_PLACE_BUY_ORDER_ES,
  THUMBNAIL_RECOVER_UNSUPPORTED_TOKEN_DEPOSIT,
  THUMBNAIL_RECOVER_UNSUPPORTED_TOKEN_DEPOSIT_PT,
  THUMBNAIL_RECOVER_UNSUPPORTED_TOKEN_DEPOSIT_ES,
  THUMBNAIL_ZK_VERIFY_GITHUB,
  THUMBNAIL_ZK_VERIFY_GITHUB_PT,
  THUMBNAIL_ZK_VERIFY_GITHUB_ES,
  THUMBNAIL_RAISE_DISPUTE_ON_ORDER,
  THUMBNAIL_RAISE_DISPUTE_ON_ORDER_PT,
  THUMBNAIL_RAISE_DISPUTE_ON_ORDER_ES,
  THUMBNAIL_PLACE_SELL_ORDER,
  THUMBNAIL_PLACE_SELL_ORDER_PT,
  THUMBNAIL_PLACE_SELL_ORDER_ES,
  THUMBNAIL_CROSS_CHAIN_DEPOSIT,
  THUMBNAIL_CROSS_CHAIN_DEPOSIT_PT,
  THUMBNAIL_CROSS_CHAIN_DEPOSIT_ES,
  THUMBNAIL_ZK_VERIFY_AADHAAR,
  THUMBNAIL_SCAN_AND_PAY_ORDER,
  THUMBNAIL_SCAN_AND_PAY_ORDER_PT,
  THUMBNAIL_SCAN_AND_PAY_ORDER_ES,
  THUMBNAIL_ZK_VERIFY_LINKEDIN,
  THUMBNAIL_ZK_VERIFY_LINKEDIN_PT,
  THUMBNAIL_ZK_VERIFY_LINKEDIN_ES,
  THUMBNAIL_ZK_VERIFY_INSTAGRAM,
  THUMBNAIL_ZK_VERIFY_INSTAGRAM_PT,
  THUMBNAIL_ZK_VERIFY_INSTAGRAM_ES,
  THUMBNAIL_GENERATE_REFERRAL_LINK,
  THUMBNAIL_GENERATE_REFERRAL_LINK_PT,
  THUMBNAIL_GENERATE_REFERRAL_LINK_ES,
  THUMBNAIL_WITHDRAW_DIRECT,
  THUMBNAIL_WITHDRAW_DIRECT_PT,
  THUMBNAIL_WITHDRAW_DIRECT_ES,
  THUMBNAIL_DEPOSIT_DIRECT,
  THUMBNAIL_DEPOSIT_DIRECT_PT,
  THUMBNAIL_DEPOSIT_DIRECT_ES,
  THUMBNAIL_CROSS_CHAIN_WITHDRAWAL,
  THUMBNAIL_CROSS_CHAIN_WITHDRAWAL_PT,
  THUMBNAIL_CROSS_CHAIN_WITHDRAWAL_ES,
  THUMBNAIL_CLAIM_REFERRAL_REWARDS,
  THUMBNAIL_CLAIM_REFERRAL_REWARDS_PT,
  THUMBNAIL_CLAIM_REFERRAL_REWARDS_ES,
  THUMBNAIL_APP_TOUR,
] as const;

export default ASSETS;
