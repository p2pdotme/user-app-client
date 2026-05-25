import {
  ArrowDownRight,
  ArrowUpDown,
  ArrowUpRight,
  BadgeCheck,
  Copy,
  QrCode,
  RefreshCw,
  SendHorizonal,
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { useState } from "react";
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
import { useP2PBalance, useP2PTokenInfo, useThirdweb } from "@/hooks";
import { cn, truncateAddress } from "@/lib/utils";
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
  return (
    <Drawer>
      <DrawerTrigger asChild>
        <ActionButton
          icon={<QrCode className="size-4" />}
          label="Receive"
          disabled={!address}
        />
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader className="text-center">
          <DrawerTitle>Receive $P2P</DrawerTitle>
          <DrawerDescription>
            Send $P2P or any Base network token to this address.
          </DrawerDescription>
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
                    toast.success("Address copied");
                  } catch {
                    toast.error("Failed to copy");
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
            <Button variant="outline" size="lg" className="h-12 w-full text-base">
              Close
            </Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}

// Hero card displaying $P2P balance, USD value, market price, and 24h change.
function TokenHoldingInfo() {
  const { p2pBalanceRaw, isP2PBalanceLoading, refetchP2PBalance } =
    useP2PBalance();
  const { tokenInfo, isTokenInfoLoading, refetchTokenInfo } =
    useP2PTokenInfo();
  const [spinning, setSpinning] = useState(false);

  const price = tokenInfo?.market.usdPrice ?? null;
  const change24h = tokenInfo?.stats.h24?.priceChange ?? null;
  const balanceNum =
    p2pBalanceRaw != null
      ? Number(formatUnits(BigInt(String(p2pBalanceRaw) || 0), 6))
      : 0;
  const balanceUsd = price != null ? balanceNum * price : null;
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
      aria-label="P2P token holdings"
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
        aria-label="Refresh balance"
        disabled={isLoading || spinning}
        className="absolute top-3 right-3 z-10 flex size-7 cursor-pointer items-center justify-center rounded-full text-muted-foreground backdrop-blur-sm transition-colors hover:bg-primary/10 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
      >
        <RefreshCw
          className={cn(
            "size-3.5",
            (spinning || isLoading) && "animate-spin",
          )}
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
            aria-label="Base network"
            className="-bottom-0 -right-0 absolute size-3 rounded-full bg-background ring-1 ring-background"
          />
        </div>
        <div className="flex flex-col items-start gap-1">
          <div className="flex items-center gap-1">
            <p className="font-semibold text-foreground text-sm">$P2P</p>
            {tokenInfo?.trust.isVerified && (
              <BadgeCheck
                aria-label="Verified token"
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
      <div className="relative flex flex-col gap-1">
        {isP2PBalanceLoading ? (
          <Skeleton className="h-10 w-40 bg-primary/20" />
        ) : (
          <div className="flex items-baseline gap-2">
            <p className="font-bold text-4xl text-foreground tabular-nums tracking-tight">
              {balanceNum.toLocaleString(undefined, {
                minimumFractionDigits: 3,
                maximumFractionDigits: 3,
              })}
            </p>
            <span className="font-semibold text-muted-foreground text-sm">
              P2P
            </span>
          </div>
        )}

        {isTokenInfoLoading ? (
          <Skeleton className="h-5 w-28 bg-primary/20" />
        ) : (
          <p className="font-medium text-muted-foreground text-sm tabular-nums">
            ≈{" "}
            <span className="text-foreground">
              {balanceUsd != null ? balanceUsd.toFixed(3) : "—"}
            </span>{" "}
            USDC
          </p>
        )}
      </div>

      {/* Divider */}
      <div className="relative my-4 h-px w-full bg-border/60" />

      {/* Price row */}
      <div className="relative flex items-center justify-between">
        <div className="flex flex-col gap-0.5">
          <p className="text-muted-foreground text-xs tracking-wider">
            Market Price
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
            <p className="text-muted-foreground text-xs tracking-wider">24h</p>
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
  const { account } = useThirdweb();
  const navigate = useNavigate();

  return (
    <>
      <NonHomeHeader title="$P2P Token" />
      <main className="no-scrollbar container-narrow flex h-full w-full flex-col gap-6 overflow-y-auto px-4 py-10">
        <div className="flex flex-col items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="h-px w-8 bg-gradient-to-r from-transparent to-primary/40" />
            <p className="font-medium text-muted-foreground text-xs uppercase tracking-[0.2em]">
              Your $P2P on Base
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
              label="Send"
            />
          </SendP2PDrawer>
          <ReceiveDrawer address={account?.address} />
          <ActionButton
            icon={<ArrowUpDown className="size-4" />}
            label="Swap"
            onClick={() => navigate(INTERNAL_HREFS.P2P_TOKEN_SWAP)}
          />
        </div>

        <SolanaTradeFooter />
      </main>
    </>
  );
}

// Footer CTA linking to the $P2P token page on Jupiter (Solana).
function SolanaTradeFooter() {
  return (
    <div className="mt-auto flex flex-col items-center gap-2 pt-2">
      <div className="flex items-center gap-2">
        <span className="h-px w-6 bg-border" />
        <p className="font-medium text-[10px] text-muted-foreground uppercase tracking-[0.2em]">
          Also available on
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
          Trade on Solana
        </span>
        <span className="font-medium text-muted-foreground text-[10px]">
          via Jupiter
        </span>
        <ArrowUpRight className="size-3 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-foreground" />
      </a>
    </div>
  );
}
