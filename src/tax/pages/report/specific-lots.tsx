import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SectionHeader, TablePagination } from "@/tax/components";
import { useTaxSettings } from "@/tax/contexts";
import type { FyReport } from "@/tax/core/tax/compute";
import type { Disposal, OpenLot } from "@/tax/core/tax/lots";
import { ACQUIRED_AS } from "@/tax/core/tax/schedule-vda";
import { usePagination } from "@/tax/hooks";
import {
  formatDateIst,
  formatInr,
  formatRate,
  formatUsdc,
  orderRef,
} from "@/tax/lib/format";

/** Select value for "not tagged" (Radix Select needs a non-empty value). */
const NOT_TAGGED = "__oldest_first__";

const lotLabel = ({ lot, remaining }: OpenLot): string => {
  const unit = lot.qty.isZero() ? lot.cost : lot.cost.div(lot.qty);
  return `${formatDateIst(lot.date)} · ${ACQUIRED_AS[lot.source]} · ${formatUsdc(remaining)} USDC left at ₹${formatRate(unit)}`;
};

function SaleRow({
  disposal,
  tagged,
  onChange,
}: {
  disposal: Disposal;
  tagged: string | undefined;
  onChange: (lotId: string | null) => void;
}) {
  const lots = disposal.lotsHeld ?? [];
  const t = disposal.transfer;
  // A tag for a lot no longer held (e.g. after an edit) is shown as untagged
  const value =
    tagged && lots.some((l) => l.lot.id === tagged) ? tagged : NOT_TAGGED;
  return (
    <div
      data-testid="specific-sale"
      className="flex flex-col gap-2 border-b py-3 last:border-b-0 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
      <div className="flex flex-col text-sm">
        <span className="font-medium">
          {orderRef(t.orderId)} · {formatDateIst(t.date)}
        </span>
        <span className="text-muted-foreground text-xs">
          {formatUsdc(t.qty)} USDC for {formatInr(t.consideration)}
        </span>
      </div>
      <Select
        value={value}
        onValueChange={(v) => onChange(v === NOT_TAGGED ? null : v)}>
        <SelectTrigger
          aria-label={`Purchase sold in order ${t.orderId}`}
          className="h-9 w-full sm:w-96">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={NOT_TAGGED}>Not picked: oldest first</SelectItem>
          {lots.map((l) => (
            <SelectItem key={l.lot.id} value={l.lot.id}>
              {lotLabel(l)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

/**
 * Specific identification: the user picks, for each sale, the purchase the
 * USDC came from. Any quantity that purchase does not cover is taken oldest
 * first.
 */
export function SpecificLots({ report }: { report: FyReport }) {
  const { data, setSpecificLot } = useTaxSettings();
  const pagination = usePagination(report.disposals, 10);
  if (report.disposals.length === 0) return null;
  return (
    <div className="no-print flex w-full flex-col gap-3">
      <SectionHeader
        title="Which purchase did each sale use?"
        description="Specific identification: pick the purchase each sale came from, using your own records. Anything the picked purchase does not cover, and sales you leave as they are, use the oldest purchase first."
      />
      <Card className="w-full py-2">
        <CardContent className="px-4">
          {pagination.items.map((d) => (
            <SaleRow
              key={d.transfer.id}
              disposal={d}
              tagged={data.specificLots[d.transfer.id]}
              onChange={(lotId) => setSpecificLot(d.transfer.id, lotId)}
            />
          ))}
          <TablePagination pagination={pagination} noun="sales" />
        </CardContent>
      </Card>
    </div>
  );
}
