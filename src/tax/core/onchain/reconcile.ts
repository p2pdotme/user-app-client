/**
 * On-chain reconciliation (pure): the wallet's USDC transfers on Base against
 * its P2P.me orders.
 *
 * 1. Movements between the taxpayer's own wallets are internal and ignored.
 * 2. Each completed order is matched to a USDC movement of the right wallet,
 *    direction and amount: first by transaction hash, else by amount and the
 *    nearest time (up to 7 days before completion, to cover escrow at order
 *    placement). Other USDC legs in a matched transaction (fee, tip) go with it.
 * 3. An outflow later returned in full by the same address (a cancelled order
 *    or a refund) is set aside as a returned pair.
 * 4. What is left is outside P2P.me:
 *    - unmatched inflows: USDC that came in and needs a cost (exchange
 *      withdrawals, bridges, rewards, gifts, swaps of other tokens);
 *    - unmatched outflows: USDC sent out, each possibly a transfer of VDA.
 *    A movement whose transaction also moves another token the opposite way
 *    is flagged as a swap.
 */
import { isUsdc } from "@/tax/core/onchain/csv";
import type { TokenTransfer } from "@/tax/core/onchain/types";
import type { NormalizedOrder } from "@/tax/core/types";
import { D, type Dec, sum } from "@/tax/lib/decimal";

export type Direction = "IN" | "OUT";

export interface SwapLeg {
  symbol: string;
  token: string;
  amount: Dec;
}

export interface OnchainMove {
  /** Stable across the API and the CSV: hash, direction, other side, amount */
  id: string;
  txHash: string;
  time: Date;
  direction: Direction;
  /** The taxpayer's wallet involved */
  wallet: string;
  /** The other side of the movement */
  counterparty: string;
  qty: Dec;
  /** Other tokens moving the opposite way in the same transaction */
  swap: SwapLeg[];
}

export interface ReturnedPair {
  out: OnchainMove;
  back: OnchainMove;
}

export interface Reconciliation {
  /** USDC movements in and out of the wallet set (internal ones excluded) */
  usdcMoves: number;
  /** Completed orders whose USDC should touch the wallet set */
  ordersChecked: number;
  matched: number;
  unmatchedOrders: NormalizedOrder[];
  inflows: OnchainMove[];
  outflows: OnchainMove[];
  /** Outflow + inflow pairs returned in full (cancelled orders, refunds) */
  returned: ReturnedPair[];
  /** Movements between the taxpayer's own wallets */
  internal: number;
  /** Other tokens received outside any swap (possible airdrops) */
  otherTokens: { symbol: string; count: number }[];
  first: Date | null;
  last: Date | null;
}

export interface ReconcileInput {
  transfers: readonly TokenTransfer[];
  orders: readonly NormalizedOrder[];
  /** The taxpayer's wallets (lowercase) */
  wallets: readonly string[];
}

const DAY_MS = 86_400_000;
const MATCH_BEFORE_MS = 7 * DAY_MS;
/** A purchase is delivered at completion, not days before */
const BUY_BEFORE_MS = DAY_MS;
const MATCH_AFTER_MS = 3_600_000;
const RETURN_WITHIN_MS = 30 * DAY_MS;
const AMOUNT_TOLERANCE = new D("0.0001");

interface Move extends OnchainMove {
  used: boolean;
}

const sameAmount = (a: Dec, b: Dec): boolean =>
  a.minus(b).abs().lessThanOrEqualTo(AMOUNT_TOLERANCE);

/** Deduplicate (a wallet pair can appear in two CSVs) and give stable ids. */
function usdcMoves(
  transfers: readonly TokenTransfer[],
  own: ReadonlySet<string>,
): { moves: Move[]; internal: number } {
  // The same transfer shows up in the files of both wallets it touches (or
  // when a file is loaded twice): identical rows count once
  const seen = new Set<string>();
  const moves: Move[] = [];
  let internal = 0;
  const sorted = [...transfers].sort(
    (a, b) => a.time.getTime() - b.time.getTime(),
  );
  for (const t of sorted) {
    if (!isUsdc(t) || t.amount.isZero()) continue;
    const fromOwn = own.has(t.from);
    const toOwn = own.has(t.to);
    if (!fromOwn && !toOwn) continue;
    const key = `${t.txHash}:${t.from}:${t.to}:${t.amount.toFixed(6)}`;
    if (seen.has(key)) continue;
    seen.add(key);
    if (fromOwn && toOwn) {
      internal += 1;
      continue;
    }
    const direction: Direction = toOwn ? "IN" : "OUT";
    const counterparty = toOwn ? t.from : t.to;
    moves.push({
      id: `${t.txHash}:${direction}:${counterparty}:${t.amount.toFixed(6)}`,
      txHash: t.txHash,
      time: t.time,
      direction,
      wallet: toOwn ? t.to : t.from,
      counterparty,
      qty: t.amount,
      swap: [],
      used: false,
    });
  }
  return { moves, internal };
}

function expectedMove(
  o: NormalizedOrder,
  own: ReadonlySet<string>,
): { wallet: string; direction: Direction; amounts: Dec[] } | null {
  if (o.kind === "BUY") {
    const wallet = o.recipient ?? o.wallet;
    return own.has(wallet)
      ? { wallet, direction: "IN", amounts: [o.qty] }
      : null;
  }
  return {
    wallet: o.wallet,
    direction: "OUT",
    amounts: [o.qty.plus(o.feeQtyFromLots), o.qty],
  };
}

function matchOrders(
  orders: readonly NormalizedOrder[],
  moves: Move[],
  own: ReadonlySet<string>,
): { checked: number; unmatched: NormalizedOrder[] } {
  const unmatched: NormalizedOrder[] = [];
  let checked = 0;
  // The matched leg, plus fee / tip legs of the same transaction that are
  // not larger than the order's fee (other orders in the tx stay available)
  const mark = (hit: Move, o: NormalizedOrder) => {
    hit.used = true;
    let fee = o.kind === "BUY" ? new D(0) : o.feeQtyFromLots;
    if (sameAmount(hit.qty, o.qty.plus(fee))) fee = new D(0);
    for (const m of moves) {
      if (fee.lessThanOrEqualTo(AMOUNT_TOLERANCE)) return;
      if (
        !m.used &&
        m.txHash === hit.txHash &&
        m.direction === hit.direction &&
        m.wallet === hit.wallet &&
        m.qty.lessThanOrEqualTo(fee.plus(AMOUNT_TOLERANCE))
      ) {
        m.used = true;
        fee = fee.minus(m.qty);
      }
    }
  };
  for (const o of orders) {
    const want = expectedMove(o, own);
    if (!want) continue;
    checked += 1;
    const fits = (m: Move) =>
      !m.used && m.direction === want.direction && m.wallet === want.wallet;
    const t = o.date.getTime();
    const before = o.kind === "BUY" ? BUY_BEFORE_MS : MATCH_BEFORE_MS;
    const byHash = moves.find(
      (m) => fits(m) && m.txHash === o.txHash.toLowerCase(),
    );
    const byAmount = moves
      .filter(
        (m) =>
          fits(m) &&
          m.time.getTime() >= t - before &&
          m.time.getTime() <= t + MATCH_AFTER_MS &&
          want.amounts.some((a) => sameAmount(a, m.qty)),
      )
      .sort(
        (a, b) =>
          Math.abs(a.time.getTime() - t) - Math.abs(b.time.getTime() - t),
      )[0];
    const hit = byHash ?? byAmount;
    if (hit) mark(hit, o);
    else unmatched.push(o);
  }
  return { checked, unmatched };
}

/**
 * Outflow returned in full by the same address, as the very next unmatched
 * movement with that address (a cancelled order or a refund): both are set
 * aside but listed, so the user can check them.
 */
function setAsideReturns(moves: Move[]): ReturnedPair[] {
  const pairs: ReturnedPair[] = [];
  for (const out of moves) {
    if (out.used || out.direction !== "OUT") continue;
    const next = moves.find(
      (m) =>
        m !== out &&
        !m.used &&
        m.wallet === out.wallet &&
        m.counterparty === out.counterparty &&
        m.time.getTime() >= out.time.getTime(),
    );
    if (
      next &&
      next.direction === "IN" &&
      sameAmount(next.qty, out.qty) &&
      next.time.getTime() - out.time.getTime() <= RETURN_WITHIN_MS
    ) {
      out.used = true;
      next.used = true;
      pairs.push({ out: strip(out), back: strip(next) });
    }
  }
  return pairs;
}

const strip = ({ used: _used, ...m }: Move): OnchainMove => m;

function otherTokenLegs(
  transfers: readonly TokenTransfer[],
  own: ReadonlySet<string>,
): TokenTransfer[] {
  return transfers.filter(
    (t) =>
      !isUsdc(t) && !t.amount.isZero() && own.has(t.from) !== own.has(t.to),
  );
}

export function reconcile(input: ReconcileInput): Reconciliation {
  const own = new Set(input.wallets.map((w) => w.toLowerCase()));
  const { moves, internal } = usdcMoves(input.transfers, own);
  const { checked, unmatched } = matchOrders(input.orders, moves, own);
  const returned = setAsideReturns(moves);

  const others = otherTokenLegs(input.transfers, own);
  const swapTxs = new Set<string>();
  const left = moves
    .filter((m) => !m.used)
    .map(({ used: _used, ...m }): OnchainMove => {
      // A swap: another token goes the other way in the same transaction
      const swap = others
        .filter(
          (t) =>
            t.txHash === m.txHash &&
            (m.direction === "IN" ? t.from === m.wallet : t.to === m.wallet),
        )
        .map((t) => ({ symbol: t.symbol, token: t.token, amount: t.amount }));
      if (swap.length > 0) swapTxs.add(m.txHash);
      return { ...m, swap };
    });

  const tokenCounts = new Map<string, number>();
  for (const t of others) {
    if (!own.has(t.to) || swapTxs.has(t.txHash)) continue;
    const symbol = t.symbol || "unknown token";
    tokenCounts.set(symbol, (tokenCounts.get(symbol) ?? 0) + 1);
  }

  return {
    usdcMoves: moves.length,
    ordersChecked: checked,
    matched: checked - unmatched.length,
    unmatchedOrders: unmatched,
    inflows: left.filter((m) => m.direction === "IN"),
    outflows: left.filter((m) => m.direction === "OUT"),
    returned,
    internal,
    otherTokens: [...tokenCounts.entries()]
      .map(([symbol, count]) => ({ symbol, count }))
      .sort((a, b) => b.count - a.count),
    first: moves[0]?.time ?? null,
    last: moves[moves.length - 1]?.time ?? null,
  };
}

/**
 * Average ₹/USDC of the user's P2P.me orders within 15 days of `date` (all
 * orders if none are that close). Only a starting point for the user's value.
 */
export function p2pRateNear(
  orders: readonly NormalizedOrder[],
  date: Date,
): Dec | null {
  const near = orders.filter(
    (o) => Math.abs(o.date.getTime() - date.getTime()) <= 15 * DAY_MS,
  );
  const pick = near.length > 0 ? near : orders;
  const qty = sum(pick.map((o) => o.qty));
  return qty.isZero() ? null : sum(pick.map((o) => o.inr)).div(qty);
}
