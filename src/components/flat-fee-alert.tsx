import { useQuery } from "@tanstack/react-query";
import { AlertTriangle } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useSettings } from "@/contexts";
import { getFeeConfig } from "@/core/fees";

const FlatFeeAlert = ({
  amount,
  show,
  orderType,
  fiatAmount,
  exchangeRate,
}: {
  amount: number;
  show: boolean;
  orderType: "buy" | "sell" | "pay";
  fiatAmount?: number;
  fiatCurrency?: string;
  exchangeRate?: number;
}) => {
  const {
    settings: { currency },
  } = useSettings();

  const { data: feeConfig } = useQuery({
    queryKey: ["feeConfig", currency.currency],
    queryFn: () =>
      getFeeConfig(currency.currency).match(
        (config) => config,
        (error) => {
          throw error;
        },
      ),
    enabled: !!currency.currency,
  });

  const { t } = useTranslation();

  const isBuyOrder = orderType === "buy";
  const isPayOrder = orderType === "pay";
  const isSellOrder = orderType === "sell";

  const flatFee = feeConfig?.smallOrderFixedFee ?? 0;
  const orderMinimumAmount = feeConfig?.smallOrderThreshold ?? 0;

  const isAmountBelowFee = amount <= flatFee && isBuyOrder;

  let deductedAmount: number;
  if (isBuyOrder) {
    deductedAmount = amount - flatFee;
  } else if (isPayOrder || isSellOrder) {
    // Both PAY and SELL now add the fee (contract handles it internally)
    deductedAmount = (fiatAmount || 0) / (exchangeRate || 1) + flatFee;
  } else {
    deductedAmount = 0;
  }

  let translationKey: string;
  if (isAmountBelowFee) {
    translationKey = "FLAT_FEE_MINIMUM_ORDER_REQUIRED";
  } else if (isBuyOrder) {
    translationKey = "BUY_FLOW_FLAT_FEE_APPLIES_FOR_ORDER_BELOW_AMOUNT";
  } else if (isSellOrder) {
    translationKey = "SELL_FLOW_FLAT_FEE_APPLIES_FOR_ORDER_BELOW_AMOUNT";
  } else if (isPayOrder) {
    translationKey = "PAY_FLOW_FLAT_FEE_APPLIES_FOR_ORDER_BELOW_AMOUNT";
  } else {
    translationKey = "PAY_FLOW_FLAT_FEE_APPLIES_FOR_ORDER_BELOW_AMOUNT";
  }

  const formattedDeductedAmount = `${deductedAmount.toFixed(isBuyOrder ? 2 : 3)} USDC`;

  return (
    show && (
      <Alert variant="warning" className="w-full py-2">
        <AlertTriangle className="size-4" />
        <AlertDescription className="flex w-full items-center justify-between text-xs">
          <p className="text-foreground">
            {isAmountBelowFee
              ? t(translationKey, {
                  flatFee: flatFee.toString(),
                  orderMinimumAmount: orderMinimumAmount.toString(),
                })
              : t(translationKey, {
                  flatFee: flatFee.toString(),
                  orderMinimumAmount: orderMinimumAmount.toString(),
                  deductedAmount: formattedDeductedAmount,
                })}
          </p>
        </AlertDescription>
      </Alert>
    )
  );
};

export default FlatFeeAlert;
