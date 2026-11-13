import { vi } from "vitest";

export type RpcCall = {
  url: string;
  method: string;
  // biome-ignore lint/suspicious/noExplicitAny: JSON-RPC params are untyped
  params: any[];
  headers: Record<string, string>;
};

// A handler returns the JSON-RPC `result`, or throws to produce an `error`.
export type RpcHandler = (call: RpcCall) => unknown;

/**
 * Replaces global fetch with a JSON-RPC router and returns the call log.
 * A method with no handler answers with an RPC error so a test never silently
 * talks to a bundler it did not expect.
 */
export function installRpc(handlers: Record<string, RpcHandler>) {
  const calls: RpcCall[] = [];
  const fetchMock = vi.fn(async (url: string, init: RequestInit) => {
    const body = JSON.parse(String(init.body));
    const call: RpcCall = {
      url,
      method: body.method,
      params: body.params,
      headers: (init.headers ?? {}) as Record<string, string>,
    };
    calls.push(call);
    const handler = handlers[body.method];
    try {
      if (!handler) throw new Error(`unhandled ${body.method}`);
      return new Response(
        JSON.stringify({ jsonrpc: "2.0", id: body.id, result: handler(call) }),
      );
    } catch (error) {
      return new Response(
        JSON.stringify({
          jsonrpc: "2.0",
          id: body.id,
          error: { code: -32000, message: (error as Error).message },
        }),
      );
    }
  });
  vi.stubGlobal("fetch", fetchMock);
  return {
    calls,
    fetchMock,
    named: (method: string) => calls.filter((c) => c.method === method),
  };
}
