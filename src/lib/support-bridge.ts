// Config for the @p2pdotme/widgets Support surfaces — the per-order signed chat
// between a user and ops, backed by the support bridge (Chatwoot behind it).
//
// Not to be confused with `support-chat.ts` in this same directory: that one
// drives the `p2pme-ai-support` AI assistant widget (a floating launcher backed
// by commops). This file is the human-ops chat on a disputed order.
//
// No hardcoded fallback — the URL comes from the environment. When unset, the
// order help drawer keeps its existing Telegram "chat with us" behaviour. Read
// lazily so it picks up env at call time rather than module-eval time.
export function getSupportBridgeUrl(): string | undefined {
  const url = import.meta.env.VITE_SUPPORT_BRIDGE_URL as string | undefined;
  return url || undefined;
}
