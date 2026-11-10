import { errAsync, ResultAsync } from "neverthrow";
import type { Address } from "viem";
import { z } from "zod";
import { PAGE_SIZE, SUBGRAPH_URL } from "@/tax/core/subgraph/config";
import { USER_ORDERS_QUERY } from "@/tax/core/subgraph/queries";
import { AddressSchema, OrdersPageSchema } from "@/tax/core/subgraph/schemas";
import type { RawOrder } from "@/tax/core/types";
import { type AppError, createAppError, isAppError } from "@/tax/lib/errors";

export type SubgraphError = AppError<"Subgraph">;

/** Validate (viem isAddress, EIP-55 aware) and lowercase a wallet address. */
export function normalizeAddress(input: string): Address | null {
  const result = AddressSchema.safeParse(input);
  return result.success ? result.data : null;
}

export interface PageVars {
  address: string;
  lastId: string;
  first: number;
}

/** Returns the raw (unvalidated) rows of one page. */
export type PageFetcher = (
  vars: PageVars,
  signal?: AbortSignal,
) => Promise<unknown>;

const GraphQLResponseSchema = z.object({
  data: z.object({ orders_collection: z.unknown() }).nullish(),
  errors: z.array(z.unknown()).nullish(),
});

/** Plain GraphQL-over-HTTP POST, the same way the app queries the subgraph. */
export const defaultPageFetcher: PageFetcher = async (vars, signal) => {
  const response = await fetch(SUBGRAPH_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query: USER_ORDERS_QUERY, variables: { ...vars } }),
    signal,
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const body = GraphQLResponseSchema.parse(await response.json());
  if (body.errors?.length || !body.data) {
    throw new Error("The subgraph returned an error", { cause: body.errors });
  }
  return body.data.orders_collection;
};

export interface FetchOptions {
  fetchPage?: PageFetcher;
  pageSize?: number;
  onProgress?: (loaded: number) => void;
  signal?: AbortSignal;
  /** Safety stop to avoid an infinite loop if the API misbehaves. */
  maxPages?: number;
}

const subgraphError = (
  code: SubgraphError["code"],
  message: string,
  cause?: unknown,
  context?: Record<string, unknown>,
): SubgraphError =>
  createAppError(message, { domain: "Subgraph", code, cause, context });

/**
 * Fetch the user's FULL order history (all years), paginating by id
 * (`id_gt: lastId`, orderBy id asc) until a page returns fewer than pageSize
 * rows. Every page is validated with zod before it is used.
 */
export function fetchAllOrders(
  address: string,
  opts: FetchOptions = {},
): ResultAsync<RawOrder[], SubgraphError> {
  const normalized = normalizeAddress(address);
  if (!normalized) {
    return errAsync(
      subgraphError("SGInvalidAddress", "Invalid wallet address"),
    );
  }
  const fetchPage = opts.fetchPage ?? defaultPageFetcher;
  const pageSize = opts.pageSize ?? PAGE_SIZE;
  const maxPages = opts.maxPages ?? 10_000;

  const run = async (): Promise<RawOrder[]> => {
    const all: RawOrder[] = [];
    let lastId = "0x";
    for (let page = 0; page < maxPages; page++) {
      let raw: unknown;
      try {
        raw = await fetchPage(
          { address: normalized, lastId, first: pageSize },
          opts.signal,
        );
      } catch (cause: unknown) {
        throw subgraphError(
          "SGNetworkError",
          "Could not reach the P2P.me subgraph",
          cause,
          { page },
        );
      }
      const parsed = OrdersPageSchema.safeParse(raw);
      if (!parsed.success) {
        throw subgraphError(
          "SGParseError",
          "Unexpected order shape from subgraph",
          parsed.error,
          { page },
        );
      }
      all.push(...parsed.data);
      opts.onProgress?.(all.length);
      if (parsed.data.length < pageSize) return all;
      lastId = parsed.data[parsed.data.length - 1].id;
    }
    throw subgraphError(
      "SGTooManyPages",
      "Too many pages returned by the subgraph",
      undefined,
      { maxPages },
    );
  };

  return ResultAsync.fromPromise(run(), (e) =>
    isAppError(e) && e.domain === "Subgraph"
      ? (e as SubgraphError)
      : subgraphError("SGNetworkError", "Unexpected subgraph failure", e),
  );
}
