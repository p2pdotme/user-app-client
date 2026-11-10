import { err, ok, type Result } from "neverthrow";
import { z } from "zod";
import type {
  ManualData,
  ManualLot,
  OutflowEntry,
  Settings,
  TdsEntry,
  WalletEntries,
} from "@/tax/core/types";
import { type AppError, createAppError } from "@/tax/lib/errors";

export const DEFAULT_SETTINGS: Settings = {
  costMethod: "FIFO",
  costMethodLocked: false,
  // Buyer side: the user is usually an individual without audit → ₹50,000
  userSpecifiedPerson: true,
  // Seller side: counterparties are liquidity providers in business → ₹10,000
  counterpartySpecifiedPerson: false,
  regime: "NEW",
  otherIncome: "0",
  headOfIncome: "CAPITAL_GAINS",
};

export const EMPTY_ENTRIES: WalletEntries = {
  lots: [],
  tds: [],
  notMyWallets: [],
  specificLots: {},
  otherGifts: {},
  outflows: [],
};

export const EMPTY_MANUAL: ManualData = {
  version: 1,
  settings: DEFAULT_SETTINGS,
  wallets: [],
  ...EMPTY_ENTRIES,
};

/** True when the taxpayer has entered anything for this wallet set. */
export function hasEntries(e: WalletEntries): boolean {
  return (
    e.lots.length > 0 ||
    e.tds.length > 0 ||
    e.notMyWallets.length > 0 ||
    Object.keys(e.specificLots).length > 0 ||
    Object.keys(e.otherGifts).length > 0 ||
    e.outflows.length > 0
  );
}

/** Stable key for a set of wallets (order and case do not matter). */
export function walletSetKey(wallets: readonly string[]): string {
  return [...new Set(wallets.map((w) => w.toLowerCase()))].sort().join(",");
}

export function newId(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
}

// ---------------------------------------------------------------------------
// Import schema. The file is untrusted. Unknown / malformed fields fall back
// to safe defaults (`.catch`) and malformed list items are dropped, so a
// partly broken export still imports what it can.
// ---------------------------------------------------------------------------

/** String capped at `max` chars; anything else becomes "" */
const text = (max: number) =>
  z
    .string()
    .transform((s) => s.slice(0, max))
    .catch("");

const idText = text(64).transform((s) => s || newId());

const SettingsSchema = z
  .object({
    costMethod: z.enum(["FIFO", "LIFO", "SPECIFIC", "AVERAGE"]).catch("FIFO"),
    costMethodLocked: z.boolean().catch(false),
    userSpecifiedPerson: z.boolean().optional(),
    counterpartySpecifiedPerson: z.boolean().catch(false),
    // Older exports had one shared switch; it described the user
    specifiedPerson: z.boolean().optional(),
    regime: z.enum(["NEW", "OLD"]).catch("NEW"),
    otherIncome: text(30).transform((s) => s || "0"),
    headOfIncome: z.enum(["CAPITAL_GAINS", "BUSINESS"]).catch("CAPITAL_GAINS"),
  })
  .transform(
    ({ specifiedPerson, userSpecifiedPerson, ...rest }): Settings => ({
      ...rest,
      userSpecifiedPerson: userSpecifiedPerson ?? specifiedPerson ?? true,
    }),
  )
  .catch(DEFAULT_SETTINGS);

const RECEIPT_TYPES = [
  "EXCHANGE",
  "OWN_WALLET",
  "SALARY",
  "REWARD",
  "GIFT_RELATIVE",
  "GIFT_NON_RELATIVE",
  "UNKNOWN",
] as const;

const LotSchema = z
  .object({
    id: idText,
    kind: z.enum(["OPENING", "EXTERNAL"]),
    date: text(10),
    qty: text(40),
    cost: text(40),
    source: z.enum(RECEIPT_TYPES).optional(),
    costUnknown: z.boolean().catch(false),
    giverCost: text(40).optional(),
    note: text(200),
    txRef: text(200).optional(),
  })
  // Older exports had no `source`: unknown cost → UNKNOWN, else a purchase
  .transform(
    ({ giverCost, txRef, ...lot }): ManualLot => ({
      ...lot,
      // Blank means "not given". zod 4.0 fills a missing optional key from the
      // `.catch("")` above, so a blank is dropped rather than kept as "".
      ...(giverCost ? { giverCost } : {}),
      ...(txRef ? { txRef } : {}),
      source: lot.source ?? (lot.costUnknown ? "UNKNOWN" : "EXCHANGE"),
    }),
  );

const AddressListSchema = z
  .array(z.string())
  .catch([])
  .transform((list) =>
    list.map((a) => a.toLowerCase()).filter((a) => /^0x[0-9a-f]{40}$/.test(a)),
  );

const HEX_HASH = /^0x[0-9a-f]{64}$/;
const ADDRESS = /^0x[0-9a-f]{40}$/;

const OutflowSchema: z.ZodType<OutflowEntry, unknown> = z.object({
  id: z.string().min(1).max(200),
  txHash: z
    .string()
    .transform((s) => s.toLowerCase())
    .pipe(z.string().regex(HEX_HASH)),
  at: z.string().refine((s) => !Number.isNaN(new Date(s).getTime())),
  qty: text(40),
  to: z
    .string()
    .transform((s) => s.toLowerCase())
    .pipe(z.string().regex(ADDRESS)),
  treatment: z.enum(["OWN", "SOLD", "GIFT"]),
  consideration: text(40),
});

const TdsSchema: z.ZodType<TdsEntry> = z.object({
  id: idText,
  date: text(10),
  amount: text(40),
  reference: text(200),
});

/** Keep the items that pass `schema`, drop the rest. */
const keepValid = <T>(schema: z.ZodType<T, unknown>) =>
  z
    .array(z.unknown())
    .catch([])
    .transform((items) =>
      items.flatMap((item) => {
        const r = schema.safeParse(item);
        return r.success ? [r.data] : [];
      }),
    );

/** id → id map with capped, non-empty strings; anything else is dropped */
const StringMapSchema = (maxValue: number) =>
  z
    .record(z.string(), z.unknown())
    .catch({})
    .transform((rec) =>
      Object.fromEntries(
        Object.entries(rec)
          .slice(0, 5000)
          .filter(
            (e): e is [string, string] =>
              typeof e[1] === "string" &&
              e[0].length > 0 &&
              e[0].length <= 128 &&
              e[1].length > 0 &&
              e[1].length <= maxValue,
          ),
      ),
    );

export const ManualDataSchema = z.object({
  version: z.literal(1),
  settings: SettingsSchema.optional().transform((s) => s ?? DEFAULT_SETTINGS),
  wallets: AddressListSchema.optional().transform((l) => l ?? []),
  lots: keepValid<ManualLot>(LotSchema),
  tds: keepValid(TdsSchema),
  notMyWallets: AddressListSchema.optional().transform((l) => l ?? []),
  specificLots: StringMapSchema(128)
    .optional()
    .transform((m) => m ?? {}),
  otherGifts: StringMapSchema(40)
    .optional()
    .transform((m) => m ?? {}),
  // One answer per movement: a repeated id would count the transfer twice
  outflows: keepValid<OutflowEntry>(OutflowSchema)
    .optional()
    .transform((l) => [
      ...new Map((l ?? []).map((o) => [o.id, o] as const)).values(),
    ]),
});

export type ManualDataError = AppError<"ManualData">;

/** Validate untrusted JSON text exported by this app. */
export function parseManualData(
  text: string,
): Result<ManualData, ManualDataError> {
  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch (cause: unknown) {
    return err(
      createAppError("Not valid JSON", {
        domain: "ManualData",
        code: "ImportParseError",
        cause,
      }),
    );
  }
  const parsed = ManualDataSchema.safeParse(json);
  if (!parsed.success) {
    return err(
      createAppError("Unsupported file", {
        domain: "ManualData",
        code: "ImportVersionError",
        cause: parsed.error,
      }),
    );
  }
  return ok(parsed.data);
}

export function serializeManualData(data: ManualData): string {
  return JSON.stringify(data, null, 2);
}
