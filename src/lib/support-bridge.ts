// Config for the @p2pdotme/widgets Support surfaces — the per-order signed chat
// between a user and ops, backed by the support bridge (Chatwoot behind it).
//
// Not to be confused with `support-chat.ts` in this same directory: that one
// drives the `p2pme-ai-support` AI assistant widget (a floating launcher backed
// by commops). This file is the human-ops chat on a disputed order.
//
// No hardcoded fallback — the URL comes from the environment. When unset the
// order help drawer simply omits the in-app chat row; its Telegram button is
// unconditional and unaffected.
//
// This is a BUILD-TIME variable. Vite replaces `import.meta.env.VITE_*` with a
// string literal when the bundle is built, so it has to be present in the build
// environment — setting it as a runtime service variable does nothing and the
// feature stays dark with no error anywhere. The function wrapper does not
// change that; it exists so `vi.stubEnv` can vary the value per test, which a
// module-eval const could not.
export function getSupportBridgeUrl(): string | undefined {
  const url = import.meta.env.VITE_SUPPORT_BRIDGE_URL as string | undefined;
  return url || undefined;
}
