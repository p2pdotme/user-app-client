import type { TFunction } from "i18next";
import moment from "moment";
import type { Order } from "@/core/adapters/thirdweb/validation";

const DISPUTE_MIN_WAIT_BUY = 15 * 60 * 1000; // 15 minutes for BUY orders
const DISPUTE_MIN_WAIT_SELL_PAY = 30 * 60 * 1000; // 30 minutes for SELL/PAY orders
const DISPUTE_MAX_WINDOW_BUY = 24 * 60 * 60 * 1000; // 24 hours for BUY orders
const DISPUTE_MAX_WINDOW_SELL_PAY = 7 * 24 * 60 * 60 * 1000;

/**
 * Gets the remaining time for dispute window
 */
export function getDisputeTimeRemaining(
  order: Order,
  t: TFunction,
): {
  isExpired: boolean;
  timeRemaining: string;
  canRaiseNow: boolean;
} {
  const currentTimestamp = Date.now();
  const orderPlacementTimestamp = parseInt(order.placedTimestamp, 10) * 1000;

  // Determine minimum wait time based on order type
  const minWaitTime =
    order.orderType === "BUY"
      ? DISPUTE_MIN_WAIT_BUY
      : DISPUTE_MIN_WAIT_SELL_PAY;

  // Determine maximum dispute window based on order type
  const maxWindow =
    order.orderType === "BUY"
      ? DISPUTE_MAX_WINDOW_BUY
      : DISPUTE_MAX_WINDOW_SELL_PAY;

  const disputeStartTimestamp = orderPlacementTimestamp + minWaitTime;
  const disputeExpiryTimestamp = orderPlacementTimestamp + maxWindow;

  // Check if dispute window has expired
  const isExpired = currentTimestamp > disputeExpiryTimestamp;

  if (isExpired) {
    return {
      isExpired: true,
      timeRemaining: t("DISPUTE_WINDOW_EXPIRED", {
        time: moment.duration(maxWindow).humanize(),
      }),
      canRaiseNow: false,
    };
  }

  // If we haven't reached the minimum wait time yet (15 min BUY, 30 min SELL/PAY)
  if (currentTimestamp < disputeStartTimestamp) {
    const remaining = disputeStartTimestamp - currentTimestamp;
    const timeRemaining = t("SUP_DISPUTE_AVAILABLE_IN", {
      minutes: Math.max(1, Math.ceil(remaining / 60000)),
    });

    return {
      isExpired: false,
      timeRemaining,
      canRaiseNow: false,
    };
  }

  // If we're within the dispute window (between min wait and max window)
  const remaining = disputeExpiryTimestamp - currentTimestamp;
  const timeRemaining = t("DISPUTE_WINDOW_CLOSES_IN_TIME", {
    time: moment.duration(remaining).humanize(),
  });

  return {
    isExpired: false,
    timeRemaining,
    canRaiseNow: true,
  };
}

/** Whole minutes since the order was placed (never negative). */
export function getMinutesSincePlaced(order: Order, now = Date.now()): number {
  const placedMs = parseInt(order.placedTimestamp, 10) * 1000;
  if (!Number.isFinite(placedMs) || placedMs <= 0) return 0;
  return Math.max(0, Math.floor((now - placedMs) / 60000));
}

/**
 * Why the dispute row is (or isn't) actionable, in one value the UI can
 * render without re-deriving the rules. Mirrors `canRaiseDispute` (status per
 * type, min wait, max window, not raised yet), which mirrors the contract.
 *
 * Status is checked before time: an order in the wrong state will not become
 * disputable just by waiting, so a countdown there would be misleading.
 */
export type DisputeAvailability =
  | { state: "available" }
  | { state: "locked"; minutesUntil: number; minWaitMinutes: number }
  | { state: "expired" }
  | { state: "already_raised" }
  | {
      state: "not_eligible";
      reason:
        | "buy_not_paid"
        | "buy_completed"
        | "sell_not_completed"
        | "sell_cancelled";
    };

export function getDisputeAvailability(
  order: Order,
  now = Date.now(),
): DisputeAvailability {
  if (order.disputeInfo.status !== "DEFAULT") {
    return { state: "already_raised" };
  }
  const placedMs = parseInt(order.placedTimestamp, 10) * 1000;
  const isBuy = order.orderType === "BUY";
  const minWait = isBuy ? DISPUTE_MIN_WAIT_BUY : DISPUTE_MIN_WAIT_SELL_PAY;
  const maxWindow = isBuy
    ? DISPUTE_MAX_WINDOW_BUY
    : DISPUTE_MAX_WINDOW_SELL_PAY;

  if (now > placedMs + maxWindow) return { state: "expired" };

  if (isBuy) {
    if (order.status === "COMPLETED") {
      return { state: "not_eligible", reason: "buy_completed" };
    }
    if (order.status !== "PAID" && order.status !== "CANCELLED") {
      return { state: "not_eligible", reason: "buy_not_paid" };
    }
  } else if (order.status === "CANCELLED") {
    return { state: "not_eligible", reason: "sell_cancelled" };
  } else if (order.status !== "COMPLETED") {
    return { state: "not_eligible", reason: "sell_not_completed" };
  }

  if (now < placedMs + minWait) {
    return {
      state: "locked",
      minutesUntil: Math.max(1, Math.ceil((placedMs + minWait - now) / 60000)),
      minWaitMinutes: minWait / 60000,
    };
  }
  return { state: "available" };
}
