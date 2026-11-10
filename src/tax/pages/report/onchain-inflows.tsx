import { CheckCircle2, Trash2 } from "lucide-react";
import { useState } from "react";
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
import type { OnchainMove } from "@/tax/core/onchain";
import type { LawVersion, ManualLot, ReceiptType } from "@/tax/core/types";
import { D, parseAmount, sum, ZERO } from "@/tax/lib/decimal";
import { formatDateTimeIst, formatInr, formatUsdc } from "@/tax/lib/format";
import { istDateString } from "@/tax/lib/fy";
import { newId } from "@/tax/lib/manual-data";
import { AddressLink, SwapBadge, TxLink } from "./onchain-outflows";
import { RECEIPT_LABEL, RECEIPT_OPTIONS, receiptOption } from "./receipt-types";

type Source = Exclude<ReceiptType, "UNKNOWN">;

function RecordForm({ move }: { move: OnchainMove }) {
  const { data, setLots } = useTaxSettings();
  const [type, setType] = useState<Source>("EXCHANGE");
  const [price, setPrice] = useState("");
  const [touched, setTouched] = useState(false);
  const unit = parseAmount(price);
  const valid = unit?.greaterThan(0);
  const option = receiptOption(type);

  const save = () => {
    setTouched(true);
    if (!valid || unit === null) return;
    const lot: ManualLot = {
      id: newId(),
      kind: "EXTERNAL",
      date: istDateString(move.time),
      qty: move.qty.toFixed(6),
      cost: move.qty.mul(unit).toFixed(2),
      source: type,
      costUnknown: false,
      note: `On-chain receipt from ${move.counterparty}`,
      txRef: move.id,
    };
    setLots([...data.lots, lot]);
  };

  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={`in-${move.id}`} className="text-xs">
        How did it come in?
      </Label>
      <Select value={type} onValueChange={(v) => setType(v as Source)}>
        <SelectTrigger
          id={`in-${move.id}`}
          aria-label="How it came in"
          className="h-10 w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {RECEIPT_OPTIONS.map((o) => (
            <SelectItem key={o.value} value={o.value}>
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {option && <p className="text-muted-foreground text-xs">{option.hint}</p>}
      <Label htmlFor={`price-${move.id}`} className="text-xs">
        {option?.priceLabel ?? "Price per USDC (₹)"}
      </Label>
      <div className="flex gap-2">
        <Input
          id={`price-${move.id}`}
          inputMode="decimal"
          placeholder="e.g. 88.50"
          value={price}
          aria-invalid={touched && !valid}
          onChange={(e) => setPrice(e.target.value)}
          className="h-10"
        />
        <Button onClick={save}>Save</Button>
      </div>
      {touched && !valid && (
        <p className="text-destructive text-xs">Enter a price, e.g. 88.50</p>
      )}
      {valid && unit && (
        <p className="text-muted-foreground text-xs">
          Cost of this USDC: {formatInr(move.qty.mul(unit))}
        </p>
      )}
    </div>
  );
}

function InflowRow({
  move,
  lot,
}: {
  move: OnchainMove;
  lot: ManualLot | undefined;
}) {
  const { data, setLots } = useTaxSettings();
  return (
    <li
      data-testid="inflow-row"
      className="flex flex-col gap-3 rounded-lg border bg-card p-3">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <span className="font-medium tabular-nums">
          {formatUsdc(move.qty)} USDC
        </span>
        <span className="text-muted-foreground text-xs">
          {formatDateTimeIst(move.time)} · from{" "}
          <AddressLink address={move.counterparty} />
        </span>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <SwapBadge move={move} />
        <TxLink hash={move.txHash} />
      </div>
      {move.swap.length > 0 && (
        <p className="text-muted-foreground text-xs">
          You got this USDC by swapping another token. Choose "Bought on an
          exchange" and enter the INR value of the USDC on that date: that is
          its cost. The token you gave up is taxed separately.
        </p>
      )}
      {lot ? (
        <div className="flex items-center justify-between gap-2 text-sm">
          <span className="inline-flex items-center gap-1.5">
            <CheckCircle2 className="size-4 text-green-600" />
            Recorded: {RECEIPT_LABEL[lot.source]},{" "}
            {formatInr(parseAmount(lot.cost) ?? ZERO)}
          </span>
          <Button
            variant="ghost"
            size="sm"
            aria-label="Remove this entry"
            onClick={() => setLots(data.lots.filter((l) => l.id !== lot.id))}>
            <Trash2 className="text-destructive" />
          </Button>
        </div>
      ) : (
        <RecordForm move={move} />
      )}
    </li>
  );
}

interface OnchainInflowsProps {
  moves: readonly OnchainMove[];
  law: LawVersion;
}

/** USDC that came in from outside P2P.me; each needs a cost. */
export function OnchainInflows({ moves, law }: OnchainInflowsProps) {
  const { data } = useTaxSettings();
  const byRef = new Map(
    data.lots.flatMap((l) => (l.txRef ? [[l.txRef, l] as const] : [])),
  );
  const unlinked = data.lots.filter((l) => !l.txRef);
  const unlinkedQty = sum(unlinked.map((l) => parseAmount(l.qty) ?? ZERO));
  const total = sum(moves.map((m) => m.qty));
  const open = moves.filter((m) => !byRef.has(m.id)).length;
  return (
    <section className="flex flex-col gap-3" aria-label="USDC received">
      <div className="flex flex-col gap-1">
        <h3 className="flex items-center gap-1 font-semibold">
          USDC received, not through P2P.me
          <InfoTip rule="RECEIPT_COST" law={law} />
        </h3>
        <p className="text-muted-foreground text-sm">
          {moves.length} receipt(s), {formatUsdc(total)} USDC.{" "}
          {open > 0
            ? `${open} without a recorded cost.`
            : "All have a recorded cost."}
        </p>
        {unlinkedQty.greaterThan(new D(0)) && (
          <p className="text-sm" data-testid="unlinked-lots">
            You already entered {formatUsdc(unlinkedQty)} USDC from outside
            P2P.me by hand. If some of the receipts below are the same USDC,
            record them here and remove the hand-typed entry in Settings, so the
            same USDC is not counted twice.
          </p>
        )}
      </div>
      <ul className="flex flex-col gap-3">
        {moves.map((m) => (
          <InflowRow key={m.id} move={m} lot={byRef.get(m.id)} />
        ))}
      </ul>
    </section>
  );
}
