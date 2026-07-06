import type { ZodType } from "zod";
import { ONECLICK_BASE_URL, ONECLICK_JWT } from "./config";
import {
  type OneClickToken,
  type QuoteRequest,
  type QuoteResponse,
  type StatusResponse,
  ZodOneClickTokensSchema,
  ZodQuoteResponseSchema,
  ZodStatusResponseSchema,
} from "./types";

async function request<T>(
  path: string,
  schema: ZodType<T>,
  init?: RequestInit,
): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(ONECLICK_JWT ? { Authorization: `Bearer ${ONECLICK_JWT}` } : {}),
  };
  const response = await fetch(`${ONECLICK_BASE_URL}${path}`, {
    ...init,
    headers,
  });
  const body: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const message =
      body && typeof body === "object" && "message" in body
        ? String((body as { message: unknown }).message)
        : `1Click request failed (${response.status})`;
    throw new Error(message);
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    throw new Error(`Unexpected 1Click response shape for ${path}`);
  }
  return parsed.data;
}

export function getTokens(): Promise<OneClickToken[]> {
  return request("/v0/tokens", ZodOneClickTokensSchema);
}

export function getQuote(body: QuoteRequest): Promise<QuoteResponse> {
  return request("/v0/quote", ZodQuoteResponseSchema, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

// Optional: tells 1Click about the deposit tx so it detects it faster
export function submitDepositTx(params: {
  depositAddress: string;
  txHash: string;
}): Promise<StatusResponse> {
  return request("/v0/deposit/submit", ZodStatusResponseSchema, {
    method: "POST",
    body: JSON.stringify(params),
  });
}

export function getStatus(depositAddress: string): Promise<StatusResponse> {
  return request(
    `/v0/status?depositAddress=${encodeURIComponent(depositAddress)}`,
    ZodStatusResponseSchema,
  );
}
