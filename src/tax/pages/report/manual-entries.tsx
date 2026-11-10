import { Plus, Trash2 } from "lucide-react";
import { useId } from "react";
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
import type {
  ManualLot,
  ManualLotKind,
  ReceiptType,
  TdsEntry,
} from "@/tax/core/types";
import { fyLabel, fyOf, istDateToInstant } from "@/tax/lib/fy";
import { newId } from "@/tax/lib/manual-data";
import {
  AmountInputSchema,
  IstDateInputSchema,
  isValidOptional,
} from "@/tax/lib/schemas";
import { RECEIPT_LABEL, RECEIPT_OPTIONS, receiptOption } from "./receipt-types";

interface FieldProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: "text" | "date";
  inputMode?: "decimal" | "text";
  valid?: boolean;
  disabled?: boolean;
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  inputMode = "text",
  valid = true,
  disabled,
}: FieldProps) {
  const id = useId();
  const errorId = `${id}-error`;
  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      <Label htmlFor={id} className="text-xs">
        {label}
      </Label>
      <Input
        id={id}
        type={type}
        inputMode={inputMode}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={!valid}
        aria-describedby={valid ? undefined : errorId}
      />
      {!valid && (
        <p id={errorId} className="text-destructive text-xs">
          Invalid value
        </p>
      )}
    </div>
  );
}

const validAmount = (v: string): boolean =>
  isValidOptional(AmountInputSchema, v);
const validDate = (v: string): boolean =>
  isValidOptional(IstDateInputSchema, v);

/** Label for the lot's ₹ total, by how it came in */
const TOTAL_LABEL: Record<ReceiptType, string> = {
  EXCHANGE: "Total cost (₹)",
  OWN_WALLET: "Original total cost (₹)",
  SALARY: "Total value when received (₹)",
  REWARD: "Total value when received (₹)",
  GIFT_RELATIVE: "Giver's total cost (₹)",
  GIFT_NON_RELATIVE: "Total value when received (₹)",
  UNKNOWN: "Total cost (₹)",
};

const LOT_KIND_LABEL: Record<ManualLotKind, string> = {
  OPENING: "Opening balance",
  EXTERNAL: "External deposit",
};

/** FY of an IST date string, or null when the date is not valid yet */
const fyOfDate = (iso: string): number | null => {
  const d = istDateToInstant(iso);
  return d ? fyOf(d) : null;
};

/**
 * Gift from a non-relative: what the giver paid (cost if not taxed) and the
 * year's other gifts from non-relatives (they count towards ₹50,000).
 */
function NonRelativeGiftFields({
  lot,
  onLotChange,
  otherGifts,
  onOtherGiftsChange,
}: {
  lot: ManualLot;
  onLotChange: (patch: Partial<ManualLot>) => void;
  otherGifts: Readonly<Record<string, string>>;
  onOtherGiftsChange: (fy: number, amount: string) => void;
}) {
  const fy = fyOfDate(lot.date);
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <Field
        label="What the giver paid in total (₹), blank if not known"
        inputMode="decimal"
        value={lot.giverCost ?? ""}
        onChange={(giverCost) =>
          onLotChange({ giverCost: giverCost.slice(0, 40) })
        }
        valid={validAmount(lot.giverCost ?? "")}
      />
      {fy !== null && (
        <Field
          label={`Other gifts from non-relatives in ${fyLabel(fy)}, money and property (₹)`}
          inputMode="decimal"
          value={otherGifts[String(fy)] ?? ""}
          onChange={(v) => onOtherGiftsChange(fy, v)}
          valid={validAmount(otherGifts[String(fy)] ?? "")}
        />
      )}
    </div>
  );
}

export function LotsEditor({
  lots,
  onChange,
  otherGifts = {},
  onOtherGiftsChange = () => undefined,
}: {
  lots: ManualLot[];
  onChange: (lots: ManualLot[]) => void;
  otherGifts?: Readonly<Record<string, string>>;
  onOtherGiftsChange?: (fy: number, amount: string) => void;
}) {
  const update = (id: string, patch: Partial<ManualLot>) =>
    onChange(lots.map((l) => (l.id === id ? { ...l, ...patch } : l)));
  const add = (kind: ManualLotKind) =>
    onChange([
      ...lots,
      {
        id: newId(),
        kind,
        date: "",
        qty: "",
        cost: "",
        source: "EXCHANGE",
        costUnknown: false,
        note: "",
      },
    ]);

  return (
    <fieldset className="flex flex-col gap-3">
      <legend className="font-medium">USDC not bought on P2P.me</legend>
      <p className="text-muted-foreground text-xs">
        Add an opening balance (USDC bought before using P2P.me) or USDC
        received from another wallet / exchange, with its cost.
      </p>
      {lots.map((lot) => (
        <div key={lot.id} className="flex flex-col gap-3 rounded-lg border p-3">
          <div className="flex items-center justify-between">
            <span className="font-medium text-primary text-xs uppercase">
              {LOT_KIND_LABEL[lot.kind]}
            </span>
            <Button
              variant="ghost"
              size="sm"
              aria-label="Remove"
              onClick={() => onChange(lots.filter((l) => l.id !== lot.id))}>
              <Trash2 className="text-destructive" />
            </Button>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor={`source-${lot.id}`} className="text-xs">
              How it came in
            </Label>
            <Select
              value={lot.costUnknown ? "UNKNOWN" : lot.source}
              onValueChange={(v) =>
                update(lot.id, {
                  source: v as ReceiptType,
                  costUnknown: v === "UNKNOWN",
                })
              }>
              <SelectTrigger id={`source-${lot.id}`} className="h-9 w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {RECEIPT_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
                {(lot.costUnknown || lot.source === "UNKNOWN") && (
                  <SelectItem value="UNKNOWN">
                    {RECEIPT_LABEL.UNKNOWN}
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
            <p className="text-muted-foreground text-xs">
              {receiptOption(lot.source)?.hint ??
                "Cost is taken as ₹0, so the whole sale amount counts as profit."}
            </p>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <Field
              label="Acquisition date"
              type="date"
              value={lot.date}
              onChange={(date) => update(lot.id, { date })}
              valid={validDate(lot.date)}
            />
            <Field
              label="USDC quantity"
              inputMode="decimal"
              value={lot.qty}
              onChange={(qty) => update(lot.id, { qty })}
              valid={validAmount(lot.qty)}
            />
            <Field
              label={TOTAL_LABEL[lot.costUnknown ? "UNKNOWN" : lot.source]}
              inputMode="decimal"
              value={
                lot.costUnknown || lot.source === "UNKNOWN" ? "0" : lot.cost
              }
              disabled={lot.costUnknown || lot.source === "UNKNOWN"}
              onChange={(cost) => update(lot.id, { cost })}
              valid={
                lot.costUnknown ||
                lot.source === "UNKNOWN" ||
                validAmount(lot.cost)
              }
            />
          </div>
          {lot.source === "GIFT_NON_RELATIVE" && !lot.costUnknown && (
            <NonRelativeGiftFields
              lot={lot}
              onLotChange={(patch) => update(lot.id, patch)}
              otherGifts={otherGifts}
              onOtherGiftsChange={onOtherGiftsChange}
            />
          )}
          <Field
            label="Note"
            value={lot.note}
            onChange={(note) => update(lot.id, { note: note.slice(0, 200) })}
          />
        </div>
      ))}
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" size="sm" onClick={() => add("OPENING")}>
          <Plus />
          Add opening balance
        </Button>
        <Button variant="outline" size="sm" onClick={() => add("EXTERNAL")}>
          <Plus />
          Add external deposit
        </Button>
      </div>
    </fieldset>
  );
}

export function TdsEditor({
  entries,
  onChange,
}: {
  entries: TdsEntry[];
  onChange: (entries: TdsEntry[]) => void;
}) {
  const update = (id: string, patch: Partial<TdsEntry>) =>
    onChange(entries.map((e) => (e.id === id ? { ...e, ...patch } : e)));
  return (
    <fieldset className="flex flex-col gap-3">
      <legend className="font-medium">
        TDS actually deducted on your sales
      </legend>
      <p className="text-muted-foreground text-xs">
        Only TDS shown in your Form 26AS / AIS can be claimed.
      </p>
      {entries.map((e) => (
        <div
          key={e.id}
          className="grid grid-cols-1 items-end gap-3 rounded-lg border p-3 sm:grid-cols-[1fr_1fr_1.5fr_auto]">
          <Field
            label="Date"
            type="date"
            value={e.date}
            onChange={(date) => update(e.id, { date })}
            valid={validDate(e.date)}
          />
          <Field
            label="Amount (₹)"
            inputMode="decimal"
            value={e.amount}
            onChange={(amount) => update(e.id, { amount })}
            valid={validAmount(e.amount)}
          />
          <Field
            label="Form 26AS / AIS reference"
            value={e.reference}
            onChange={(reference) =>
              update(e.id, { reference: reference.slice(0, 200) })
            }
          />
          <Button
            variant="ghost"
            size="sm"
            aria-label="Remove"
            onClick={() => onChange(entries.filter((x) => x.id !== e.id))}>
            <Trash2 className="text-destructive" />
          </Button>
        </div>
      ))}
      <Button
        variant="outline"
        size="sm"
        className="w-fit"
        onClick={() =>
          onChange([
            ...entries,
            { id: newId(), date: "", amount: "", reference: "" },
          ])
        }>
        <Plus />
        Add TDS entry
      </Button>
    </fieldset>
  );
}
