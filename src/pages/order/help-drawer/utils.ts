import type { TFunction } from "i18next";
import moment from "moment";
import type { Order } from "@/core/adapters/thirdweb/validation";

const DISPUTE_MIN_WAIT_BUY = 15 * 60 * 1000; // 15 minutes for BUY orders
const DISPUTE_MIN_WAIT_SELL_PAY = 30 * 60 * 1000; // 30 minutes for SELL/PAY orders
const DISPUTE_MAX_WINDOW_BUY = 24 * 60 * 60 * 1000; // 24 hours for BUY orders
const DISPUTE_MAX_WINDOW_SELL_PAY = 7 * 24 * 60 * 60 * 1000; // 7 days for SELL/PAY orders

/**
 * Determines if a dispute can be raised for an order
 * Based on logic with 15-minute minimum wait for BUY orders, 30-minute minimum wait for SELL/PAY orders,
 * 24-hour maximum window for BUY orders, and 7-day maximum window for SELL/PAY orders
 */
export function canRaiseDispute(order: Order): boolean {
  const currentTimestamp = Date.now();
  const orderPlacementTimestamp = parseInt(order.placedTimestamp, 10) * 1000; // Convert to milliseconds

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

  // Check if minimum wait time has passed
  const hasMinWaitPassed =
    currentTimestamp >= orderPlacementTimestamp + minWaitTime;

  // Check if we're still within the maximum dispute window
  const isWithinMaxWindow =
    currentTimestamp <= orderPlacementTimestamp + maxWindow;

  // Check if dispute has not been raised yet
  const isDisputeNotRaised = order.disputeInfo.status === "DEFAULT";

  // Check order type and status conditions
  let isOrderEligible = false;

  if (order.orderType === "BUY") {
    // For BUY orders: can raise dispute when status is PAID
    isOrderEligible = order.status === "PAID" || order.status === "CANCELLED";
  } else if (order.orderType === "SELL" || order.orderType === "PAY") {
    // For SELL/PAY orders: can raise dispute when status is COMPLETED
    isOrderEligible = order.status === "COMPLETED";
  }

  return (
    hasMinWaitPassed &&
    isWithinMaxWindow &&
    isDisputeNotRaised &&
    isOrderEligible
  );
}

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

  // If we haven't reached the minimum wait time yet (before 30 minutes)
  if (currentTimestamp < disputeStartTimestamp) {
    const remaining = disputeStartTimestamp - currentTimestamp;
    const timeRemaining = t("DISPUTE_AVAILABLE_IN_TIME", {
      time: moment.duration(remaining).humanize(),
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
