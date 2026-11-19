import { useMutation } from "@tanstack/react-query";
import {
  ArrowDownIcon,
  ChevronDownIcon,
  ClipboardPasteIcon,
  Loader2Icon,
  SettingsIcon,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import type { Address } from "thirdweb";
import type { Account } from "thirdweb/wallets";
import { parseUnits } from "viem";
import { NearIntentReviewSheet } from "@/components/near-intent-review-sheet";
import { NearIntentSlippageSheet } from "@/components/near-intent-slippage-sheet";
import { TokenIcon } from "@/components/token-icon";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { transferUSDC } from "@/core/adapters/thirdweb/actions/usdc";
import {
  assertStellarDepositMemo,
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
  getChainName,
  useOneClickQuote,
  useTokenIcons,
} from "@/hooks/use-oneclick";
import { useUSDCBalance } from "@/hooks/use-usdc";
import { analytics, EVENTS } from "@/lib/analytics";
import {
  getUserFacingErrorMessage,
  isUserCancellation,
} from "@/lib/user-facing-error";
import { formatDisplayAmount } from "@/lib/utils";
import { isValidChainAddress } from "./address-validation";

// ---------------------------------------------------------------------------
// Chain selector — pill trigger + searchable bottom drawer
// ---------------------------------------------------------------------------

function ChainIcon({
  chain,
  className = "size-6",
}: {
  chain: string;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  const url = getChainIconUrl(chain);
  if (!url || failed) {
    return (
      <span
        className={`${className} flex shrink-0 items-center justify-center rounded-full bg-muted font-semibold text-[10px] uppercase`}>
        {chain.slice(0, 2)}
      </span>
    );
  }
  return (
    <img
      src={url}
      alt={chain}
      className={`${className} shrink-0 rounded-full bg-muted object-cover`}
      onError={() => setFailed(true)}
    />
  );
}

type ChainSelectorProps = {
  chains: string[];
  selected: string | null;
  onSelect: (chain: string) => void;
};

function ChainSelector({ chains, selected, onSelect }: ChainSelectorProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return query
      ? chains.filter(
          (chain) =>
            chain.toLowerCase().includes(query) ||
            getChainName(chain).toLowerCase().includes(query),
        )
      : chains;
  }, [chains, search]);

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>
        <button
          type="button"
          className="flex h-14 w-full items-center gap-2 rounded-xl bg-primary/10 px-3 text-left">
          {selected ? (
            <>
              <ChainIcon chain={selected} />
              <span className="font-semibold text-sm">
                {getChainName(selected)}
              </span>
            </>
          ) : (
            <span className="font-medium text-sm">
              {t("BRIDGE_SELECT_CHAIN")}
            </span>
          )}
          <ChevronDownIcon className="ml-auto size-4 text-muted-foreground" />
        </button>
      </DrawerTrigger>
      <DrawerContent className="max-h-[80vh]">
        <DrawerHeader>
          <DrawerTitle>{t("BRIDGE_SELECT_CHAIN")}</DrawerTitle>
        </DrawerHeader>
        <div className="px-4 pb-2">
          <Input
            placeholder={t("BRIDGE_SEARCH_CHAIN")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="no-scrollbar overflow-y-auto px-2 pb-6">
          {filtered.map((chain) => (
            <button
              key={chain}
              type="button"
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left hover:bg-accent"
              onClick={() => {
                onSelect(chain);
                setSearch("");
                setOpen(false);
              }}>
              <ChainIcon chain={chain} className="size-8" />
              <span className="font-semibold text-sm">
                {getChainName(chain)}
              </span>
            </button>
          ))}
          {filtered.length === 0 && (
            <p className="px-3 py-6 text-center text-muted-foreground text-sm">
              {t("BRIDGE_NO_CHAINS_FOUND")}
            </p>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
}

// ---------------------------------------------------------------------------
// Token selector — pill trigger + searchable bottom drawer
// ---------------------------------------------------------------------------

// Canonical stablecoin symbols surfaced first in the token list.
const STABLECOIN_SYMBOLS = new Set([
  "USDC",
  "USDT",
  "DAI",
  "USDE",
  "PYUSD",
  "FDUSD",
  "TUSD",
  "USDS",
  "GHO",
  "CRVUSD",
  "USDD",
  "FRAX",
  "LUSD",
  "USD1",
]);

// 1Click blockchain slug → native token symbol, surfaced right after
// stablecoins in the token list.
const NATIVE_SYMBOLS: Record<string, string> = {
  abs: "ETH",
  aptos: "APT",
  arb: "ETH",
  avax: "AVAX",
  base: "ETH",
  bera: "BERA",
  bsc: "BNB",
  btc: "BTC",
  cardano: "ADA",
  doge: "DOGE",
  eth: "ETH",
  gnosis: "XDAI",
  ltc: "LTC",
  monad: "MON",
  movement: "MOVE",
  near: "NEAR",
  op: "ETH",
  plasma: "XPL",
  pol: "POL",
  scroll: "ETH",
  sol: "SOL",
  stellar: "XLM",
  sui: "SUI",
  ton: "TON",
  tron: "TRX",
  xlayer: "OKB",
  xrp: "XRP",
  zec: "ZEC",
};

// Ordering group: 0 = stablecoin, 1 = native token, 2 = everything else.
function tokenSortRank(token: OneClickToken): number {
  const symbol = token.symbol.toUpperCase();
  if (STABLECOIN_SYMBOLS.has(symbol)) return 0;
  if (NATIVE_SYMBOLS[token.blockchain] === symbol) return 1;
  return 2;
}

type TokenSelectorProps = {
  tokens: OneClickToken[];
  selected: OneClickToken | null;
  onSelect: (token: OneClickToken) => void;
  getTokenIconUrl: (token: OneClickToken) => string | undefined;
  disabled?: boolean;
};

function TokenSelector({
  tokens,
  selected,
  onSelect,
  getTokenIconUrl,
  disabled = false,
}: TokenSelectorProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    const list = query
      ? tokens.filter(
          (token) =>
            token.symbol.toLowerCase().includes(query) ||
            token.blockchain.toLowerCase().includes(query),
        )
      : tokens;
    return [...list].sort(
      (a, b) =>
        tokenSortRank(a) - tokenSortRank(b) ||
        a.symbol.localeCompare(b.symbol) ||
        a.blockchain.localeCompare(b.blockchain),
    );
  }, [tokens, search]);

  return (
    <Drawer open={open} onOpenChange={disabled ? undefined : setOpen}>
      <DrawerTrigger asChild>
        <button
          type="button"
          disabled={disabled}
          className="flex h-14 items-center gap-2 rounded-xl bg-primary/10 px-3 text-left disabled:opacity-50">
          {selected ? (
            <>
              <TokenIcon
                symbol={selected.symbol}
                iconUrl={getTokenIconUrl(selected)}
                chainIconUrl={getChainIconUrl(selected.blockchain)}
                className="size-9"
              />
              <span className="flex flex-col leading-tight">
                <span className="font-semibold text-sm">{selected.symbol}</span>
                <span className="text-muted-foreground text-xs">
                  {getChainName(selected.blockchain)}
                </span>
              </span>
            </>
          ) : (
            <span className="font-medium text-sm">
              {t("BRIDGE_SELECT_TOKEN")}
            </span>
          )}
          <ChevronDownIcon className="size-4 text-muted-foreground" />
        </button>
      </DrawerTrigger>
      <DrawerContent className="max-h-[80vh]">
        <DrawerHeader>
          <DrawerTitle>{t("BRIDGE_SELECT_TOKEN")}</DrawerTitle>
        </DrawerHeader>
        <div className="px-4 pb-2">
          <Input
            placeholder={t("BRIDGE_SEARCH_TOKEN")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="no-scrollbar overflow-y-auto px-2 pb-6">
          {filtered.map((token) => (
            <button
              key={token.assetId}
              type="button"
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left hover:bg-accent"
              onClick={() => {
                onSelect(token);
                setSearch("");
                setOpen(false);
              }}>
              <TokenIcon
                symbol={token.symbol}
                iconUrl={getTokenIconUrl(token)}
                chainIconUrl={getChainIconUrl(token.blockchain)}
                className="size-9"
              />
              <span className="flex flex-col">
                <span className="font-semibold text-sm">{token.symbol}</span>
                <span className="text-muted-foreground text-xs">
                  {getChainName(token.blockchain)}
                </span>
              </span>
            </button>
          ))}
          {filtered.length === 0 && (
            <p className="px-3 py-6 text-center text-muted-foreground text-sm">
              {t("BRIDGE_NO_TOKENS_FOUND")}
            </p>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
}

type Direction = "deposit" | "withdraw";

function UsdcBadge({
  iconUrl,
  address,
}: {
  iconUrl: string | undefined;
  address?: string;
}) {
  return (
    <span className="flex min-h-14 min-w-0 items-center gap-2 rounded-xl bg-primary/10 px-3">
      <TokenIcon
        symbol="USDC"
        iconUrl={iconUrl}
        chainIconUrl={getChainIconUrl("base")}
      />
      <span className="flex min-w-0 flex-col leading-tight">
        <div className="flex flex-row items-center gap-1">
          <span className="font-semibold text-sm">USDC</span>
          <span className="text-muted-foreground text-xs">(Base)</span>
        </div>

        {address && (
          <span className="truncate text-muted-foreground text-xs">
            {`${address.slice(0, 6)}…${address.slice(-4)}`}
          </span>
        )}
      </span>
    </span>
  );
}

function formatUsd(value: string | null | undefined): string | null {
  if (!value) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? `$${parsed.toFixed(2)}` : null;
}

// Convert a user-entered decimal amount to base units, guarding to plain
// decimals and returning null for malformed or zero input so the CTA can gate.
function toBaseUnits(value: string, decimals: number): string | null {
  const trimmed = value.trim();
  if (!/^\d+(?:\.\d+)?$/.test(trimmed)) return null;
  const units = parseUnits(trimmed, decimals);
  return units === 0n ? null : units.toString();
}

/**
 * 1Click errors are either already localized by `humanizeError` (invalid
 * recipient / refund address, missing Stellar memo) or raw API text. Only the
 * former are shown as-is; everything else gets a plain-language message.
 */
function getBridgeErrorMessage(
  t: (key: string) => string,
  error: unknown,
  fallbackKey: string,
  context?: "send",
): string {
  const message = error instanceof Error ? error.message : "";
  const passthrough = [
    t("BRIDGE_RECIPIENT_INVALID"),
    t("BRIDGE_REFUND_ADDRESS_INVALID"),
    t("BRIDGE_STELLAR_MEMO_MISSING"),
  ];
  if (message && passthrough.includes(message)) return message;
  if (/amount is too low|too low/i.test(message)) {
    return t("PAYF_BRIDGE_AMOUNT_TOO_LOW");
  }
  return getUserFacingErrorMessage(
    t as Parameters<typeof getUserFacingErrorMessage>[0],
    error,
    { fallbackKey, context },
  );
}

type SwapFormProps = {
  account: Account;
  tokens: OneClickToken[];
  onBridgeCreated: (bridge: PendingBridge) => void;
  initialDirection?: Direction;
};

/**
 * Zashi-style swap form for the 1Click bridge. USDC on Base is the fixed
 * hub side; the flip button switches between:
 * - withdraw: USDC (from) → token (to), recipient address on the dest chain
 * - deposit:  token (from) → USDC (to), refund address on the origin chain
 */
export function SwapForm({
  account,
  tokens,
  onBridgeCreated,
  initialDirection,
}: SwapFormProps) {
  const { t } = useTranslation();
  const direction: Direction = initialDirection ?? "withdraw";
  const [chain, setChain] = useState<string | null>(null);
  const [token, setToken] = useState<OneClickToken | null>(null);
  const [amountText, setAmountText] = useState("");
  const [address, setAddress] = useState(""); // recipient (withdraw) / refundTo (deposit)
  const [slippageBps, setSlippageBps] = useState(DEFAULT_SLIPPAGE_BPS);
  const [slippageOpen, setSlippageOpen] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);
  const { usdcBalance } = useUSDCBalance();
  const { getTokenIconUrl } = useTokenIcons(tokens);
  const usdcIconUrl = getTokenIconUrl({ coingeckoId: "usd-coin" });

  const chains = useMemo(
    () =>
      [...new Set(tokens.map((t) => t.blockchain))]
        .filter((c) => c !== "stellar")
        .sort(),
    [tokens],
  );
  const chainTokens = useMemo(
    () => (chain ? tokens.filter((t) => t.blockchain === chain) : []),
    [tokens, chain],
  );

  const isWithdraw = direction === "withdraw";
  const amount = isWithdraw
    ? toBaseUnits(amountText, 6)
    : token
      ? toBaseUnits(amountText, token.decimals)
      : null;

  const insufficientFunds =
    isWithdraw && usdcBalance !== undefined && Number(amountText) > usdcBalance;

  // The address lives on the selected (non-Base) chain in both directions:
  // the recipient when withdrawing, the refund address when depositing.
  const addressChain = token?.blockchain ?? chain;
  const trimmedAddress = address.trim();
  const isAddressValid =
    !!addressChain && isValidChainAddress(addressChain, trimmedAddress);
  const showAddressError = trimmedAddress.length > 0 && !isAddressValid;
  const flowType = isWithdraw ? "bridge_withdraw" : "bridge_deposit";

  const handlePasteAddress = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) setAddress(text.trim());
    } catch {
      toast.error(t("PAYF_PASTE_FAILED"));
    }
  };

  const quoteParams =
    token && amount && isAddressValid
      ? isWithdraw
        ? {
            originAsset: BASE_USDC_ASSET_ID,
            originBlockchain: "base",
            destinationAsset: token.assetId,
            amount,
            recipient: trimmedAddress,
            refundTo: account.address,
            slippageBps,
          }
        : {
            originAsset: token.assetId,
            originBlockchain: token.blockchain,
            destinationAsset: BASE_USDC_ASSET_ID,
            amount,
            recipient: account.address,
            refundTo: trimmedAddress,
            slippageBps,
          }
      : null;

  const dryQuote = useOneClickQuote(quoteParams);
  const quote = dryQuote.data?.quote;
  const quoteErrorMessage = dryQuote.error
    ? getBridgeErrorMessage(t, dryQuote.error, "PAYF_BRIDGE_QUOTE_FAILED")
    : null;

  // A click only waits on an in-flight quote; a failed or stale one is
  // re-fetched, then the review opens once a quote is in hand.
  const isGettingQuote = dryQuote.isFetching && !quote;
  const handleGetQuote = async () => {
    const openReview = () => {
      analytics.track(EVENTS.TRANSACTION, {
        transaction_type: flowType,
        status: "review_opened",
        chain: addressChain ?? undefined,
      });
      setReviewOpen(true);
    };
    if (quote && !dryQuote.error) {
      openReview();
      return;
    }
    const result = await dryQuote.refetch();
    if (result.data?.quote && !result.error) {
      openReview();
      return;
    }
    toast.error(
      getBridgeErrorMessage(t, result.error, "PAYF_BRIDGE_QUOTE_FAILED"),
    );
  };

  useEffect(() => {
    if (!quoteErrorMessage) return;
    analytics.track(EVENTS.TRANSACTION, {
      transaction_type: flowType,
      status: "quote_error",
      chain: addressChain ?? undefined,
    });
  }, [quoteErrorMessage, flowType, addressChain]);

  const rate =
    quote && Number(quote.amountInFormatted) > 0
      ? Number(quote.amountOutFormatted) / Number(quote.amountInFormatted)
      : null;
  const fromSymbol = isWithdraw ? "USDC" : (token?.symbol ?? "…");
  const toSymbol = isWithdraw ? (token?.symbol ?? "…") : "USDC";

  // Set once the USDC transfer has been submitted: a network / timeout error
  // after that point is ambiguous (the send may have landed), so the error
  // copy tells the user to check before retrying.
  const sendAttemptedRef = useRef(false);
  const swap = useMutation({
    mutationFn: async () => {
      sendAttemptedRef.current = false;
      if (!quoteParams || !token) throw new Error("Missing quote inputs");
      const response = await getQuote(buildQuoteRequest(quoteParams, false));
      const { depositAddress, depositMemo } = response.quote;
      if (!depositAddress) throw new Error("No deposit address returned");
      // Never surface a Stellar deposit address without its memo — a memo-less
      // Stellar deposit is never credited by 1Click.
      assertStellarDepositMemo({
        originAsset: quoteParams.originAsset,
        originBlockchain: quoteParams.originBlockchain,
        depositMemo,
      });

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
        sendAttemptedRef.current = true;
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
        toast.success(t("PAYF_BRIDGE_USDC_SENT"), {
          description: t("PAYF_BRIDGE_USDC_SENT_DESCRIPTION"),
        });
      }
    },
    onError: (error) => {
      console.error("Bridge failed", error);
      analytics.track(EVENTS.TRANSACTION, {
        transaction_type: flowType,
        status: "failed",
        chain: addressChain ?? undefined,
        cancelled: isUserCancellation(error),
      });
      if (isUserCancellation(error)) {
        toast.info(t("ERROR_USER_CANCELLED_DESCRIPTION"));
        return;
      }
      toast.error(t("PAYF_BRIDGE_SEND_FAILED"), {
        description: getBridgeErrorMessage(
          t,
          error,
          "ERROR_GENERIC_DESCRIPTION",
          sendAttemptedRef.current ? "send" : undefined,
        ),
      });
    },
  });

  const chainSelector = (
    <ChainSelector
      chains={chains}
      selected={chain}
      onSelect={(next) => {
        setChain(next);
        setToken(null);
      }}
    />
  );

  const fromRow = (
    <div className="flex items-center justify-between gap-3">
      {isWithdraw ? (
        <UsdcBadge iconUrl={usdcIconUrl} />
      ) : (
        <TokenSelector
          tokens={chainTokens}
          selected={token}
          onSelect={setToken}
          getTokenIconUrl={getTokenIconUrl}
          disabled={!chain}
        />
      )}
      <Input
        inputMode="decimal"
        placeholder="0.00"
        value={amountText}
        onChange={(e) => setAmountText(e.target.value)}
        className={`h-14 max-w-34 rounded-xl border-0 bg-primary/10 text-right font-semibold text-2xl ${
          insufficientFunds ? "border border-destructive text-destructive" : ""
        }`}
      />
    </div>
  );

  // Long outputs (e.g. "0.000560483" ETH) shrink instead of being clipped
  // next to the token selector on narrow phones.
  const amountOutDisplay = quote
    ? formatDisplayAmount(quote.amountOutFormatted, 4)
    : "0.00";
  const amountOutSizeClass =
    amountOutDisplay.length <= 6
      ? "text-3xl"
      : amountOutDisplay.length <= 8
        ? "text-2xl"
        : "text-xl";

  const toRow = (
    <div className="flex items-center justify-between gap-3">
      {isWithdraw ? (
        <TokenSelector
          tokens={chainTokens}
          selected={token}
          onSelect={setToken}
          getTokenIconUrl={getTokenIconUrl}
          disabled={!chain}
        />
      ) : (
        <UsdcBadge iconUrl={usdcIconUrl} address={account.address} />
      )}
      <span
        className={`min-w-0 truncate text-right font-semibold ${amountOutSizeClass}`}
        title={quote?.amountOutFormatted}>
        {amountOutDisplay}
      </span>
    </div>
  );

  const addressChainName = addressChain ? getChainName(addressChain) : null;
  const addressInput = (
    <div className="flex flex-col gap-2">
      <span className="flex items-center gap-1.5 font-medium">
        {isWithdraw
          ? addressChainName
            ? t("PAYF_BRIDGE_RECIPIENT_ADDRESS_ON", { chain: addressChainName })
            : t("ADDRESS")
          : t("BRIDGE_REFUND_ADDRESS")}
      </span>
      <div className="relative">
        <Input
          placeholder={`${
            addressChainName
              ? t("BRIDGE_ADDRESS_PLACEHOLDER", { chain: addressChainName })
              : t("ADDRESS")
          }…`}
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          aria-invalid={showAddressError}
          autoComplete="off"
          autoCapitalize="off"
          autoCorrect="off"
          spellCheck={false}
          className={`h-14 rounded-xl border-0 bg-primary/10 pr-24 font-mono text-sm ${
            showAddressError ? "border border-destructive" : ""
          }`}
        />
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="-translate-y-1/2 absolute top-1/2 right-2 gap-1"
          onClick={handlePasteAddress}>
          <ClipboardPasteIcon className="size-4" />
          {t("PAYF_PASTE")}
        </Button>
      </div>
      {showAddressError && (
        <p className="text-destructive text-sm">
          {t("PAYF_BRIDGE_ADDRESS_FORMAT_INVALID", {
            chain: addressChainName ?? "",
          })}
        </p>
      )}
      {!isWithdraw && (
        <p className="text-muted-foreground text-sm">
          {t("PAYF_BRIDGE_REFUND_ADDRESS_EXPLAINER", {
            chain: addressChainName ?? t("PAYF_BRIDGE_ORIGIN_CHAIN"),
          })}
        </p>
      )}
    </div>
  );

  return (
    <div className="flex flex-col gap-5">
      {/* From */}
      <div className="flex flex-col gap-3 rounded-2xl bg-primary/10 p-4">
        <div className="flex items-center justify-between">
          <span className="font-medium">{t("FROM")}</span>
          {isWithdraw && usdcBalance !== undefined && (
            <span
              className={`text-sm ${insufficientFunds ? "text-destructive" : "text-muted-foreground"}`}>
              {t("BRIDGE_SPENDABLE", { balance: usdcBalance.toFixed(4) })}
            </span>
          )}
        </div>
        {!isWithdraw && chainSelector}
        {fromRow}
        <div className="flex flex-col items-end gap-1">
          {formatUsd(quote?.amountInUsd) && (
            <span className="text-muted-foreground text-sm">
              {formatUsd(quote?.amountInUsd)}
            </span>
          )}
          {insufficientFunds && (
            <span className="text-destructive text-sm">
              {t("BRIDGE_INSUFFICIENT_FUNDS")}
            </span>
          )}
        </div>
        {!isWithdraw && addressInput}
      </div>

      {/* Direction indicator */}
      <div className="-my-3 relative z-10 flex items-center justify-center">
        <div className="rounded-full bg-primary p-3 text-primary-foreground">
          <ArrowDownIcon className="size-4" />
        </div>
      </div>

      {/* To */}
      <div className="flex flex-col gap-3 rounded-2xl bg-primary/10 p-4">
        <span className="font-medium">{t("TO")}</span>
        {isWithdraw && chainSelector}
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
          <span className="text-muted-foreground">
            {t("BRIDGE_SLIPPAGE_TOLERANCE")}
          </span>
          <button
            type="button"
            className="flex items-center gap-1.5 rounded-xl bg-muted px-3 py-1.5 text-sm transition-colors hover:bg-muted/80"
            onClick={() => setSlippageOpen(true)}>
            {slippageBps / 100}%
            <SettingsIcon className="size-3.5 text-muted-foreground" />
          </button>
        </div>
        {slippageOpen && (
          <NearIntentSlippageSheet
            open={slippageOpen}
            onOpenChange={setSlippageOpen}
            valueBps={slippageBps}
            onConfirm={setSlippageBps}
          />
        )}
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">{t("BRIDGE_RATE")}</span>
          <span className="text-sm">
            {rate ? `1 ${fromSymbol} = ${rate.toFixed(4)} ${toSymbol}` : "—"}
          </span>
        </div>
        {quoteErrorMessage && (
          <p className="text-destructive text-sm">{quoteErrorMessage}</p>
        )}
      </div>

      {/* Sticky so picking a chain (address field, hints, errors) never
          pushes the button below the fold on short screens. */}
      <div className="sticky bottom-0 z-10 bg-background pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
        <Button
          size="lg"
          className="h-14 w-full rounded-xl text-base"
          // Clickable as soon as the form is valid: a loading or failed
          // background quote must not leave the user with a dead button.
          disabled={
            !quoteParams ||
            insufficientFunds ||
            swap.isPending ||
            isGettingQuote
          }
          onClick={handleGetQuote}>
          {swap.isPending ? (
            isWithdraw ? (
              t("BRIDGE_WITHDRAWING")
            ) : (
              t("BRIDGE_CREATING")
            )
          ) : isGettingQuote ? (
            <>
              <Loader2Icon className="size-4 animate-spin" />
              {t("LOADING")}
            </>
          ) : (
            t("BRIDGE_GET_QUOTE")
          )}
        </Button>
      </div>

      {quote && token && (
        <NearIntentReviewSheet
          open={reviewOpen}
          onOpenChange={setReviewOpen}
          from={{
            symbol: fromSymbol,
            blockchain: getChainName(isWithdraw ? "base" : token.blockchain),
            iconUrl: isWithdraw ? usdcIconUrl : getTokenIconUrl(token),
            chainIconUrl: getChainIconUrl(
              isWithdraw ? "base" : token.blockchain,
            ),
            amount: quote.amountInFormatted,
            usd: quote.amountInUsd ?? null,
          }}
          to={{
            symbol: toSymbol,
            blockchain: getChainName(isWithdraw ? token.blockchain : "base"),
            iconUrl: isWithdraw ? getTokenIconUrl(token) : usdcIconUrl,
            chainIconUrl: getChainIconUrl(
              isWithdraw ? token.blockchain : "base",
            ),
            amount: quote.amountOutFormatted,
            usd: quote.amountOutUsd ?? null,
          }}
          slippageBps={slippageBps}
          pending={swap.isPending}
          addressCheck={{
            label: isWithdraw
              ? t("PAYF_BRIDGE_RECIPIENT")
              : t("BRIDGE_REFUND_ADDRESS"),
            address: trimmedAddress,
            chainName: getChainName(token.blockchain),
          }}
          onConfirm={() => {
            analytics.track(EVENTS.TRANSACTION, {
              transaction_type: flowType,
              status: "confirmed",
              chain: token.blockchain,
            });
            setReviewOpen(false);
            swap.mutate();
          }}
        />
      )}
    </div>
  );
}
