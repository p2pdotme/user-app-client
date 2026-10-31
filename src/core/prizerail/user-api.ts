import { z } from "zod";

// Client for the Prizerail user API (the `prizerail` service next to the
// executor). It reads Prizerail on the server and answers per wallet:
//   GET {base}/api/v1/prizerail/users/{wallet}
//   GET {base}/api/v1/prizerail/users/{wallet}/drawings?limit&before&entered
// Every response is { success, data, meta? } or { success: false, error }.

const REQUEST_TIMEOUT_MS = 15_000;

const drawingEntriesSchema = z.object({
  drawingId: z.string(),
  drawingNumber: z.number().nullable(),
  kind: z.string(),
  status: z.string(),
  drawAt: z.string().nullable(),
  cutoffAt: z.string().nullable(),
  entered: z.boolean(),
  entries: z.number(),
  position: z.number().nullable(),
  entrantCount: z.number(),
  totalEntries: z.number(),
  shareOfEntries: z.number(),
  won: z.boolean(),
  prizeCents: z.number().nullable(),
});

const winSchema = z.object({
  drawingId: z.string(),
  drawingNumber: z.number().nullable(),
  kind: z.string(),
  drawAt: z.string(),
  position: z.number(),
  amountCents: z.number(),
});

const summarySchema = z.object({
  wallet: z.string(),
  currentDrawing: drawingEntriesSchema.nullable(),
  wins: z.object({ count: z.number(), totalCents: z.number() }),
  recentWins: z.array(winSchema),
});

const errorEnvelopeSchema = z.object({
  success: z.literal(false),
  error: z.object({ code: z.string(), message: z.string() }),
});

function okEnvelope<T extends z.ZodType>(data: T) {
  return z.object({
    success: z.literal(true),
    data,
    meta: z.record(z.string(), z.unknown()).optional(),
  });
}

const summaryEnvelope = okEnvelope(summarySchema);
const drawingsEnvelope = okEnvelope(z.array(drawingEntriesSchema));
const drawingsMetaSchema = z.object({
  nextBefore: z.string().nullable().optional(),
});

export type UserDrawingEntries = z.infer<typeof drawingEntriesSchema>;
export type UserWin = z.infer<typeof winSchema>;
export type UserPrizeSummary = z.infer<typeof summarySchema>;

export interface UserDrawingsPage {
  items: UserDrawingEntries[];
  nextBefore: string | null;
}

export class PrizerailUserApiError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(message: string, status: number, code: string) {
    super(message);
    this.name = "PrizerailUserApiError";
    this.status = status;
    this.code = code;
  }
}

export interface UserApiOptions {
  baseUrl: string;
  fetchImpl?: typeof fetch;
}

async function getJson(url: string, options: UserApiOptions): Promise<unknown> {
  const fetchImpl = options.fetchImpl ?? fetch;
  // Manual controller rather than AbortSignal.timeout: the PWA still has to
  // run on Safari < 16 (see core/prizerail/public.ts).
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  let res: Response;
  try {
    res = await fetchImpl(url, {
      headers: { Accept: "application/json" },
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timer);
  }
  const body: unknown = await res.json().catch(() => null);
  if (!res.ok) {
    const err = errorEnvelopeSchema.safeParse(body);
    throw new PrizerailUserApiError(
      err.success ? err.data.error.message : `HTTP ${res.status}`,
      res.status,
      err.success ? err.data.error.code : `http_${res.status}`,
    );
  }
  return body;
}

function userUrl(baseUrl: string, wallet: string, path = ""): string {
  const base = baseUrl.replace(/\/+$/, "");
  return `${base}/api/v1/prizerail/users/${encodeURIComponent(wallet)}${path}`;
}

function parse<T>(schema: z.ZodType<T>, body: unknown, what: string): T {
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    throw new PrizerailUserApiError(
      `prizerail user api: unexpected ${what} response`,
      0,
      "bad_response",
    );
  }
  return parsed.data;
}

export async function fetchUserPrizeSummary(
  wallet: string,
  options: UserApiOptions,
): Promise<UserPrizeSummary> {
  const body = await getJson(userUrl(options.baseUrl, wallet), options);
  return parse(summaryEnvelope, body, "summary").data;
}

export async function fetchUserDrawings(
  wallet: string,
  params: { limit?: number; before?: string; enteredOnly?: boolean },
  options: UserApiOptions,
): Promise<UserDrawingsPage> {
  const query = new URLSearchParams();
  if (params.limit !== undefined) query.set("limit", String(params.limit));
  if (params.before) query.set("before", params.before);
  if (params.enteredOnly) query.set("entered", "true");
  const qs = query.toString();
  const body = await getJson(
    userUrl(options.baseUrl, wallet, `/drawings${qs ? `?${qs}` : ""}`),
    options,
  );
  const envelope = parse(drawingsEnvelope, body, "drawings");
  const meta = drawingsMetaSchema.safeParse(envelope.meta ?? {});
  return {
    items: envelope.data,
    nextBefore: meta.success ? (meta.data.nextBefore ?? null) : null,
  };
}
