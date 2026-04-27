import type { CurrencyCode as CurrencyType } from "@p2pdotme/sdk";
import { ResultAsync } from "neverthrow";
import { formatUnits } from "viem";
import {
  getAdditionalOrderDetails,
  getOrderFixedFeePaid,
  getSmallOrderFixedFee,
  getSmallOrderThreshold,
} from "./adapters/thirdweb/actions/order";

/**
 * Get fee configuration for a currency
 */
export function getFeeConfig(currency: CurrencyType) {
  return ResultAsync.combine([
    getSmallOrderThreshold({ currency }),
    getSmallOrderFixedFee({ currency }),
  ]).map(([threshold, fixedFee]) => ({
    smallOrderThreshold: Number(formatUnits(threshold as bigint, 6)),
    smallOrderFixedFee: Number(formatUnits(fixedFee as bigint, 6)),
  }));
}

/**
 * Get the fixed fee paid for a specific order
 */
export function getOrderFixedFee(orderId: number) {
  return getOrderFixedFeePaid({ orderId }).map((fee) =>
    Number(formatUnits(fee as bigint, 6)),
  );
}

/**
 * Get the actual USDC amount for an order (after fees)
 */
export function getOrderActualUsdcAmount(orderId: number) {
  return getAdditionalOrderDetails({ orderId }).map((details) =>
    Number(formatUnits(details.actualUsdtAmount as bigint, 6)),
  );
}

/**
 * Get the actual fiat amount for an order (after fees)
 */
export function getOrderActualFiatAmount(orderId: number) {
  return getAdditionalOrderDetails({ orderId }).map((details) =>
    Number(formatUnits(details.actualFiatAmount as bigint, 6)),
  );
}

/**
 * Get all order fee details
 */
export function getOrderFeeDetails(orderId: number) {
  return getAdditionalOrderDetails({ orderId }).map((details) => ({
    fixedFeePaid: Number(formatUnits(details.fixedFeePaid as bigint, 6)),
    actualUsdtAmount: Number(
      formatUnits(details.actualUsdtAmount as bigint, 6),
    ),
    actualFiatAmount: Number(
      formatUnits(details.actualFiatAmount as bigint, 6),
    ),
  }));
}
