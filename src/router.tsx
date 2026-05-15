import { Loader2 } from "lucide-react";
import { lazy, Suspense } from "react";
import { useTranslation } from "react-i18next";
import { Route, Routes } from "react-router";
import { DevRouteGuard, PullToRefresh } from "@/components";
import { INTERNAL_HREFS } from "@/lib/constants";

// Lazy load components for code splitting with correct module structure
const HomeScreen = lazy(() =>
  import("@/pages/homescreen").then((module) => ({
    default: module.HomeScreen,
  })),
);
const Referral = lazy(() =>
  import("@/pages/referral").then((module) => ({
    default: module.Referral,
  })),
);
const Transactions = lazy(() =>
  import("@/pages/transactions").then((module) => ({
    default: module.Transactions,
  })),
);
const Limits = lazy(() =>
  import("@/pages/limits").then((module) => ({
    default: module.Limits,
  })),
);
const Deposit = lazy(() =>
  import("@/pages/deposit").then((module) => ({
    default: module.Deposit,
  })),
);

const P2pBridge = lazy(() =>
  import("@/pages/p2p-bridge").then((module) => ({
    default: module.P2pBridge,
  })),
);
const Withdraw = lazy(() =>
  import("@/pages/withdraw").then((module) => ({
    default: module.Withdraw,
  })),
);

const Buy = lazy(() =>
  import("@/pages/buy").then((module) => ({
    default: module.Buy,
  })),
);
const BuyPreview = lazy(() =>
  import("@/pages/buy/preview").then((module) => ({
    default: module.BuyPreview,
  })),
);
const Sell = lazy(() =>
  import("@/pages/sell").then((module) => ({
    default: module.Sell,
  })),
);
const SellQuiz = lazy(() =>
  import("@/pages/sell/quiz").then((module) => ({
    default: module.SellQuiz,
  })),
);
const SellPreview = lazy(() =>
  import("@/pages/sell/preview").then((module) => ({
    default: module.SellPreview,
  })),
);
const Pay = lazy(() =>
  import("@/pages/pay").then((module) => ({
    default: module.Pay,
  })),
);

const Order = lazy(() =>
  import("@/pages/order").then((module) => ({
    default: module.Order,
  })),
);

const Settings = lazy(() =>
  import("@/pages/settings").then((module) => ({
    default: module.Settings,
  })),
);

const Maintenance = lazy(() =>
  import("@/pages/maintenance").then((module) => ({
    default: module.Maintenance,
  })),
);

const Help = lazy(() =>
  import("@/pages/help").then((module) => ({
    default: module.Help,
  })),
);

const FAQsSearch = lazy(() =>
  import("@/pages/help/faqs-search").then((module) => ({
    default: module.FAQsSearch,
  })),
);

const HelpfulVideoGuides = lazy(() =>
  import("@/pages/help/helpful-video-guides").then((module) => ({
    default: module.HelpfulVideoGuides,
  })),
);

// Dev pages (development only)
const DevDashboard = lazy(() =>
  import("@/pages/dev").then((module) => ({
    default: module.DevDashboard,
  })),
);
const DevHapticsDemo = lazy(() =>
  import("@/pages/dev/haptics").then((module) => ({
    default: module.HapticsDemo,
  })),
);
const DevSoundsDemo = lazy(() =>
  import("@/pages/dev/sounds").then((module) => ({
    default: module.SoundsDemo,
  })),
);

const DevToastsDemo = lazy(() =>
  import("@/pages/dev/toasts").then((module) => ({
    default: module.ToastsDemo,
  })),
);

const ScannerDevDashboard = lazy(() =>
  import("@/pages/dev/scanner").then((module) => ({
    default: module.ScannerDevDashboard,
  })),
);

const DevAnimationsDemo = lazy(() =>
  import("@/pages/dev/animations").then((module) => ({
    default: module.AnimationsDemo,
  })),
);

const SupportPageWrapper = lazy(() =>
  import("@/pages/help/support-page-router").then((module) => ({
    default: module.SupportPageWrapper,
  })),
);

const NotFound = lazy(() =>
  import("@/pages/404").then((module) => ({ default: module.NotFound })),
);

const Login = lazy(() =>
  import("@/pages/login").then((module) => ({ default: module.LoginPage })),
);

const Notification = lazy(() =>
  import("@/pages/notification").then((module) => ({
    default: module.NotificationPage,
  })),
);

export function Router() {
  const { t } = useTranslation();
  return (
    <Suspense
      fallback={
        <div className="flex h-screen w-full flex-col items-center justify-center gap-2">
          <Loader2 className="size-16 animate-spin text-primary" />
          <p className="text-lg text-muted-foreground">{t("LOADING")}</p>
        </div>
      }>
      <Routes>
        <Route
          path={INTERNAL_HREFS.HOME}
          element={
            <PullToRefresh>
              <HomeScreen />
            </PullToRefresh>
          }
        />
        <Route path={INTERNAL_HREFS.REFERRAL} element={<Referral />} />
        <Route path={INTERNAL_HREFS.TRANSACTIONS} element={<Transactions />} />
        <Route path={INTERNAL_HREFS.LIMITS} element={<Limits />} />
        <Route path={INTERNAL_HREFS.DEPOSIT} element={<Deposit />} />
        <Route path={INTERNAL_HREFS.WITHDRAW} element={<Withdraw />} />
        <Route path={INTERNAL_HREFS.P2P_BRIDGE} element={<P2pBridge />} />

        <Route path={INTERNAL_HREFS.BUY} element={<Buy />} />
        <Route path={INTERNAL_HREFS.BUY_PREVIEW} element={<BuyPreview />} />
        <Route path={INTERNAL_HREFS.SELL} element={<Sell />} />
        <Route path={INTERNAL_HREFS.SELL_QUIZ} element={<SellQuiz />} />
        <Route path={INTERNAL_HREFS.SELL_PREVIEW} element={<SellPreview />} />
        <Route path={INTERNAL_HREFS.PAY} element={<Pay />} />

        <Route path={`${INTERNAL_HREFS.ORDER}/:id`} element={<Order />} />

        <Route path={INTERNAL_HREFS.SETTINGS} element={<Settings />} />

        <Route path={INTERNAL_HREFS.MAINTENANCE} element={<Maintenance />} />

        <Route path={INTERNAL_HREFS.HELP} element={<Help />} />
        <Route
          path={INTERNAL_HREFS.HELP_FAQS_SEARCH}
          element={<FAQsSearch />}
        />
        <Route
          path={INTERNAL_HREFS.HELP_HELPFUL_VIDEO_GUIDES}
          element={<HelpfulVideoGuides />}
        />
        <Route
          path={`${INTERNAL_HREFS.HELP}/:title`}
          element={<SupportPageWrapper />}
        />

        <Route path={INTERNAL_HREFS.LOGIN} element={<Login />} />

        <Route path={INTERNAL_HREFS.NOTIFICATION} element={<Notification />} />

        <Route
          path={INTERNAL_HREFS.CAMPAIGN}
          element={
            <PullToRefresh>
              <HomeScreen />
            </PullToRefresh>
          }
        />
        <Route
          path={INTERNAL_HREFS.RECOMMEND}
          element={
            <PullToRefresh>
              <HomeScreen />
            </PullToRefresh>
          }
        />

        {/* Dev routes - only accessible in development */}
        <Route
          path={INTERNAL_HREFS.DEV}
          element={
            <DevRouteGuard>
              <DevDashboard />
            </DevRouteGuard>
          }
        />
        <Route
          path={INTERNAL_HREFS.DEV_HAPTICS}
          element={
            <DevRouteGuard>
              <DevHapticsDemo />
            </DevRouteGuard>
          }
        />
        <Route
          path="/dev/sounds"
          element={
            <DevRouteGuard>
              <DevSoundsDemo />
            </DevRouteGuard>
          }
        />
        <Route
          path={INTERNAL_HREFS.DEV_CAMERA}
          element={
            <DevRouteGuard>
              <ScannerDevDashboard />
            </DevRouteGuard>
          }
        />
        <Route
          path={INTERNAL_HREFS.DEV_ANIMATIONS}
          element={
            <DevRouteGuard>
              <DevAnimationsDemo />
            </DevRouteGuard>
          }
        />

        <Route
          path={INTERNAL_HREFS.DEV_TOASTS}
          element={
            <DevRouteGuard>
              <DevToastsDemo />
            </DevRouteGuard>
          }
        />

        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
}
