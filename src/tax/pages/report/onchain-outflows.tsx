import { ArrowUpRight, ExternalLink, Repeat, Wallet } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { InfoTip } from "@/tax/components";
import { useTaxSettings } from "@/tax/contexts";
import { type OnchainMove, p2pRateNear } from "@/tax/core/onchain";
import type {
  LawVersion,
  NormalizedOrder,
  OutflowEntry,
  OutflowTreatment,
} from "@/tax/core/types";
import { EXTERNAL_HREFS } from "@/tax/lib/constants";
import { D } from "@/tax/lib/decimal";
import {
  formatDateTimeIst,
  formatInr,
  formatRate,
  formatUsdc,
} from "@/tax/lib/format";
import { AmountInputSchema } from "@/tax/lib/schemas";
import { shortAddress } from "./delivered-elsewhere-step";

const BASESCAN_ADDRESS = "https://basescan.org/address/";

export const TREATMENT_LABEL: Record<OutflowTreatment, string> = {
  OWN: "Moved to my own wallet or exchange account",
  SOLD: "Sold it, or paid for something with it",
  GIFT: "Gave it away as a gift",
};

const TREATMENT_HINT: Record<OutflowTreatment, string> = {
  OWN: "Not a transfer, so no tax here. If you sold it there later, report that sale separately. If it is a wallet, add it so your wallets are computed together.",
  SOLD: "Taxed like a sale on P2P.me: 30% on the INR value you received, less its cost.",
  GIFT: "The USDC leaves your holdings with no income for you. The person who received it may be taxed on it.",
};

const PENDING = "PENDING";

export function SwapBadge({ move }: { move: OnchainMove }) {
  if (move.swap.length === 0) return null;
  const legs = move.swap
    .map((l) => `${formatUsdc(l.amount)} ${l.symbol || "token"}`)
    .join(" + ");
  return (
    <Badge variant="outline" className="gap-1" title={legs}>
      <Repeat className="size-3" />
      Swap {move.direction === "IN" ? "of" : "for"} {legs}
    </Badge>
  );
}

export function AddressLink({ address }: { address: string }) {
  return (
    <a
      href={`${BASESCAN_ADDRESS}${address}`}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1 font-mono text-primary text-xs hover:underline">
      {shortAddress(address)}
      <ExternalLink className="size-3" />
    </a>
  );
}

export function TxLink({ hash }: { hash: string }) {
  return (
    <a
      href={`${EXTERNAL_HREFS.BASESCAN_TX}${hash}`}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="View on Basescan"
      className="inline-flex items-center gap-1 text-primary text-xs hover:underline">
      View on Basescan
      <ArrowUpRight className="size-3" />
    </a>
  );
}

interface OutflowRowProps {
  move: OnchainMove;
  saved: OutflowEntry | undefined;
  orders: readonly NormalizedOrder[];
  onAddWallet: (address: string) => void;
}

function OutflowRow({ move, saved, orders, onAddWallet }: OutflowRowProps) {
  const { setOutflow, removeOutflow } = useTaxSettings();
  const [value, setValue] = useState(saved?.consideration ?? "");
  const rate = p2pRateNear(orders, move.time);
  const treatment = saved?.treatment ?? PENDING;
  const valueOk = AmountInputSchema.safeParse(value).success;

  const save = (t: OutflowTreatment, consideration: string) =>
    setOutflow({
      id: move.id,
      txHash: move.txHash,
      at: move.time.toISOString(),
      qty: move.qty.toFixed(6),
      to: move.counterparty,
      treatment: t,
      consideration: t === "SOLD" ? consideration : "",
    });

  const choose = (v: string) => {
    if (v === PENDING) {
      removeOutflow(move.id);
      return;
    }
    const t = v as OutflowTreatment;
    // Suggest a value from the P2P.me rate around that date, but do not use
    // it until the user confirms it: a guess must not end up in the return
    const start =
      t === "SOLD" && value === "" && rate
        ? move.qty.mul(rate).toDecimalPlaces(2).toFixed(2)
        : value;
    setValue(start);
    save(t, t === "SOLD" ? (saved?.consideration ?? "") : "");
  };
  const confirmed = saved?.treatment === "SOLD" && saved.consideration !== "";

  return (
    <li
      data-testid="outflow-row"
      className="flex flex-col gap-3 rounded-lg border bg-card p-3">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <span className="font-medium tabular-nums">
          {formatUsdc(move.qty)} USDC
        </span>
        <span className="text-muted-foreground text-xs">
          {formatDateTimeIst(move.time)} · to{" "}
          <AddressLink address={move.counterparty} />
        </span>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <SwapBadge move={move} />
        <TxLink hash={move.txHash} />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor={`out-${move.id}`} className="text-xs">
          What was this?
        </Label>
        <Select value={treatment} onValueChange={choose}>
          <SelectTrigger
            id={`out-${move.id}`}
            aria-label="What was this transfer"
            className="h-10 w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={PENDING}>Not answered yet</SelectItem>
            {(Object.keys(TREATMENT_LABEL) as OutflowTreatment[]).map((t) => (
              <SelectItem key={t} value={t}>
                {TREATMENT_LABEL[t]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {treatment !== PENDING && (
          <p className="text-muted-foreground text-xs">
            {TREATMENT_HINT[treatment]}
          </p>
        )}
      </div>
      {treatment === "SOLD" && (
        <div className="flex flex-col gap-1.5">
          <Label htmlFor={`val-${move.id}`} className="text-xs">
            INR value you received (₹)
          </Label>
          <div className="flex gap-2">
            <Input
              id={`val-${move.id}`}
              inputMode="decimal"
              value={value}
              aria-invalid={!valueOk}
              onChange={(e) => setValue(e.target.value)}
              onBlur={() => {
                if (valueOk && confirmed) save("SOLD", value);
              }}
              className="h-10"
            />
            <Button
              variant={confirmed ? "outline" : "default"}
              disabled={!valueOk}
              onClick={() => save("SOLD", value)}>
              {confirmed ? "Update" : "Confirm"}
            </Button>
          </div>
          <p
            className={
              valueOk
                ? "text-muted-foreground text-xs"
                : "text-destructive text-xs"
            }>
            {!valueOk
              ? "Enter a number, e.g. 9850.00. Until then this transfer is left out."
              : confirmed
                ? `Included in your tax at ${formatInr(new D(saved.consideration))}.`
                : rate
                  ? `Suggested from your P2P.me rate around that date, ₹${formatRate(rate)} per USDC. Change it to what you actually received and press Confirm. Until then this transfer is left out.`
                  : "Enter what you received, in rupees, and press Confirm."}
          </p>
        </div>
      )}
      {treatment === "OWN" && (
        <Button
          variant="outline"
          size="sm"
          className="self-start"
          onClick={() => onAddWallet(move.counterparty)}>
          <Wallet />
          It's a wallet of mine: add it
        </Button>
      )}
    </li>
  );
}

interface OnchainOutflowsProps {
  moves: readonly OnchainMove[];
  orders: readonly NormalizedOrder[];
  law: LawVersion;
  onAddWallet: (address: string) => void;
}

/** USDC that left the wallets outside P2P.me, each to be classified. */
export function OnchainOutflows({
  moves,
  orders,
  law,
  onAddWallet,
}: OnchainOutflowsProps) {
  const { data } = useTaxSettings();
  const saved = new Map(data.outflows.map((o) => [o.id, o]));
  const total = moves.reduce((acc, m) => acc.plus(m.qty), new D(0));
  const open = moves.filter((m) => !saved.has(m.id)).length;
  return (
    <section className="flex flex-col gap-3" aria-label="USDC sent out">
      <div className="flex flex-col gap-1">
        <h3 className="flex items-center gap-1 font-semibold">
          USDC sent out, not through P2P.me
          <InfoTip rule="TRANSFER_OUT" law={law} />
        </h3>
        <p className="text-muted-foreground text-sm">
          {moves.length} transfer(s), {formatUsdc(total)} USDC.{" "}
          {open > 0
            ? `${open} not answered yet: until you answer, they are not in your tax.`
            : "All answered."}
        </p>
      </div>
      <ul className="flex flex-col gap-3">
        {moves.map((m) => (
          <OutflowRow
            key={m.id}
            move={m}
            saved={saved.get(m.id)}
            orders={orders}
            onAddWallet={onAddWallet}
          />
        ))}
      </ul>
    </section>
  );
}
