import { useMutation } from "@tanstack/react-query";
import { ArrowUpDownIcon, SettingsIcon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { Address } from "thirdweb";
import type { Account } from "thirdweb/wallets";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { transferUSDC } from "@/core/adapters/thirdweb/actions/usdc";
import {
  BASE_USDC_ASSET_ID,
  DEFAULT_SLIPPAGE_BPS,
  getQuote,
  type OneClickToken,
  type PendingBridge,
  submitDepositTx,
} from "@/core/near-intents";
import {
  buildQuoteRequest,
  getChainIconUrl,
  useOneClickQuote,
  useTokenIcons,
} from "@/hooks/use-oneclick";
import { useUSDCBalance } from "@/hooks/use-usdc";
import { toBaseUnits } from "./lib";
import { ReviewSheet } from "./review-sheet";
import { SlippageSheet } from "./slippage-sheet";
import { TokenIcon, TokenSelector } from "./token-selector";

type Direction = "deposit" | "withdraw";

function UsdcBadge({ iconUrl }: { iconUrl: string | undefined }) {
  return (
    <span className="flex items-center gap-2">
      <TokenIcon
        symbol="USDC"
        iconUrl={iconUrl}
        chainIconUrl={getChainIconUrl("base")}
      />
      <span className="flex flex-col leading-tight">
        <span className="font-semibold text-sm">USDC</span>
        <span className="text-muted-foreground text-xs">Base</span>
      </span>
    </span>
  );
}

function formatUsd(value: string | null | undefined): string | null {
  if (!value) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? `$${parsed.toFixed(2)}` : null;
}

type SwapFormProps = {
  account: Account;
  tokens: OneClickToken[];
  onBridgeCreated: (bridge: PendingBridge) => void;
};

/**
 * Zashi-style swap form for the 1Click bridge. USDC on Base is the fixed
 * hub side; the flip button switches between:
 * - withdraw: USDC (from) → token (to), recipient address on the dest chain
 * - deposit:  token (from) → USDC (to), refund address on the origin chain
 */
export function SwapForm({ account, tokens, onBridgeCreated }: SwapFormProps) {
  const [direction, setDirection] = useState<Direction>("withdraw");
  const [token, setToken] = useState<OneClickToken | null>(null);
  const [amountText, setAmountText] = useState("");
  const [address, setAddress] = useState(""); // recipient (withdraw) / refundTo (deposit)
  const [slippageBps, setSlippageBps] = useState(DEFAULT_SLIPPAGE_BPS);
  const [slippageOpen, setSlippageOpen] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);
  const { usdcBalance } = useUSDCBalance();
  const { getTokenIconUrl } = useTokenIcons(tokens);
  const usdcIconUrl = getTokenIconUrl({ coingeckoId: "usd-coin" });

  const isWithdraw = direction === "withdraw";
  const amount = isWithdraw
    ? toBaseUnits(amountText, 6)
    : token
      ? toBaseUnits(amountText, token.decimals)
      : null;

  const insufficientFunds =
    isWithdraw &&
    usdcBalance !== undefined &&
    Number(amountText) > usdcBalance;

  const quoteParams =
    token && amount && address
      ? isWithdraw
        ? {
            originAsset: BASE_USDC_ASSET_ID,
            destinationAsset: token.assetId,
            amount,
            recipient: address,
            refundTo: account.address,
            slippageBps,
          }
        : {
            originAsset: token.assetId,
            destinationAsset: BASE_USDC_ASSET_ID,
            amount,
            recipient: account.address,
            refundTo: address,
            slippageBps,
          }
      : null;

  const dryQuote = useOneClickQuote(quoteParams);
  const quote = dryQuote.data?.quote;

  const rate =
    quote && Number(quote.amountInFormatted) > 0
      ? Number(quote.amountOutFormatted) / Number(quote.amountInFormatted)
      : null;
  const fromSymbol = isWithdraw ? "USDC" : (token?.symbol ?? "…");
  const toSymbol = isWithdraw ? (token?.symbol ?? "…") : "USDC";

  const flip = () => {
    setDirection(isWithdraw ? "deposit" : "withdraw");
    setAddress("");
  };

  const swap = useMutation({
    mutationFn: async () => {
      if (!quoteParams || !token) throw new Error("Missing quote inputs");
      const response = await getQuote(buildQuoteRequest(quoteParams, false));
      const { depositAddress, depositMemo } = response.quote;
      if (!depositAddress) throw new Error("No deposit address returned");

      const bridge: PendingBridge = {
        direction,
        depositAddress,
        ...(depositMemo ? { depositMemo } : {}),
        originAsset: quoteParams.originAsset,
        destinationAsset: quoteParams.destinationAsset,
        amount: quoteParams.amount,
        amountInFormatted: response.quote.amountInFormatted,
        amountOutFormatted: response.quote.amountOutFormatted,
        originSymbol: fromSymbol,
        destinationSymbol: toSymbol,
        recipient: quoteParams.recipient,
        refundTo: quoteParams.refundTo,
        deadline:
          response.quote.deadline ?? response.quote.timeWhenInactive ?? "",
        status: "PENDING_DEPOSIT",
        createdAt: Date.now(),
      };
      // Persist before any funds move so a refresh resumes polling
      onBridgeCreated(bridge);

      if (isWithdraw) {
        const result = await transferUSDC(
          {
            address: depositAddress as Address,
            amount: BigInt(quoteParams.amount),
          },
          account,
        );
        if (result.isErr()) {
          throw new Error(result.error.message);
        }
        // Speeds up 1Click's deposit detection; polling works without it
        await submitDepositTx({
          depositAddress,
          txHash: result.value.transactionHash,
        }).catch(() => undefined);
      }
      return bridge;
    },
    onSuccess: () => {
      setAmountText("");
      if (isWithdraw) {
        toast.success("USDC sent — bridging in progress");
      }
    },
    onError: (error) => toast.error(error.message),
  });

  const fromRow = (
    <div className="flex items-center justify-between gap-3">
      {isWithdraw ? (
        <UsdcBadge iconUrl={usdcIconUrl} />
      ) : (
        <TokenSelector
          tokens={tokens}
          selected={token}
          onSelect={setToken}
          getTokenIconUrl={getTokenIconUrl}
        />
      )}
      <Input
        inputMode="decimal"
        placeholder="0.00"
        value={amountText}
        onChange={(e) => setAmountText(e.target.value)}
        className={`h-14 max-w-48 rounded-xl bg-muted text-right font-semibold text-2xl ${
          insufficientFunds ? "border-destructive text-destructive" : ""
        }`}
      />
    </div>
  );

  const toRow = (
    <div className="flex items-center justify-between gap-3">
      {isWithdraw ? (
        <TokenSelector
          tokens={tokens}
          selected={token}
          onSelect={setToken}
          getTokenIconUrl={getTokenIconUrl}
        />
      ) : (
        <UsdcBadge iconUrl={usdcIconUrl} />
      )}
      <span className="font-semibold text-3xl">
        {quote?.amountOutFormatted ?? "0.00"}
      </span>
    </div>
  );

  const addressInput = (
    <div className="flex flex-col gap-2">
      <span className="flex items-center gap-1.5 font-medium">
        {isWithdraw ? "Address" : "Refund Address"}
      </span>
      <Input
        placeholder={`${token ? `${token.blockchain} address` : "Address"}…`}
        value={address}
        onChange={(e) => setAddress(e.target.value)}
        className="h-12 rounded-xl bg-muted placeholder:capitalize"
      />
      {!isWithdraw && (
        <p className="text-muted-foreground text-xs">
          Your address on the origin chain, used if the swap is refunded.
        </p>
      )}
    </div>
  );

  return (
    <div className="flex flex-col gap-5">
      {/* From */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <span className="font-medium">From</span>
          {isWithdraw && usdcBalance !== undefined && (
            <span
              className={`text-sm ${insufficientFunds ? "text-destructive" : "text-muted-foreground"}`}
            >
              Spendable: {usdcBalance.toFixed(4)}
            </span>
          )}
        </div>
        {fromRow}
        <div className="flex flex-col items-end gap-1">
          {formatUsd(quote?.amountInUsd) && (
            <span className="text-muted-foreground text-sm">
              {formatUsd(quote?.amountInUsd)}
            </span>
          )}
          {insufficientFunds && (
            <span className="text-destructive text-sm">
              Insufficient funds
            </span>
          )}
        </div>
        {!isWithdraw && addressInput}
      </div>

      {/* Flip */}
      <div className="relative flex items-center justify-center">
        <div className="absolute inset-x-0 border-border border-t" />
        <button
          type="button"
          onClick={flip}
          className="relative rounded-xl border bg-background p-3"
          aria-label="Switch direction"
        >
          <ArrowUpDownIcon className="size-4" />
        </button>
      </div>

      {/* To */}
      <div className="flex flex-col gap-3">
        <span className="font-medium">To</span>
        {toRow}
        {formatUsd(quote?.amountOutUsd) && (
          <span className="text-right text-muted-foreground text-sm">
            {formatUsd(quote?.amountOutUsd)}
          </span>
        )}
        {isWithdraw && addressInput}
      </div>

      {/* Details */}
      <div className="flex flex-col gap-3 pt-2">
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Slippage tolerance</span>
          <button
            type="button"
            className="flex items-center gap-1.5 rounded-lg bg-muted px-3 py-1.5 text-sm transition-colors hover:bg-muted/80"
            onClick={() => setSlippageOpen(true)}
          >
            {slippageBps / 100}%
            <SettingsIcon className="size-3.5 text-muted-foreground" />
          </button>
        </div>
        {slippageOpen && (
          <SlippageSheet
            open={slippageOpen}
            onOpenChange={setSlippageOpen}
            valueBps={slippageBps}
            onConfirm={setSlippageBps}
          />
        )}
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Rate</span>
          <span className="text-sm">
            {rate
              ? `1 ${fromSymbol} = ${rate.toFixed(4)} ${toSymbol}`
              : "—"}
          </span>
        </div>
        {dryQuote.error && (
          <p className="text-destructive text-sm">{dryQuote.error.message}</p>
        )}
      </div>

      <Button
        size="lg"
        className="h-14 rounded-xl text-base"
        disabled={
          !quoteParams ||
          insufficientFunds ||
          dryQuote.isLoading ||
          !!dryQuote.error ||
          swap.isPending
        }
        onClick={() => setReviewOpen(true)}
      >
        {swap.isPending
          ? isWithdraw
            ? "Withdrawing…"
            : "Creating…"
          : "Get a quote"}
      </Button>

      {quote && token && (
        <ReviewSheet
          open={reviewOpen}
          onOpenChange={setReviewOpen}
          from={{
            symbol: fromSymbol,
            blockchain: isWithdraw ? "base" : token.blockchain,
            iconUrl: isWithdraw ? usdcIconUrl : getTokenIconUrl(token),
            chainIconUrl: getChainIconUrl(
              isWithdraw ? "base" : token.blockchain,
            ),
            amount: quote.amountInFormatted,
            usd: quote.amountInUsd ?? null,
          }}
          to={{
            symbol: toSymbol,
            blockchain: isWithdraw ? token.blockchain : "base",
            iconUrl: isWithdraw ? getTokenIconUrl(token) : usdcIconUrl,
            chainIconUrl: getChainIconUrl(
              isWithdraw ? token.blockchain : "base",
            ),
            amount: quote.amountOutFormatted,
            usd: quote.amountOutUsd ?? null,
          }}
          slippageBps={slippageBps}
          pending={swap.isPending}
          onConfirm={() => {
            setReviewOpen(false);
            swap.mutate();
          }}
        />
      )}
    </div>
  );
}
