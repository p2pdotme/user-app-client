import { ArrowRight, Gift } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import type { Address } from "thirdweb";
import { formatUnits } from "viem";
import ASSETS from "@/assets";
import { CollapsibleCard } from "@/components/collapsible-card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useCbBtcBalance,
  useCbBtcPrice,
  useP2PTokenInfo,
  useP2pRewardBalance,
  useThirdweb,
} from "@/hooks";
import { INTERNAL_HREFS } from "@/lib/constants";

const COINSME_APP_URL = "https://app.coins.me";
const CBBTC_TOKEN_ADDRESS =
  "0xcbB7C0000aB88B473b1f5aFd9ef808440eed33Bf" as Address;

function P2pCashbackRow() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { account } = useThirdweb();
  const {
    data: balance,
    isLoading: isBalanceLoading,
    isError: isBalanceError,
  } = useP2pRewardBalance();
  const { tokenInfo, isTokenInfoLoading } = useP2PTokenInfo();

  const balanceQueryEnabled = !!account?.address;
  const isLoading = balanceQueryEnabled && isBalanceLoading;

  if (isBalanceError || isLoading) return null;
  if (!balance || !balance.hasBalance) return null;

  const handleViewP2PToken = () => {
    navigate(INTERNAL_HREFS.P2P_TOKEN);
  };

  const price = tokenInfo?.market.usdPrice ?? null;
  const balanceNum = Number(formatUnits(balance.rawAmount, 6));
  const balanceUsd = price != null ? balanceNum * price : null;
  const usdValue = balanceUsd != null ? `≈ $${balanceUsd.toFixed(3)}` : "";

  return (
    <div className="flex w-full flex-col gap-1">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
            <ASSETS.ICONS.Logo className="size-5 text-primary" />
          </div>
          <span className="font-medium text-foreground text-lg">
            {balance.displayAmount} ${balance.tokenSymbol}
          </span>
        </div>
        {isTokenInfoLoading ? (
          <Skeleton className="h-4 w-10" />
        ) : (
          usdValue && (
            <span className="text-muted-foreground text-sm">{usdValue}</span>
          )
        )}
      </div>
      <Button
        variant="link"
        onClick={handleViewP2PToken}
        className="h-auto self-start p-0 no-underline hover:no-underline">
        {t("VIEW_P2P_TOKEN_HOLDINGS")}
        <ArrowRight className="size-4" />
      </Button>
    </div>
  );
}

function CbBtcCashbackRow() {
  const { t } = useTranslation();
  const { account } = useThirdweb();
  const {
    data: balance,
    isLoading: isBalanceLoading,
    isError: isBalanceError,
  } = useCbBtcBalance(CBBTC_TOKEN_ADDRESS);
  const { data: price, isLoading: isPriceLoading } =
    useCbBtcPrice(CBBTC_TOKEN_ADDRESS);

  const balanceQueryEnabled = !!account?.address;
  const isLoading = balanceQueryEnabled && isBalanceLoading;

  if (isBalanceError || isLoading) return null;
  if (!balance || !balance.hasBalance) return null;

  const handleOpenCoinsMe = () => {
    window.open(COINSME_APP_URL, "_blank", "noopener,noreferrer");
  };

  const usdValue = price?.getFormattedUsdValue(balance.rawAmount) ?? "";

  return (
    <div className="flex w-full flex-col gap-1">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
            <Gift className="size-5 text-primary" />
          </div>
          <span className="font-medium text-foreground text-lg">
            {balance.displayAmount} {balance.tokenSymbol}
          </span>
        </div>
        {isPriceLoading ? (
          <Skeleton className="h-4 w-10" />
        ) : (
          usdValue && (
            <span className="text-muted-foreground text-sm">{usdValue}</span>
          )
        )}
      </div>
      <Button
        variant="link"
        onClick={handleOpenCoinsMe}
        className="h-auto self-start p-0 no-underline hover:no-underline">
        {t("USE_CBBTC_ON_COINSME")}
        <ArrowRight className="size-4" />
      </Button>
    </div>
  );
}

export function CashbackEarnedCard() {
  const { t } = useTranslation();
  const { data: p2pBalance } = useP2pRewardBalance();
  const { data: cbBtcBalance } = useCbBtcBalance(CBBTC_TOKEN_ADDRESS);

  const hasAnyBalance = !!p2pBalance?.hasBalance || !!cbBtcBalance?.hasBalance;

  if (!hasAnyBalance) return null;

  return (
    <div className="flex w-full flex-col items-center justify-center py-4">
      <CollapsibleCard
        title={t("CASHBACK_EARNED")}
        storageKey="card-collapse:cashback">
        <div className="flex w-full flex-col gap-4">
          <P2pCashbackRow />
          <CbBtcCashbackRow />
        </div>
      </CollapsibleCard>
    </div>
  );
}
