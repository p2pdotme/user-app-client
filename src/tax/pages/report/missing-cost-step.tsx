import { ArrowRight, Plus, Trash2 } from "lucide-react";
import { useId, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import type { OutsideUsdc } from "@/tax/core/tax/compute";
import type { LawVersion, ReceiptType } from "@/tax/core/types";
import { D, type Dec, sum, ZERO } from "@/tax/lib/decimal";
import {
  formatInr,
  formatIsoDate,
  formatRate,
  formatUsdc,
} from "@/tax/lib/format";
import { fyLabel, fyOf, istDateToInstant } from "@/tax/lib/fy";
import { newId } from "@/tax/lib/manual-data";
import { AmountInputSchema, IstDateInputSchema } from "@/tax/lib/schemas";
import { RECEIPT_OPTIONS, receiptOption } from "./receipt-types";

type Source = Exclude<ReceiptType, "UNKNOWN">;

interface SourceRow {
  id: string;
  type: Source;
  qty: string;
  price: string;
  date: string;
  /** GIFT_NON_RELATIVE: what the giver paid per USDC (optional) */
  giverPrice: string;
  /** GIFT_NON_RELATIVE: other gifts from non-relatives in that year (optional) */
  otherGifts: string;
}

/** "Price you paid" → "price you paid" (keeps "USDC" as written) */
const lowerFirst = (text: string): string =>
  text.charAt(0).toLowerCase() + text.slice(1);

const positive = (v: string): Dec | null => {
  const r = AmountInputSchema.safeParse(v);
  return r.success && new D(r.data).greaterThan(0) ? new D(r.data) : null;
};

function Intro({ need, qty }: { need: OutsideUsdc; qty: Dec }) {
  if (need.known.isZero()) {
    return (
      <>
        You sold or spent{" "}
        <strong data-testid="missing-usdc">{formatUsdc(qty)} USDC</strong> on
        P2P.me, but you never bought any USDC here. All of it came into your
        wallet from somewhere else, such as another wallet, an exchange, or
        before you used P2P.me.
      </>
    );
  }
  if (need.known.greaterThanOrEqualTo(need.spent)) {
    return (
      <>
        You bought <strong>{formatUsdc(need.boughtOnP2p)} USDC</strong> on
        P2P.me and sold or spent <strong>{formatUsdc(need.spent)} USDC</strong>{" "}
        there. But some of your sales happened before the purchases that could
        cover them, starting on {formatIsoDate(need.firstShortDate)}. So{" "}
        <strong data-testid="missing-usdc">{formatUsdc(qty)} USDC</strong> that
        you sold came into your wallet from somewhere else, such as another
        wallet, an exchange, or before you used P2P.me.
      </>
    );
  }
  return (
    <>
      You sold or spent <strong>{formatUsdc(need.spent)} USDC</strong> on
      P2P.me, but only <strong>{formatUsdc(need.known)} USDC</strong> came from
      purchases we know about. The other{" "}
      <strong data-testid="missing-usdc">{formatUsdc(qty)} USDC</strong> came
      into your wallet from somewhere else, such as another wallet, an exchange,
      or before you used P2P.me.
    </>
  );
}

/**
 * Required step shown INSTEAD of the tax report when the wallet sold more
 * USDC than it bought on P2P.me. The cost of that USDC depends on how it came
 * in, so we ask for the source (possibly several) rather than one price.
 */
export function MissingCostStep({
  need,
  law,
}: {
  need: OutsideUsdc;
  law: LawVersion;
}) {
  const { data, setLots, setOtherGifts } = useTaxSettings();
  const baseId = useId();
  // Round UP to 6 dp so the entries always cover every sale
  const qty = need.missing.toDecimalPlaces(6, D.ROUND_UP);
  const [rows, setRows] = useState<SourceRow[]>(() => [
    {
      id: newId(),
      type: "EXCHANGE",
      qty: qty.toFixed(6),
      price: "",
      date: need.firstShortDate,
      giverPrice: "",
      otherGifts: "",
    },
  ]);
  const [touched, setTouched] = useState(false);

  const update = (id: string, patch: Partial<SourceRow>) =>
    setRows((rs) => rs.map((r) => (r.id === id ? { ...r, ...patch } : r)));

  const allocated = sum(rows.map((r) => positive(r.qty) ?? ZERO));
  const remaining = qty.minus(allocated);
  const rowErrors = rows.map((r) => ({
    qty:
      positive(r.qty) === null ? "Enter how much USDC came in this way." : null,
    price:
      positive(r.price) === null
        ? `Enter the ${lowerFirst(receiptOption(r.type)?.priceLabel.replace(" (₹)", "") ?? "price per USDC")}, e.g. 98.50`
        : null,
    gift:
      r.type === "GIFT_NON_RELATIVE" &&
      ((r.giverPrice.trim() !== "" && positive(r.giverPrice) === null) ||
        (r.otherGifts.trim() !== "" &&
          !AmountInputSchema.safeParse(r.otherGifts).success))
        ? "Check what the giver paid and your other gifts: enter numbers only, or leave them blank."
        : null,
    date: !IstDateInputSchema.safeParse(r.date).success
      ? "Enter a valid date."
      : r.date > need.firstShortDate
        ? `This USDC must have reached you by ${formatIsoDate(need.firstShortDate)}, the date of the first sale that needed it.`
        : null,
  }));
  const hasRowError = rowErrors.some(
    (e) => e.qty || e.price || e.date || e.gift,
  );
  const remainingError = remaining.greaterThan(0)
    ? `Tell us how the remaining ${formatUsdc(remaining)} USDC came in.`
    : null;

  const submit = () => {
    setTouched(true);
    if (hasRowError || remainingError) return;
    for (const r of rows) {
      const date = istDateToInstant(r.date);
      if (r.type === "GIFT_NON_RELATIVE" && date && r.otherGifts.trim())
        setOtherGifts(fyOf(date), r.otherGifts);
    }
    setLots([
      ...data.lots,
      ...rows.map((r) => {
        const rowQty = positive(r.qty) ?? ZERO;
        const price = positive(r.price) ?? ZERO;
        const giverPrice =
          r.type === "GIFT_NON_RELATIVE" ? positive(r.giverPrice) : null;
        return {
          id: newId(),
          kind: "EXTERNAL" as const,
          date: r.date,
          qty: rowQty.toFixed(6),
          cost: rowQty.mul(price).toFixed(2),
          source: r.type,
          costUnknown: false,
          ...(giverPrice
            ? { giverCost: rowQty.mul(giverPrice).toFixed(2) }
            : {}),
          note: "Added from the 'Before we calculate your tax' step",
        };
      }),
    ]);
    toast.success("Saved", {
      description: "You can change this any time in your tax profile.",
    });
  };

  return (
    <Card className="w-full gap-5 border-primary/30 bg-primary/5 shadow-none">
      <CardHeader className="gap-2">
        <CardTitle className="text-lg">Before we calculate your tax</CardTitle>
        <CardDescription className="text-foreground text-sm leading-relaxed">
          <Intro need={need} qty={qty} />
        </CardDescription>
        <p className="text-muted-foreground text-sm leading-relaxed">
          Tax is charged on your profit: what you received minus what it cost
          you. What counts as cost depends on how the USDC came in.
        </p>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <p className="flex items-center gap-1 font-medium">
          How did this USDC come into your wallet?
          <InfoTip rule="RECEIPT_COST" law={law} />
        </p>
        {rows.map((row, i) => {
          const option = receiptOption(row.type);
          const id = `${baseId}-${i}`;
          const err = rowErrors[i];
          const total =
            positive(row.qty) && positive(row.price)
              ? (positive(row.qty) as Dec).mul(positive(row.price) as Dec)
              : null;
          return (
            <div
              key={row.id}
              data-testid="source-row"
              className="flex flex-col gap-3 rounded-lg border bg-card p-3">
              <div className="flex items-center justify-between gap-2">
                <Label htmlFor={`${id}-type`} className="text-xs">
                  {rows.length > 1 ? `Source ${i + 1}` : "Source"}
                </Label>
                {rows.length > 1 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    aria-label={`Remove source ${i + 1}`}
                    onClick={() =>
                      setRows((rs) => rs.filter((r) => r.id !== row.id))
                    }>
                    <Trash2 className="text-destructive" />
                  </Button>
                )}
              </div>
              <Select
                value={row.type}
                onValueChange={(v) => update(row.id, { type: v as Source })}>
                <SelectTrigger
                  id={`${id}-type`}
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
              {option && (
                <p className="text-muted-foreground text-xs">{option.hint}</p>
              )}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor={`${id}-qty`} className="text-xs">
                    USDC amount
                  </Label>
                  <Input
                    id={`${id}-qty`}
                    inputMode="decimal"
                    value={row.qty}
                    onChange={(e) => update(row.id, { qty: e.target.value })}
                    aria-invalid={touched && Boolean(err.qty)}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor={`${id}-price`} className="text-xs">
                    {option?.priceLabel}
                  </Label>
                  <Input
                    id={`${id}-price`}
                    inputMode="decimal"
                    placeholder="e.g. 98.50"
                    value={row.price}
                    onChange={(e) =>
                      update(row.id, { price: e.target.value.slice(0, 20) })
                    }
                    aria-invalid={touched && Boolean(err.price)}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor={`${id}-date`} className="text-xs">
                    Received on
                  </Label>
                  <Input
                    id={`${id}-date`}
                    type="date"
                    max={need.firstShortDate}
                    value={row.date}
                    onChange={(e) => update(row.id, { date: e.target.value })}
                    aria-invalid={touched && Boolean(err.date)}
                  />
                </div>
              </div>
              {row.type === "GIFT_NON_RELATIVE" && (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor={`${id}-giver`} className="text-xs">
                      What the giver paid per USDC (₹), blank if not known
                    </Label>
                    <Input
                      id={`${id}-giver`}
                      inputMode="decimal"
                      value={row.giverPrice}
                      onChange={(e) =>
                        update(row.id, {
                          giverPrice: e.target.value.slice(0, 20),
                        })
                      }
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor={`${id}-other`} className="text-xs">
                      Other gifts from non-relatives
                      {istDateToInstant(row.date)
                        ? ` in ${fyLabel(fyOf(istDateToInstant(row.date) as Date))}`
                        : " that year"}
                      , money and property (₹)
                    </Label>
                    <Input
                      id={`${id}-other`}
                      inputMode="decimal"
                      placeholder="0"
                      value={row.otherGifts}
                      onChange={(e) =>
                        update(row.id, {
                          otherGifts: e.target.value.slice(0, 30),
                        })
                      }
                    />
                  </div>
                </div>
              )}
              {touched && (err.qty || err.price || err.date || err.gift) && (
                <p role="alert" className="text-destructive text-xs">
                  {err.qty ?? err.price ?? err.date ?? err.gift}
                </p>
              )}
              {total && (
                <p className="text-sm">
                  {formatUsdc(positive(row.qty) as Dec)} USDC × ₹
                  {formatRate(positive(row.price) as Dec)} ={" "}
                  <strong>{formatInr(total)}</strong>
                </p>
              )}
            </div>
          );
        })}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              setRows((rs) => [
                ...rs,
                {
                  id: newId(),
                  type: "EXCHANGE",
                  qty: remaining.greaterThan(0) ? remaining.toFixed(6) : "",
                  price: "",
                  date: need.firstShortDate,
                  giverPrice: "",
                  otherGifts: "",
                },
              ])
            }>
            <Plus />
            It came in more than one way
          </Button>
          <span
            data-testid="remaining-usdc"
            className="text-muted-foreground text-xs">
            {remaining.greaterThan(0)
              ? `Still to explain: ${formatUsdc(remaining)} USDC`
              : "All USDC explained"}
          </span>
        </div>
        {touched && remainingError && (
          <p role="alert" className="text-destructive text-xs">
            {remainingError}
          </p>
        )}
        {need.avgBuyRate && (
          <p className="text-muted-foreground text-xs">
            For reference, your average P2P.me buy price is ₹
            {formatRate(need.avgBuyRate)}. Use your exchange, bank or payslip
            records. The tax department can ask for proof.
          </p>
        )}
        <Button size="lg" onClick={submit} className="w-full">
          Show my tax report
          <ArrowRight />
        </Button>
        <p className="text-center text-muted-foreground text-xs">
          Saved as external deposits. Change them any time in your tax profile.
        </p>
      </CardContent>
    </Card>
  );
}
