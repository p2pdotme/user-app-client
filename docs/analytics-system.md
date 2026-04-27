# Simple Analytics System

A lightweight analytics system for the P2P.me React PWA that tracks essential user behaviors using Amplitude. The system is designed to be simple, privacy-focused, and performant.

## Overview

This is a simple Amplitude integration that provides basic event tracking and user identification. The system automatically initializes when the required environment variables are present and gracefully degrades when analytics is disabled.

## Setup

1. Set environment variables:

```bash
VITE_AMPLITUDE_API_KEY=your_amplitude_api_key
```

2. The system initializes automatically when the app starts. If either environment variable is missing, analytics will be disabled and events will be logged to console in development.

## Usage

Import the analytics wrapper and use event families with a status property:

```typescript
import { analytics, EVENTS } from "@/lib/analytics";

// App lifecycle
analytics.track(EVENTS.APP, { status: "launched" });

// Transactions (buy/sell/pay/deposit/withdraw)
analytics.track(EVENTS.TRANSACTION, {
  status: "started", // "started" | "completed" | "failed" | etc.
  transaction_type: "buy",
  amount: 100,
  currency: "USDC",
});

// Verification (KYC/Aadhaar/social)
analytics.track(EVENTS.VERIFICATION, {
  status: "aadhaar_initiated", // or "aadhaar_success" | "aadhaar_failed"
});

// Wallet
analytics.track(EVENTS.WALLET, { status: "connected", walletType: "thirdweb" });

// PWA
analytics.track(EVENTS.PWA, { status: "installed" });

// Referral
analytics.track(EVENTS.REFERRAL, { status: "generated" });

// Navigation
analytics.track(EVENTS.NAVIGATION, { status: "nav_clicked", location: "footer", action: "buy" });

// Help/Settings/Feature interactions
analytics.track(EVENTS.HELP, { status: "opened", section: "faqs-search" });
analytics.track(EVENTS.SETTINGS, { status: "changed", setting: "sounds", value: "enabled" });
analytics.track(EVENTS.FEATURE, { status: "action_clicked", location: "homescreen", action: "wallet" });

// Identify users
analytics.identify(userId, { wallet_type: "thirdweb", connection_time: Date.now() });
```

## Event Families and Typical Statuses

- APP: app lifecycle only
  - statuses: "launched", "session_ended", "backgrounded", "foregrounded"
- TRANSACTION: buy/sell/pay/deposit/withdraw flow tracking
  - statuses: "initiated", "started" (after on-chain order placed), "completed", "failed", plus domain-specific like "accepted", "paid", "cancelled"
- VERIFICATION: identity and limits flows
  - statuses: e.g., "aadhaar_initiated", "aadhaar_success", "aadhaar_failed", "social_initiated", "social_success", "social_failed"
- WALLET: wallet lifecycle
  - statuses: "connected", "failed"
- PWA: install and prompt signals
  - statuses: "prompt_available", "attempted", "attempted_no_prompt", "installed", "dismissed", "banner_clicked", "banner_dismissed"
- REFERRAL: referral link lifecycle
  - statuses: "generated", "copied", "shared"
- NAVIGATION: user navigation
  - statuses: "nav_clicked" (with location/action details)
- HELP: help & content interactions
  - statuses: "opened", "search_query", "faq_opened", "video_opened", "video_closed", "banner_clicked"
- SETTINGS: settings interactions
  - statuses: "drawer_interaction" (open/select), "changed"
- FEATURE: non-nav UI actions
  - statuses: "action_clicked"

## Event Properties

Properties are tailored per family. Common fields added automatically include env, locale, pathname, and PWA mode. Examples:

```typescript
// TRANSACTION
{
  status: "started",
  transaction_type: "buy" | "sell" | "pay" | "deposit" | "withdraw",
  orderId?: string,
  amount?: number,
  fiatAmount?: number,
  currency?: string,
  errorMessage?: string
}

// PWA
{ status: "installed" | "prompt_available" | ... , platform, userAgent, timestamp }

// REFERRAL
{ status: "generated" | "copied" | "shared", userId?: string }
```

## Implementation Architecture

### File Structure

```
src/
  lib/
    analytics.ts          # Core Amplitude setup & wrapper with track/identify methods
```

### Key Implementation Details

**Safe by Design:**

- All analytics calls wrapped in try-catch
- Graceful degradation when analytics disabled (logs to console in dev)
- No impact on app functionality if tracking fails

**Privacy Focused:**

- No autocapture enabled (`defaultTracking: false`)
- Session recording disabled
- Only explicit events tracked
- Analytics disabled if API key missing

**Performance Optimized:**

- Minimal bundle impact
- Async event sending
- No blocking operations

**Developer Experience:**

- Simple direct import interface
- TypeScript support
- Clear event naming conventions
- Predefined event constants

## Usage Examples

### Transaction Tracking

```typescript
analytics.track(EVENTS.TRANSACTION, {
  status: "started",
  transaction_type: "buy",
  amount: 100,
  currency: "USDC",
});
```

### Wallet Connection

```typescript
analytics.track(EVENTS.WALLET, { status: "connected", walletType: "thirdweb" });
```

### User Identification

```typescript
import { analytics } from "@/lib/analytics";

// Identify user when wallet connects
analytics.identify(user.address, {
  walletType: "metamask",
  firstConnection: Date.now(),
});
```

## Data Privacy & Compliance

- **No PII Collection**: Only anonymous usage patterns tracked
- **Opt-out Capable**: Respects VITE_ANALYTICS_ENABLED flag
- **Minimal Data**: Only essential properties for UX improvement
- **Secure Transport**: All data sent over HTTPS
- **Retention Policy**: Follows Amplitude's data retention settings

## Monitoring & Insights

The analytics system enables tracking of:

1. **Transaction Analysis**: Success/failure rates and patterns
2. **Feature Adoption**: Which features users engage with most
3. **Error Patterns**: Common failure points and error types
4. **Wallet Usage**: Connection success rates and wallet types
5. **User Support**: Help system usage patterns

This simple yet effective tracking provides actionable insights while maintaining user privacy and app performance.
