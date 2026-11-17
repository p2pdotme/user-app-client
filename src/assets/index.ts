// Base URL for assets in the CDN bucket
const BASE_CDN_URL =
  "https://pub-dd70195dd602478f96c1851a4b192e25.r2.dev/user-app/v2";

const createAssetUrl = (path: string) => `${BASE_CDN_URL}/${path}`;

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
// ICONS
import { EcosystemLogo } from "./icons/ecosystem-logo";
import { Facebook } from "./icons/facebook";
import { Github } from "./icons/github";
import { GoPay } from "./icons/gopay";
import { Instagram } from "./icons/instagram";
import { Linkedin } from "./icons/linkedin";
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

// iOS now requires installing the Reclaim Verifier app (App Clip removed).
const IOS_RECLAIM_VERIFIER = createAssetUrl("images/ios-reclaim-verifier.png");
const BUY_MERCHANT_ASSIGNMENT = createAssetUrl(
  "images/buy-merchant-assignment.png",
);
// IMAGES (CDN except TSX components)
const COINSME_BANNER_LIGHT = createAssetUrl("images/coinsme-banner-dark.svg");
const COINSME_BANNER_DARK = createAssetUrl("images/coinsme-banner-light.svg");
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

import { USDCFiatOverlapped } from "./images/usdc-fiat-overlapped";

const ASSETS = {
  ICONS: {
    Logo,
    EcosystemLogo,
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
  },
  IMAGES: {
    COINSME_BANNER_LIGHT,
    COINSME_BANNER_DARK,
    REFERRAL_BADGE,
    REFERRAL_GIFTS,
    MASCOT_404,
    MASCOT_MAINTENANCE,
    USDCFiatOverlapped,
    BUY_MERCHANT_ASSIGNMENT,
    LoginPoster,
    IOS_RECLAIM_VERIFIER,
    INSTANT_APP_CLICK_HERE,
    TGE_BANNER,
    P2P_FOUNDATION_LOGO,
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
  COINSME_BANNER_LIGHT,
  COINSME_BANNER_DARK,
  REFERRAL_BADGE,
  REFERRAL_GIFTS,
  MASCOT_404,
  MASCOT_MAINTENANCE,
  BUY_MERCHANT_ASSIGNMENT,
  INSTANT_APP_CLICK_HERE,
  TGE_BANNER,
  P2P_FOUNDATION_LOGO,
] as const;

export default ASSETS;
