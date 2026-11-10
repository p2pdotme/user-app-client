import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  ExternalLink,
  Search,
} from "lucide-react";
import { useMemo, useState } from "react";
import ASSETS from "@/assets";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { InfoTip, SectionHeader, TablePagination } from "@/tax/components";
import { rateOf } from "@/tax/core/subgraph/normalize";
import type { FyReport } from "@/tax/core/tax/compute";
import type { Disposal } from "@/tax/core/tax/lots";
import type { NormalizedOrder } from "@/tax/core/types";
import { usePagination } from "@/tax/hooks";
import { EXTERNAL_HREFS } from "@/tax/lib/constants";
import type { Dec } from "@/tax/lib/decimal";
import {
  formatDateTimeIst,
  formatInr,
  formatRate,
  formatUsdc,
  shortHash,
} from "@/tax/lib/format";
import { isSale, KIND_LABEL } from "./order-kind";

type SortKey = "date" | "qty" | "inr" | "rate" | "gain";
type TypeFilter = "all" | "buy" | "sale";

const TYPE_LABEL: Record<TypeFilter, string> = {
  all: "All types",
  buy: "Buy",
  sale: "Sell & Pay",
};

interface Row {
  order: NormalizedOrder;
  rate: Dec;
  disposal?: Disposal;
}

const gainOf = (r: Row): number =>
  r.disposal ? r.disposal.gain.toNumber() : Number.NEGATIVE_INFINITY;

function compare(a: Row, b: Row, key: SortKey): number {
  switch (key) {
    case "date":
      return a.order.date.getTime() - b.order.date.getTime();
    case "qty":
      return a.order.qty.comparedTo(b.order.qty);
    case "inr":
      return a.order.inr.comparedTo(b.order.inr);
    case "rate":
      return a.rate.comparedTo(b.rate);
    case "gain":
      return gainOf(a) - gainOf(b);
  }
}

interface SortState {
  key: SortKey;
  dir: 1 | -1;
}

function SortableHead({
  label,
  column,
  sort,
  onSort,
  align = "left",
}: {
  label: string;
  column: SortKey;
  sort: SortState;
  onSort: (key: SortKey) => void;
  align?: "left" | "right";
}) {
  const active = sort.key === column;
  const Icon = !active ? ArrowUpDown : sort.dir === 1 ? ArrowUp : ArrowDown;
  return (
    <TableHead
      className={cn(align === "right" && "text-right")}
      aria-sort={
        active ? (sort.dir === 1 ? "ascending" : "descending") : "none"
      }>
      <button
        type="button"
        onClick={() => onSort(column)}
        aria-label={`Sort by ${label}`}
        className={cn(
          "inline-flex items-center gap-1 rounded-sm font-medium hover:text-primary focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50",
          align === "right" && "flex-row-reverse",
          active && "text-primary",
        )}>
        {label}
        <Icon className="size-3.5" />
      </button>
    </TableHead>
  );
}

/** P2P.me Buy / Sell / Pay icons (from user-app-client). */
function KindIcon({ kind }: { kind: NormalizedOrder["kind"] }) {
  const Icon =
    kind === "BUY"
      ? ASSETS.ICONS.Buy
      : kind === "SELL"
        ? ASSETS.ICONS.Sell
        : ASSETS.ICONS.Pay;
  return <Icon className="size-3" aria-hidden="true" />;
}

/** Income (nil on a loss) and ignored loss, per sale. */
function GainCell({ disposal }: { disposal?: Disposal }) {
  if (!disposal)
    return <span className="text-muted-foreground">Not taxed</span>;
  const { taxable, ignoredLoss } = disposal;
  return (
    <div className="flex flex-col items-end leading-tight">
      {taxable.greaterThan(0) || ignoredLoss.isZero() ? (
        <span className="font-medium text-success">+{formatInr(taxable)}</span>
      ) : null}
      {ignoredLoss.greaterThan(0) && (
        <span
          className={cn(
            taxable.greaterThan(0)
              ? "text-chart-1 text-xs"
              : "font-medium text-muted-foreground",
          )}>
          −{formatInr(ignoredLoss)}
          {taxable.greaterThan(0) ? " ignored" : ""}
        </span>
      )}
      {taxable.isZero() && ignoredLoss.greaterThan(0) && (
        <span className="text-chart-1 text-xs">Loss ignored</span>
      )}
      {disposal.shortfallQty.greaterThan(0) && (
        <span className="text-destructive text-xs">Cost missing</span>
      )}
    </div>
  );
}

export function OrdersTable({ report }: { report: FyReport }) {
  const [query, setQuery] = useState("");
  // Buys whose USDC reached one of the taxpayer's wallets
  const ownBuyIds = useMemo(
    () => new Set(report.buys.map((o) => o.id)),
    [report],
  );
  const [type, setType] = useState<TypeFilter>("all");
  const [sort, setSort] = useState<SortState>({ key: "date", dir: -1 });

  const rows = useMemo<Row[]>(() => {
    const byId = new Map(report.disposals.map((d) => [d.transfer.id, d]));
    return [...report.allBuys, ...report.sells].map((order) => ({
      order,
      rate: rateOf(order),
      disposal: byId.get(order.id),
    }));
  }, [report]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows
      .filter(({ order }) =>
        type === "all"
          ? true
          : type === "buy"
            ? order.kind === "BUY"
            : isSale(order.kind),
      )
      .filter(
        ({ order }) =>
          !q ||
          order.orderId.includes(q) ||
          order.txHash.toLowerCase().includes(q) ||
          KIND_LABEL[order.kind].toLowerCase().includes(q),
      )
      .sort((a, b) => compare(a, b, sort.key) * sort.dir);
  }, [rows, query, type, sort]);

  const pagination = usePagination(
    filtered,
    20,
    `${query}|${type}|${sort.key}|${sort.dir}`,
  );

  const onSort = (key: SortKey) =>
    setSort((s) => ({ key, dir: s.key === key ? (-s.dir as 1 | -1) : -1 }));

  return (
    <div className="flex w-full flex-col gap-3">
      <SectionHeader title="Orders" description={`${filtered.length} orders`} />
      <div className="flex w-full flex-wrap gap-2">
        <div className="relative basis-full sm:flex-1 sm:basis-auto">
          <Search className="-translate-y-1/2 pointer-events-none absolute top-1/2 left-3 size-4 text-muted-foreground" />
          <Input
            type="search"
            aria-label="Search by order ID, type or tx hash"
            placeholder="Search order ID, type or tx"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={type} onValueChange={(v) => setType(v as TypeFilter)}>
          <SelectTrigger
            aria-label="Filter by type"
            className="flex-1 sm:w-36 sm:flex-none">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {(Object.keys(TYPE_LABEL) as TypeFilter[]).map((k) => (
              <SelectItem key={k} value={k}>
                {TYPE_LABEL[k]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <Card className="w-full gap-0 py-2">
        <CardContent className="px-2">
          <Table aria-label="Orders">
            <TableHeader>
              <TableRow>
                <SortableHead
                  label="Date (IST)"
                  column="date"
                  sort={sort}
                  onSort={onSort}
                />
                <TableHead>Type</TableHead>
                <SortableHead
                  label="USDC"
                  column="qty"
                  sort={sort}
                  onSort={onSort}
                  align="right"
                />
                <SortableHead
                  label="₹"
                  column="inr"
                  sort={sort}
                  onSort={onSort}
                  align="right"
                />
                <SortableHead
                  label="Gain / loss"
                  column="gain"
                  sort={sort}
                  onSort={onSort}
                  align="right"
                />
                <TableHead className="w-8">
                  <span className="sr-only">Transaction</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pagination.items.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="py-6 text-center text-muted-foreground">
                    No orders match.
                  </TableCell>
                </TableRow>
              ) : (
                pagination.items.map(({ order, rate, disposal }) => {
                  const buy = order.kind === "BUY";
                  return (
                    <TableRow
                      key={order.id}
                      data-testid="order-row"
                      data-kind={order.kind}>
                      <TableCell>
                        <div className="flex flex-col leading-tight">
                          <span>{formatDateTimeIst(order.date)}</span>
                          <span className="text-muted-foreground text-xs">
                            #{order.orderId}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="inline-flex items-center gap-1">
                          <Badge
                            variant="outline"
                            className={cn(
                              buy
                                ? "border-blue-500/30 bg-blue-500/10 text-blue-600"
                                : "border-red-500/30 bg-red-500/10 text-red-600",
                            )}>
                            <KindIcon kind={order.kind} />
                            {KIND_LABEL[order.kind]}
                          </Badge>
                          {order.kind === "PAY" && (
                            <InfoTip
                              rule="PAY_IS_TRANSFER"
                              law={report.law}
                              extra="Taxed exactly like a Sell order."
                            />
                          )}
                        </span>
                        {buy && order.recipient && !ownBuyIds.has(order.id) && (
                          <span className="block text-muted-foreground text-xs">
                            Sent to {order.recipient.slice(0, 6)}…
                            {order.recipient.slice(-4)}
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {buy ? "+" : "−"}
                        {formatUsdc(order.qty)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        <div className="flex flex-col items-end leading-tight">
                          <span>{formatInr(order.inr)}</span>
                          <span className="text-muted-foreground text-xs">
                            @ ₹{formatRate(rate)}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        <GainCell disposal={disposal} />
                      </TableCell>
                      <TableCell>
                        {order.txHash && (
                          <a
                            href={`${EXTERNAL_HREFS.BASESCAN_TX}${order.txHash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label={`View on Basescan ${order.txHash}`}
                            title={shortHash(order.txHash)}
                            className="inline-flex size-7 items-center justify-center rounded-md text-primary hover:bg-primary/10">
                            <ExternalLink className="size-4" />
                          </a>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
          <TablePagination pagination={pagination} noun="orders" />
        </CardContent>
      </Card>
    </div>
  );
}
