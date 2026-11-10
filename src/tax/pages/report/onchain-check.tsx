import { FileUp, Link2, Loader2, RefreshCw } from "lucide-react";
import { useId, useRef, useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { InfoTip } from "@/tax/components";
import {
  EXPLORER_HOST,
  type OnchainMove,
  type Reconciliation,
} from "@/tax/core/onchain";
import type { LawVersion, NormalizedOrder } from "@/tax/core/types";
import type { OnchainState } from "@/tax/hooks";
import { ERROR_MESSAGES } from "@/tax/lib/errors";
import { formatDateIst, formatDateTimeIst, formatUsdc } from "@/tax/lib/format";
import { fyLabel, fyOf } from "@/tax/lib/fy";
import { OnchainInflows } from "./onchain-inflows";
import { AddressLink, OnchainOutflows, TxLink } from "./onchain-outflows";

const BASESCAN_TOKEN_TXNS = (wallet: string) =>
  `https://basescan.org/address/${wallet}#tokentxns`;

interface LoaderProps {
  wallets: readonly string[];
  state: OnchainState;
}

/** Two ways in: the explorer API (sends the address), or a CSV (offline). */
function Loader({ wallets, state }: LoaderProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const inputId = useId();
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2 rounded-lg border bg-card p-4">
        <p className="font-medium">Upload the CSV from BaseScan</p>
        <ol className="list-decimal pl-5 text-muted-foreground text-sm leading-relaxed">
          <li>
            Open your wallet's token transfers on BaseScan:{" "}
            {wallets.map((w, i) => (
              <span key={w}>
                {i > 0 && ", "}
                <a
                  href={BASESCAN_TOKEN_TXNS(w)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-mono text-primary hover:underline">
                  {w.slice(0, 6)}…{w.slice(-4)}
                </a>
              </span>
            ))}
          </li>
          <li>Choose "Download Page Data" (CSV) for the full date range.</li>
          <li>Upload the file here. One file per wallet.</li>
        </ol>
        <p className="text-muted-foreground text-xs">
          The file is read in your browser. Nothing is uploaded anywhere.
        </p>
        <input
          ref={fileRef}
          id={inputId}
          type="file"
          accept=".csv,text/csv"
          multiple
          className="sr-only"
          aria-label="Token transfer CSV"
          onChange={(e) => {
            const files = Array.from(e.target.files ?? []);
            e.target.value = "";
            if (files.length > 0) void state.loadCsv(files);
          }}
        />
        <Button
          variant="outline"
          className="self-start"
          disabled={state.loading}
          onClick={() => fileRef.current?.click()}>
          <FileUp />
          Upload CSV
        </Button>
      </div>
      <div className="flex flex-col gap-2 rounded-lg border bg-card p-4">
        <p className="font-medium">Or load it automatically</p>
        <p className="text-muted-foreground text-sm">
          This sends your wallet address to {EXPLORER_HOST}, a public block
          explorer for Base, to read your token transfers. Nothing else is sent.
        </p>
        <Button
          className="self-start"
          disabled={state.loading}
          onClick={() => void state.fetchFromExplorer()}>
          {state.loading ? <Loader2 className="animate-spin" /> : <Link2 />}
          Load from {EXPLORER_HOST}
        </Button>
      </div>
    </div>
  );
}

function Summary({ rec, state }: { rec: Reconciliation; state: OnchainState }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const loaded = state.loaded;
  return (
    <div className="flex flex-col gap-2 rounded-lg border bg-card p-4 text-sm">
      <p data-testid="onchain-summary">
        {rec.usdcMoves} USDC movement(s)
        {rec.first && rec.last
          ? ` from ${formatDateIst(rec.first)} to ${formatDateIst(rec.last)}`
          : ""}
        . <strong>{rec.matched}</strong> of {rec.ordersChecked} P2P.me orders
        found on-chain.
        {rec.returned.length > 0 &&
          ` ${rec.returned.length} transfer(s) were returned in full by the same address (cancelled orders or refunds) and are left out; see the list below.`}
        {rec.internal > 0 &&
          ` ${rec.internal} move(s) between your own wallets are left out.`}
      </p>
      {loaded && (
        <p className="text-muted-foreground text-xs">
          Source:{" "}
          {loaded.source === "CSV"
            ? `${loaded.files.join(", ")}${loaded.skipped > 0 ? ` (${loaded.skipped} row(s) skipped)` : ""}`
            : EXPLORER_HOST}
          . Only USDC on Base is checked.
        </p>
      )}
      <div className="flex flex-wrap gap-2">
        {loaded?.source === "CSV" && (
          <>
            <input
              ref={fileRef}
              type="file"
              accept=".csv,text/csv"
              multiple
              className="sr-only"
              aria-label="Another token transfer CSV"
              onChange={(e) => {
                const files = Array.from(e.target.files ?? []);
                e.target.value = "";
                if (files.length > 0) void state.loadCsv(files);
              }}
            />
            <Button
              size="sm"
              variant="outline"
              onClick={() => fileRef.current?.click()}>
              <FileUp />
              Add another CSV
            </Button>
          </>
        )}
        <Button size="sm" variant="ghost" onClick={state.clear}>
          <RefreshCw />
          Start over
        </Button>
      </div>
    </div>
  );
}

function UnmatchedOrders({ orders }: { orders: readonly NormalizedOrder[] }) {
  if (orders.length === 0) return null;
  return (
    <details className="rounded-lg border bg-card p-3 text-sm">
      <summary className="cursor-pointer font-medium">
        {orders.length} P2P.me order(s) not found in these transfers
      </summary>
      <p className="mt-2 text-muted-foreground text-xs">
        Usually the file does not cover the order's date, or the USDC moved
        through another address. Check them on Basescan.
      </p>
      <ul className="mt-2 flex flex-col gap-1 text-xs">
        {orders.map((o) => (
          <li
            key={o.id}
            className="flex flex-wrap items-center gap-2 tabular-nums">
            #{o.orderId} · {formatDateTimeIst(o.date)} · {o.kind} ·{" "}
            {formatUsdc(o.qty)} USDC
            <TxLink hash={o.txHash} />
          </li>
        ))}
      </ul>
    </details>
  );
}

function Returned({ rec }: { rec: Reconciliation }) {
  if (rec.returned.length === 0) return null;
  return (
    <details
      className="rounded-lg border bg-card p-3 text-sm"
      data-testid="returned">
      <summary className="cursor-pointer font-medium">
        {rec.returned.length} transfer(s) sent out and returned in full
      </summary>
      <p className="mt-2 text-muted-foreground text-xs">
        Each was sent to an address that sent the same amount back next, such as
        a cancelled order. If one was really a sale or a payment that happened
        to match, tell your Chartered Accountant.
      </p>
      <ul className="mt-2 flex flex-col gap-1 text-xs">
        {rec.returned.map(({ out, back }) => (
          <li key={out.id} className="flex flex-wrap items-center gap-2">
            {formatUsdc(out.qty)} USDC · out {formatDateTimeIst(out.time)}, back{" "}
            {formatDateTimeIst(back.time)} ·{" "}
            <AddressLink address={out.counterparty} />
          </li>
        ))}
      </ul>
    </details>
  );
}

function Swaps({
  moves,
  law,
}: {
  moves: readonly OnchainMove[];
  law: LawVersion;
}) {
  const swaps = moves.filter((m) => m.swap.length > 0);
  if (swaps.length === 0) return null;
  return (
    <Alert variant="warning" data-testid="swaps">
      <AlertDescription className="text-foreground">
        <p className="inline-flex items-center gap-1 font-medium">
          {swaps.length} swap(s) with other tokens
          <InfoTip rule="TOKEN_SWAP" law={law} />
        </p>
        <p>
          Giving up another token for USDC (or USDC for another token) is a
          taxable transfer of the token given up. This app computes tax on USDC
          only, so work out the other token's gain with your Chartered
          Accountant.
        </p>
        <ul className="mt-1 flex flex-col gap-1 text-xs">
          {swaps.map((m) => (
            <li key={m.id} className="flex flex-wrap items-center gap-2">
              {formatDateIst(m.time)} ·{" "}
              {m.direction === "IN"
                ? `${m.swap.map((l) => `${formatUsdc(l.amount)} ${l.symbol || "token"}`).join(" + ")} → ${formatUsdc(m.qty)} USDC`
                : `${formatUsdc(m.qty)} USDC → ${m.swap.map((l) => `${formatUsdc(l.amount)} ${l.symbol || "token"}`).join(" + ")}`}
              <AddressLink address={m.counterparty} />
            </li>
          ))}
        </ul>
      </AlertDescription>
    </Alert>
  );
}

interface OnchainCheckProps {
  wallets: readonly string[];
  orders: readonly NormalizedOrder[];
  fy: number;
  law: LawVersion;
  state: OnchainState;
  rec: Reconciliation | null;
  onAddWallet: (address: string) => void;
}

/**
 * Reconciliation of the wallet's USDC transfers on Base with its P2P.me
 * orders. Lists what moved outside P2P.me so the user can account for it:
 * outflows (possible transfers) and inflows (cost to record).
 */
export function OnchainCheck({
  wallets,
  orders,
  fy,
  law,
  state,
  rec,
  onAddWallet,
}: OnchainCheckProps) {
  const [allYears, setAllYears] = useState(false);
  const checkboxId = useId();
  const inView = (m: OnchainMove) => allYears || fyOf(m.time) === fy;

  return (
    <Card className="w-full gap-5 shadow-none">
      <CardHeader className="gap-2">
        <CardTitle className="flex items-center gap-1 text-lg">
          USDC moved outside P2P.me
          <InfoTip rule="ONCHAIN_CHECK" law={law} />
        </CardTitle>
        <CardDescription className="text-foreground text-sm leading-relaxed">
          This report is built from your P2P.me orders. USDC you sent to
          someone, received from an exchange or a friend, or swapped for another
          token does not show up there. Load your wallet's transfers on Base to
          find them.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        {state.error && (
          <Alert variant="destructive">
            <AlertDescription>
              {ERROR_MESSAGES[state.error.code]}
            </AlertDescription>
          </Alert>
        )}
        {!rec ? (
          <Loader wallets={wallets} state={state} />
        ) : (
          <>
            <Summary rec={rec} state={state} />
            <div className="flex items-center gap-2">
              <Checkbox
                id={checkboxId}
                checked={allYears}
                onCheckedChange={(v) => setAllYears(v === true)}
              />
              <Label htmlFor={checkboxId} className="text-sm">
                Show all years, not only {fyLabel(fy)}
              </Label>
            </div>
            <Swaps
              moves={[...rec.inflows, ...rec.outflows].filter(inView)}
              law={law}
            />
            {rec.outflows.filter(inView).length > 0 && (
              <OnchainOutflows
                moves={rec.outflows.filter(inView)}
                orders={orders}
                law={law}
                onAddWallet={onAddWallet}
              />
            )}
            {rec.inflows.filter(inView).length > 0 && (
              <OnchainInflows moves={rec.inflows.filter(inView)} law={law} />
            )}
            {rec.outflows.filter(inView).length +
              rec.inflows.filter(inView).length ===
              0 && (
              <p className="text-sm" data-testid="onchain-clean">
                No USDC moved outside P2P.me
                {allYears ? "" : ` in ${fyLabel(fy)}`}.
              </p>
            )}
            {rec.otherTokens.length > 0 && (
              <p className="text-muted-foreground text-xs">
                Other tokens received (not checked here; an airdrop of a token
                with value is income when received):{" "}
                {rec.otherTokens
                  .slice(0, 8)
                  .map((t) => `${t.symbol} (${t.count})`)
                  .join(", ")}
                {rec.otherTokens.length > 8 ? ", …" : ""}
              </p>
            )}
            <Returned rec={rec} />
            <UnmatchedOrders orders={rec.unmatchedOrders} />
          </>
        )}
      </CardContent>
    </Card>
  );
}
