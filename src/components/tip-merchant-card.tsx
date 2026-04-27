import { Loader2 } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useOrderFlow, useOrderTip } from "@/hooks";

// Tip amounts matching the drawer presets (in USDC)
const TIP_AMOUNTS = [
  { amount: 0.1, isMostTipped: false },
  { amount: 0.25, isMostTipped: false },
  { amount: 0.5, isMostTipped: true }, // Highlighted as most popular
  { amount: 0.75, isMostTipped: false },
] as const;

interface TipMerchantCardProps {
  orderId: number;
}

export function TipMerchantCard({ orderId }: TipMerchantCardProps) {
  const { t } = useTranslation();
  const { tipMerchantMutation } = useOrderFlow();
  const { data: existingTip, isLoading: isTipLoading } = useOrderTip(orderId);
  const [customTipAmount, setCustomTipAmount] = useState("");

  // Check if tip has already been given (tip > 0)
  const hasTipBeenGiven = existingTip && existingTip > 0n;

  // Handle tip amount input change
  const handleTipAmountChange = (value: string) => {
    setCustomTipAmount(value);
  };

  const handleTipSubmit = async () => {
    const amount = parseFloat(customTipAmount);

    if (amount <= 0 || Number.isNaN(amount)) {
      toast.error(t("INVALID_TIP_AMOUNT"));
      return;
    }

    try {
      // Convert to USDC (6 decimals)
      const tipAmountBigInt = BigInt(Math.round(amount * 1_000_000));

      await tipMerchantMutation.mutateAsync({
        orderId,
        tipAmount: tipAmountBigInt,
      });

      toast.success(t("TIP_SENT_SUCCESSFULLY"));
      setCustomTipAmount("");
    } catch (error) {
      console.error("Failed to send tip:", error);
      toast.error(t("TIP_SEND_FAILED"));
    }
  };

  const handlePresetAmountClick = (amount: number) => {
    setCustomTipAmount(amount.toString());
  };

  // Don't show if loading
  if (isTipLoading) {
    return null;
  }

  // Show thank you message if already tipped
  if (hasTipBeenGiven) {
    return (
      <Card className="w-full shadow-none">
        <CardContent className="pt-1">
          <div className="flex items-center justify-between py-2">
            <div className="space-y-1">
              <p className="font-medium text-sm">{t("TIP_MERCHANT")}</p>
              <p className="text-muted-foreground text-xs">
                {t("THANK_YOU_FOR_YOUR_GENEROSITY")}
              </p>
            </div>
            <div className="flex flex-col items-end">
              <p className="font-bold text-lg text-success">
                ${(Number(existingTip) / 1_000_000).toFixed(2)}
              </p>
              <p className="text-muted-foreground text-xs">USDC</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full shadow-none">
      <CardContent className="pt-1">
        <div className="space-y-4">
          {/* Header */}
          <div className="space-y-1">
            <p className="font-medium text-sm">{t("TIP_MERCHANT")}</p>
            <p className="text-muted-foreground text-xs">
              {t("TIP_MERCHANT_DESCRIPTION")}
            </p>
          </div>

          {/* Custom Tip Input */}
          <div className="flex gap-2">
            <Input
              type="number"
              step="0.01"
              min="0.01"
              placeholder={t("ENTER_TIP_AMOUNT")}
              value={customTipAmount}
              onChange={(e) => handleTipAmountChange(e.target.value)}
              disabled={tipMerchantMutation.isPending}
              className="flex-1"
            />
            <Button
              onClick={handleTipSubmit}
              disabled={
                tipMerchantMutation.isPending ||
                !customTipAmount ||
                parseFloat(customTipAmount) <= 0
              }
              className="px-8">
              {tipMerchantMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {t("TIP_MERCHANT")}
            </Button>
          </div>

          {/* Tip Amount Buttons */}
          <div className="grid grid-cols-4 gap-2">
            {TIP_AMOUNTS.map(({ amount, isMostTipped }) => (
              <Button
                key={amount}
                variant="outline"
                onClick={() => handlePresetAmountClick(amount)}
                disabled={tipMerchantMutation.isPending}
                className="relative h-auto py-2">
                <span className="font-medium text-sm">${amount}</span>
                {isMostTipped && (
                  <Badge
                    variant="destructive"
                    className="-bottom-2 absolute h-4 px-1.5 text-[10px]">
                    {t("MOST_TIPPED")}
                  </Badge>
                )}
              </Button>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
