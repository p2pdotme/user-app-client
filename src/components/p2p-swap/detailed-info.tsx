import { useQuery } from "@tanstack/react-query";
import { AlertCircle, Check, Coins, Copy, RefreshCw } from "lucide-react";
import { useState } from "react";
import { erc20Abi, formatUnits } from "viem";
import { useActiveAccount } from "thirdweb/react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useSafeDynamicContext } from "@/contexts";
import { viemPublicClient } from "@/core/adapters/thirdweb";
import { P2P_TOKEN_DECIMALS } from "@/core/jupiter/config";
import { EVM_CHAIN, getNttContracts, SOLANA_CHAIN } from "@/core/wormhole/config";
import { cn } from "@/lib/utils";

// ── Fetchers ───────────────────────────────────────────────────────────────────

async function fetchEvmP2PBalance(
  address: `0x${string}`,
): Promise<{ balance: bigint; decimals: number }> {
  const token = getNttContracts(EVM_CHAIN).token as `0x${string}`;

  const [balance, decimals] = await Promise.all([
    viemPublicClient.readContract({ address: token, abi: erc20Abi, functionName: "balanceOf", args: [address] }),
    viemPublicClient.readContract({ address: token, abi: erc20Abi, functionName: "decimals" }),
  ]);
  return { balance, decimals };
}

async function fetchSolanaP2PBalance(
  walletAddress: string,
): Promise<{ balance: bigint; decimals: number }> {
  const mintAddress = getNttContracts(SOLANA_CHAIN).token;
  const rpcUrl = import.meta.env.VITE_SOLANA_RPC_URL || "https://api.mainnet-beta.solana.com";
  console.log("[P2P Balance] Solana RPC:", rpcUrl, "mint:", mintAddress, "wallet:", walletAddress);
  const res = await fetch(rpcUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: 1,
      method: "getTokenAccountsByOwner",
      params: [walletAddress, { mint: mintAddress }, { encoding: "jsonParsed" }],
    }),
  });
  const json = await res.json();
  console.log("[P2P Balance] Solana RPC response:", JSON.stringify(json));
  const accounts: unknown[] = json.result?.value ?? [];
  if (accounts.length === 0) return { balance: 0n, decimals: P2P_TOKEN_DECIMALS };
  // biome-ignore lint/suspicious/noExplicitAny: Solana RPC response shape
  const info = (accounts[0] as any).account.data.parsed.info;
  return {
    balance: BigInt(info.tokenAmount.amount),
    decimals: info.tokenAmount.decimals,
  };
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function fmtTokens(raw: bigint, decimals: number): string {
  return Number(formatUnits(raw, decimals)).toLocaleString(undefined, {
    maximumFractionDigits: 4,
  });
}

// ── Row ────────────────────────────────────────────────────────────────────────

function Row({
  label,
  value,
  valueClassName,
  copyText,
}: {
  label: string;
  value: string;
  valueClassName?: string;
  copyText?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="shrink-0 text-muted-foreground text-xs">{label}</span>
      <div className="flex items-center">
        <span className={cn("text-right text-xs font-medium", valueClassName)}>
          {value}
        </span>
        {copyText && <CopyButton text={copyText} />}
      </div>
    </div>
  );
}

// ── CopyButton ────────────────────────────────────────────────────────────────

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="ml-1 shrink-0 rounded p-0.5 text-muted-foreground hover:text-foreground"
    >
      {copied ? <Check className="size-3 text-success" /> : <Copy className="size-3" />}
    </button>
  );
}

// ── Component ──────────────────────────────────────────────────────────────────

export function P2PTokenBalances() {
  const evmAccount = useActiveAccount();
  const { primaryWallet } = useSafeDynamicContext();
  const solanaAddress = primaryWallet?.address ?? null;

  const evmQuery = useQuery({
    queryKey: ["p2p-balance-evm", evmAccount?.address],
    queryFn: () => fetchEvmP2PBalance(evmAccount!.address as `0x${string}`),
    enabled: !!evmAccount?.address,
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });

  const solanaQuery = useQuery({
    queryKey: ["p2p-balance-solana", solanaAddress],
    queryFn: () => fetchSolanaP2PBalance(solanaAddress!),
    enabled: !!solanaAddress,
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });

  const isFetching = evmQuery.isFetching || solanaQuery.isFetching;
  const isLoading =
    (!!evmAccount?.address && evmQuery.isLoading) ||
    (!!solanaAddress && solanaQuery.isLoading);

  return (
    <Card className="border-none bg-primary/10 shadow-none">
      <CardContent className="px-4 py-3">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Coins className="size-3.5 text-muted-foreground" />
            <span className="font-semibold text-sm">P2P Token Balances</span>
          </div>
          <button
            type="button"
            onClick={() => {
              evmQuery.refetch();
              solanaQuery.refetch();
            }}
            disabled={isFetching}
            className="rounded p-1 hover:bg-muted disabled:opacity-50"
          >
            <RefreshCw
              className={cn("size-3 text-muted-foreground", isFetching && "animate-spin")}
            />
          </button>
        </div>

        {isLoading ? (
          <div className="flex flex-col gap-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {/* EVM */}
            {evmAccount?.address ? (
              <>
                <Row
                  label={`Address · ${EVM_CHAIN}`}
                  value={`${evmAccount.address.slice(0, 6)}…${evmAccount.address.slice(-4)}`}
                  valueClassName="font-mono text-muted-foreground"
                  copyText={evmAccount.address}
                />
                {evmQuery.isError ? (
                  <div className="flex items-center gap-1.5 text-xs text-destructive">
                    <AlertCircle className="size-3 shrink-0" />
                    <span>P2P · {EVM_CHAIN} unavailable</span>
                  </div>
                ) : (
                  <Row
                    label={`P2P · ${EVM_CHAIN}`}
                    value={evmQuery.data ? `${fmtTokens(evmQuery.data.balance, evmQuery.data.decimals)} P2P` : "—"}
                    valueClassName={evmQuery.data && evmQuery.data.balance > 0n ? "text-foreground" : "text-muted-foreground"}
                  />
                )}
              </>
            ) : (
              <Row label={`P2P · ${EVM_CHAIN}`} value="Wallet not connected" valueClassName="text-muted-foreground" />
            )}

            {/* Solana */}
            {solanaAddress ? (
              <>
                <Row
                  label="Address · Solana"
                  value={`${solanaAddress.slice(0, 6)}…${solanaAddress.slice(-4)}`}
                  valueClassName="font-mono text-muted-foreground"
                  copyText={solanaAddress}
                />
                {solanaQuery.isError ? (
                  <div className="flex items-center gap-1.5 text-xs text-destructive">
                    <AlertCircle className="size-3 shrink-0" />
                    <span>P2P · Solana unavailable</span>
                  </div>
                ) : (
                  <Row
                    label="P2P · Solana"
                    value={solanaQuery.data ? `${fmtTokens(solanaQuery.data.balance, solanaQuery.data.decimals)} P2P` : "—"}
                    valueClassName={solanaQuery.data && solanaQuery.data.balance > 0n ? "text-foreground" : "text-muted-foreground"}
                  />
                )}
              </>
            ) : (
              <Row label="P2P · Solana" value="Wallet not connected" valueClassName="text-muted-foreground" />
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
