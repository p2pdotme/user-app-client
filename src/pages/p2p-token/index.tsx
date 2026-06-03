import {
  ArrowDownRight,
  ArrowUpDown,
  ArrowUpRight,
  BadgeCheck,
  ChevronRight,
  Copy,
  Lock,
  QrCode,
  RefreshCw,
  SendHorizonal,
  Wallet,
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { formatUnits } from "viem";
import ASSETS from "@/assets";
import { NonHomeHeader } from "@/components";
import { SendP2PDrawer } from "@/components/p2p-token/send-p2p-drawer";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useP2PBalance,
  useP2PTokenInfo,
  useStakeBoostMetrics,
  useThirdweb,
  useUserStake,
} from "@/hooks";
import { cn, formatTokenBalance, truncateAddress } from "@/lib/utils";
import { INTERNAL_HREFS } from "@/lib/constants";
import { JUP_URL } from "@/components/tge-countdown-banner";

interface ActionButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon: React.ReactNode;
  label: string;
}

// Pill-style button used for Send/Receive actions on the holdings page.
function ActionButton({
  icon,
  label,
  className,
  disabled,
  ...rest
}: ActionButtonProps) {
  return (
    <button
      type="button"
      disabled={disabled}
      className={cn(
        "flex w-full cursor-pointer flex-col items-center justify-center gap-1.5 rounded-2xl bg-primary/10 px-4 py-4 text-foreground transition-colors hover:bg-primary/20 disabled:cursor-not-allowed disabled:opacity-40",
        className,
      )}
      {...rest}
    >
      <div className="flex size-9 items-center justify-center rounded-full bg-background text-primary">
        {icon}
      </div>
      <span className="font-semibold text-base">{label}</span>
    </button>
  );
}

// Drawer showing a QR code and copyable address to receive $P2P on Base.
function ReceiveDrawer({ address }: { address: string | undefined }) {
  const { t } = useTranslation();
  return (
    <Drawer>
      <DrawerTrigger asChild>
        <ActionButton
          icon={<QrCode className="size-4" />}
          label={t("RECEIVE")}
          disabled={!address}
        />
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader className="text-center">
          <DrawerTitle>{t("RECEIVE_P2P_TITLE")}</DrawerTitle>
          <DrawerDescription>{t("RECEIVE_P2P_DESCRIPTION")}</DrawerDescription>
        </DrawerHeader>
        <section className="flex flex-col items-center gap-6 px-4 pb-2">
          {address && (
            <>
              <div className="rounded-xl border-2 border-primary bg-white p-4 shadow-primary-shadow shadow-xl">
                <QRCodeSVG value={address} size={200} level="L" />
              </div>
              <button
                type="button"
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(address);
                    toast.success(t("ADDRESS_COPIED"));
                  } catch {
                    toast.error(t("FAILED_TO_COPY"));
                  }
                }}
                className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-primary/10 p-2 px-4 text-sm transition-colors hover:bg-primary/15"
              >
                <p className="font-mono text-muted-foreground">
                  {truncateAddress(address, 12)}
                </p>
                <Copy className="size-4 text-muted-foreground" />
              </button>
            </>
          )}
        </section>
        <DrawerFooter>
          <DrawerClose asChild>
            <Button
              variant="outline"
              size="lg"
              className="h-12 w-full text-base"
            >
              {t("CLOSE")}
            </Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}

// Compact card showing the user's current $P2P stake. Clicks navigate to /my-stake.
function StakedSummaryCard({
  stakedAmount,
  stakedUsd,
}: {
  stakedAmount: number;
  stakedUsd: number | null;
}) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  return (
    <button
      type="button"
      onClick={() => navigate(INTERNAL_HREFS.P2P_TOKEN_MY_STAKE)}
      className="group flex cursor-pointer flex-col gap-1.5 rounded-xl border border-primary/25 bg-background/30 p-3 text-left transition-colors hover:border-primary/40 hover:bg-background/60"
    >
      <div className="flex h-4 items-center gap-1.5">
        <Lock className="size-3 text-primary" />
        <p className="font-medium text-[10px] text-muted-foreground uppercase tracking-[0.08em]">
          {t("MY_STAKE_STAKED_LABEL")}
        </p>
        <ChevronRight className="ml-auto size-3 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-foreground" />
      </div>
      <div className="flex items-baseline gap-1">
        <p className="font-bold text-2xl text-foreground leading-none tabular-nums tracking-wide">
          {formatTokenBalance(stakedAmount)}
        </p>
        <span className="font-semibold text-[11px] text-muted-foreground">
          P2P
        </span>
      </div>
      <p className="font-medium text-[11px] text-muted-foreground tabular-nums">
        ≈{" "}
        <span className="text-foreground">
          {stakedUsd != null ? stakedUsd.toFixed(3) : "—"}
        </span>{" "}
        USDC
      </p>
    </button>
  );
}

// Empty-state CTA shown in place of the Staked card when the user has no stake.
// Animated gradient + shimmer + sparkle to invite the user into the staking flow.
function StakeCtaCard() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { maxBoostUsd } = useStakeBoostMetrics("0");
  const capLabel =
    maxBoostUsd > 0
      ? `${formatTokenBalance(maxBoostUsd, 0)}`
      : t("STAKE_CTA_INSTANT");

  return (
    <button
      type="button"
      onClick={() => navigate(INTERNAL_HREFS.P2P_TOKEN_STAKE)}
      className="group flex cursor-pointer flex-col gap-1.5 rounded-xl border border-primary/25 bg-background/30 p-3 text-left transition-colors hover:border-primary/40 hover:bg-background/60"
    >
      {/* Kicker row (mirrors Available's label row) */}
      <div className="flex h-4 items-center gap-1.5">
        <Lock className="size-3 text-primary" />
        <p className="font-medium text-[10px] text-primary uppercase tracking-[0.08em]">
          {t("STAKE_CTA_KICKER")}
        </p>
        <ChevronRight className="ml-auto size-3 text-primary transition-transform group-hover:translate-x-0.5" />
      </div>

      {/* Headline (mirrors Available's big amount) */}
      <p className="font-bold text-primary text-xl leading-none tracking-wide">
        {t("STAKE_CTA_TITLE")}
      </p>

      {/* Subtitle (mirrors Available's USDC line) */}
      <p className="font-medium text-[11px] text-muted-foreground leading-snug">
        {t("STAKE_CTA_SUBTITLE", { amount: capLabel })}
      </p>
    </button>
  );
}

// Hero card displaying $P2P balance, USD value, market price, and 24h change.
function TokenHoldingInfo() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { p2pBalanceRaw, isP2PBalanceLoading, refetchP2PBalance } =
    useP2PBalance();
  const { tokenInfo, isTokenInfoLoading, refetchTokenInfo } = useP2PTokenInfo();
  const { userStake } = useUserStake();
  const [spinning, setSpinning] = useState(false);

  const price = tokenInfo?.market.usdPrice ?? null;
  const change24h = tokenInfo?.stats.h24?.priceChange ?? null;
  const balanceNum =
    p2pBalanceRaw != null
      ? Number(formatUnits(BigInt(String(p2pBalanceRaw) || 0), 6))
      : 0;
  const balanceUsd = price != null ? balanceNum * price : null;
  const stakedAmount = userStake
    ? Number(formatUnits(userStake.stakedAmount, 6))
    : 0;
  const stakedUsd = price != null ? stakedAmount * price : null;
  const totalAmount = balanceNum + stakedAmount;
  const isLoading = isP2PBalanceLoading || isTokenInfoLoading;

  const handleRefresh = () => {
    if (isLoading || spinning) return;
    setSpinning(true);
    setTimeout(() => setSpinning(false), 600);
    refetchP2PBalance();
    refetchTokenInfo();
  };

  const changeIsUp = change24h != null && change24h >= 0;

  return (
    <section
      aria-label={t("ARIA_P2P_TOKEN_HOLDINGS")}
      className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/15 via-primary/8 to-primary/5 p-6"
    >
      {/* Ambient glow */}
      <div
        aria-hidden
        className="-top-16 -right-16 absolute size-48 rounded-full bg-primary/30 blur-3xl"
      />
      {/* Dot grid pattern */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "radial-gradient(currentColor 0.5px, transparent 0.5px)",
          backgroundSize: "20px 20px",
          color: "var(--color-foreground, #000)",
        }}
      />

      {/* Floating refresh */}
      <button
        type="button"
        onClick={handleRefresh}
        aria-label={t("ARIA_REFRESH_BALANCE")}
        disabled={isLoading || spinning}
        className="absolute top-3 right-3 z-10 flex size-7 cursor-pointer items-center justify-center rounded-full text-muted-foreground backdrop-blur-sm transition-colors hover:bg-primary/10 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
      >
        <RefreshCw
          className={cn("size-3.5", (spinning || isLoading) && "animate-spin")}
        />
      </button>

      {/* Header — icon + symbol + Base pill */}
      <div className="relative mb-4 flex items-center gap-2.5">
        <div className="relative flex size-10 items-center justify-center rounded-full">
          {tokenInfo?.icon ? (
            <img
              src={tokenInfo.icon}
              alt="P2P"
              className="size-9 rounded-full"
            />
          ) : (
            <ASSETS.ICONS.Logo className="size-7 text-primary" />
          )}
          <ASSETS.ICONS.NetworkBase
            aria-label={t("ARIA_BASE_NETWORK")}
            className="-bottom-0 -right-0 absolute size-3 rounded-full bg-background ring-1 ring-background"
          />
        </div>
        <div className="flex flex-col items-start gap-1">
          <div className="flex items-center gap-1">
            <p className="font-semibold text-foreground text-sm">$P2P</p>
            {tokenInfo?.trust.isVerified && (
              <BadgeCheck
                aria-label={t("ARIA_VERIFIED_TOKEN")}
                className="size-3.5 fill-success text-background"
              />
            )}
          </div>
          <span className="inline-flex items-center rounded-full bg-primary/15 px-2 py-0.5 font-medium text-[10px] text-primary uppercase tracking-wider">
            Base
          </span>
        </div>
      </div>

      {/* Primary balance */}
      <div className="relative flex flex-col gap-2.5">
        <div className="grid grid-cols-2 gap-2.5">
          {/* Available */}
          <div className="flex flex-col gap-1.5 py-3 pr-3">
            <div className="flex h-4 items-center gap-1.5">
              <Wallet className="size-3 text-muted-foreground" />
              <p className="font-medium text-[10px] text-muted-foreground uppercase tracking-[0.08em]">
                {t("BALANCE")}
              </p>
            </div>
            {isP2PBalanceLoading ? (
              <Skeleton className="h-7 w-24 bg-primary/20" />
            ) : (
              <div className="flex items-baseline gap-1">
                <p className="font-bold text-[26px] text-foreground leading-none tabular-nums tracking-wide">
                  {formatTokenBalance(balanceNum)}
                </p>
                <span className="font-semibold text-[11px] text-muted-foreground">
                  P2P
                </span>
              </div>
            )}
            {isTokenInfoLoading ? (
              <Skeleton className="h-3.5 w-20 bg-primary/20" />
            ) : (
              <p className="font-medium text-[11px] text-muted-foreground tabular-nums">
                ≈{" "}
                <span className="text-foreground">
                  {balanceUsd != null ? balanceUsd.toFixed(3) : "—"}
                </span>{" "}
                USDC
              </p>
            )}
          </div>

          {/* Staked */}
          {stakedAmount > 0 ? (
            <StakedSummaryCard
              stakedAmount={stakedAmount}
              stakedUsd={stakedUsd}
            />
          ) : (
            <StakeCtaCard />
          )}
        </div>

        <div className="flex items-center justify-between px-1">
          <p className="font-medium text-[10px] text-muted-foreground uppercase tracking-[0.18em]">
            {t("P2P_TOKEN_TOTAL")}
          </p>
          <p className="font-semibold text-[13px] text-foreground tabular-nums">
            {formatTokenBalance(totalAmount)}{" "}
            <span className="font-medium text-[10px] text-muted-foreground">
              P2P
            </span>
          </p>
        </div>
      </div>

      {/* Divider */}
      <div className="relative my-4 h-px w-full bg-border/60" />

      {/* Price row */}
      <div className="relative flex items-center justify-between">
        <div className="flex flex-col gap-0.5">
          <p className="text-muted-foreground text-xs tracking-wider">
            {t("MARKET_PRICE")}
          </p>
          {isTokenInfoLoading ? (
            <Skeleton className="h-5 w-20 bg-primary/20" />
          ) : (
            <p className="font-semibold text-foreground text-sm tabular-nums">
              {price != null ? price.toFixed(3) : "—"}{" "}
              <span className="font-medium text-muted-foreground text-xs">
                USD
              </span>
            </p>
          )}
        </div>

        {isTokenInfoLoading ? (
          <Skeleton className="h-6 w-24 rounded-full bg-primary/20" />
        ) : change24h != null ? (
          <div className="flex flex-col items-end gap-0.5">
            <p className="text-muted-foreground text-xs tracking-wider">
              {t("TWENTY_FOUR_HOUR")}
            </p>
            <span
              className={cn(
                "inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-semibold text-xs tabular-nums",
                changeIsUp
                  ? "bg-success/15 text-success"
                  : "bg-destructive/15 text-destructive",
              )}
            >
              {changeIsUp ? (
                <ArrowUpRight className="size-3" />
              ) : (
                <ArrowDownRight className="size-3" />
              )}
              <span>
                {change24h > 0 ? "+" : ""}
                {change24h.toFixed(2)}%
              </span>
            </span>
          </div>
        ) : null}
      </div>
    </section>
  );
}

// $P2P token landing page: holdings, send/receive actions, and Solana CTA.
export function P2PToken() {
  const { t } = useTranslation();
  const { account } = useThirdweb();
  const navigate = useNavigate();

  return (
    <>
      <NonHomeHeader title={t("P2P_TOKEN_TITLE")} />
      <main className="no-scrollbar container-narrow flex h-full w-full flex-col gap-6 overflow-y-auto px-4 py-10">
        <div className="flex flex-col items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="h-px w-8 bg-gradient-to-r from-transparent to-primary/40" />
            <p className="font-medium text-muted-foreground text-xs uppercase tracking-[0.2em]">
              {t("YOUR_P2P_ON_BASE")}
            </p>
            <span className="h-px w-8 bg-gradient-to-l from-transparent to-primary/40" />
          </div>
          <div className="w-full">
            <TokenHoldingInfo />
          </div>
        </div>

        {/* Actions */}
        <div className="grid grid-cols-3 gap-2">
          <SendP2PDrawer>
            <ActionButton
              icon={<SendHorizonal className="size-4" />}
              label={t("SEND")}
            />
          </SendP2PDrawer>
          <ReceiveDrawer address={account?.address} />
          <ActionButton
            icon={<ArrowUpDown className="size-4" />}
            label={t("SWAP")}
            onClick={() => navigate(INTERNAL_HREFS.P2P_TOKEN_SWAP)}
          />
        </div>

        <AboutToken />

        <SolanaTradeFooter />
      </main>
    </>
  );
}

// Format a large number into a compact representation (e.g. 1.23M, 4.56K).
function formatCompactUsd(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(n)) return "—";
  return new Intl.NumberFormat(undefined, {
    notation: "compact",
    maximumFractionDigits: 2,
  }).format(n);
}

function StatCard({
  label,
  value,
  isLoading,
}: {
  label: string;
  value: React.ReactNode;
  isLoading: boolean;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-1 rounded-xl border border-border/60 bg-card/40 px-3 py-3">
      <p className="text-muted-foreground text-[11px] uppercase tracking-wider">
        {label}
      </p>
      {isLoading ? (
        <Skeleton className="h-5 w-16 bg-primary/20" />
      ) : (
        <p className="font-bold text-foreground text-base tabular-nums">
          {value}
        </p>
      )}
    </div>
  );
}

// Compact DEXScreener-style token stats sourced from the token detail API.
function TokenStats() {
  const { t } = useTranslation();
  const { tokenInfo, isTokenInfoLoading } = useP2PTokenInfo();

  const marketCap = tokenInfo?.market.marketCap ?? null;
  const fdv = tokenInfo?.market.fdv ?? null;
  const liquidity =
    tokenInfo?.market.liquidity != null ? tokenInfo.market.liquidity * 2 : null;

  return (
    <section aria-label={t("TOKEN_STATS")} className="grid grid-cols-3 gap-2">
      <StatCard
        label={t("LIQUIDITY")}
        value={`$${formatCompactUsd(liquidity)}`}
        isLoading={isTokenInfoLoading}
      />
      <StatCard
        label={t("FDV")}
        value={`$${formatCompactUsd(fdv)}`}
        isLoading={isTokenInfoLoading}
      />
      <StatCard
        label={t("MKT_CAP")}
        value={`$${formatCompactUsd(marketCap)}`}
        isLoading={isTokenInfoLoading}
      />
    </section>
  );
}

function AboutToken() {
  const { t } = useTranslation();
  return (
    <section
      aria-label={t("ABOUT_P2P_TOKEN")}
      className="rounded-2xl border border-border/60 bg-card/40 p-4"
    >
      <h2 className="mb-2 font-semibold text-foreground text-base">
        {t("ABOUT_P2P_TOKEN")}
      </h2>
      <TokenStats />
      <p className="text-muted-foreground text-sm leading-relaxed mt-2">
        {t("ABOUT_P2P_TOKEN_DESCRIPTION")}
      </p>
      <p className="mt-2 text-muted-foreground text-sm">
        {t("LEARN_MORE_AT")}{" "}
        <a
          href="https://docs.p2p.foundation/for-token-holders/start-here"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 font-medium text-primary underline-offset-2 hover:underline"
        >
          docs.p2p.foundation
          <ArrowUpRight className="size-3.5" />
        </a>
      </p>
      <p className="mt-1 text-muted-foreground text-sm">
        {t("VIEW_ON")}{" "}
        <a
          href="https://dexscreener.com/solana/cfymvueyikv8dakdns6wshc5uaxg6t7kqfbcsaebacfu"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 font-medium text-primary underline-offset-2 hover:underline"
        >
          dexscreener.com
          <ArrowUpRight className="size-3.5" />
        </a>
      </p>
    </section>
  );
}

// Footer CTA linking to the $P2P token page on Jupiter (Solana).
function SolanaTradeFooter() {
  const { t } = useTranslation();
  return (
    <div className="mt-auto flex flex-col items-center gap-2 pt-2">
      <div className="flex items-center gap-2">
        <span className="h-px w-6 bg-border" />
        <p className="font-medium text-[10px] text-muted-foreground uppercase tracking-[0.2em]">
          {t("ALSO_AVAILABLE_ON")}
        </p>
        <span className="h-px w-6 bg-border" />
      </div>

      <a
        href={JUP_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="group relative inline-flex items-center gap-2 overflow-hidden rounded-full bg-gradient-to-r from-[#9945FF]/15 to-[#14F195]/15 px-4 py-1.5 transition-all hover:from-[#9945FF]/25 hover:to-[#14F195]/25"
      >
        <ASSETS.ICONS.NetworkSolana className="size-4" />
        <span className="font-semibold text-foreground text-xs">
          {t("TRADE_ON_SOLANA")}
        </span>
        <span className="font-medium text-muted-foreground text-[10px]">
          {t("VIA_JUPITER")}
        </span>
        <ArrowUpRight className="size-3 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-foreground" />
      </a>
    </div>
  );
}
