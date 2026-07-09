// p2p.me AI support chat controller. The `p2pme-ai-support` widget ships a fixed
// floating launcher bubble (bottom-right) plus a chat panel. We mount a single
// shared instance globally at app start (`ensureAiSupportWidget`) and can also
// open it on demand — optionally prefilled with a query — from the Help page /
// FAQ search (`openAiSupportChat`).
//
// The launcher's default `bottom: 20px` sits right on top of the sticky
// Buy/Pay/Sell footer, so on mobile it overlapped the Sell USDC button. We lift
// it above the footer (+ the safe-area inset) via a style injected into the
// widget's shadow root, keeping the launcher visible but out of the way.

const API_URL =
  (import.meta.env.VITE_SUPPORT_WIDGET_API_URL as string | undefined) ??
  "https://commops-production.up.railway.app";

type Handle = { open: () => void; close: () => void; destroy: () => void };

// Clear the sticky footer (~88px) plus the mobile home-indicator safe area, with
// a little breathing room, so the launcher never overlaps the Sell USDC button.
const LAUNCHER_OFFSET_CSS =
  ".launcher{bottom:calc(env(safe-area-inset-bottom, 0px) + 96px)!important}";

let widget: Promise<Handle> | null = null;
let container: HTMLDivElement | null = null;
let mountedKey: string | null = null;

function mount(
  country: string,
  wallet?: string,
  prompt?: string,
): Promise<Handle> {
  const el = document.createElement("div");
  document.body.appendChild(el);
  container = el;
  mountedKey = `${country}::${wallet ?? ""}::${prompt ?? ""}`;
  // Lazy-import so the widget bundle stays out of the initial app chunk.
  return import("p2pme-ai-support").then(({ createChatWidget }) => {
    const handle = createChatWidget({
      apiUrl: API_URL,
      // Scope the agent's retrieval to the user's selected market. The widget
      // also derives its DEFAULT language from this country (BRL→pt, IDR→id,
      // LatAm→es, INR→en, …) — no `language` passed, so the currency drives it
      // and the user's in-widget dropdown choice (persisted) overrides.
      country,
      // Logged-in user's 0x address: lets the agent answer order/account
      // questions directly (on-chain lookup) without asking for the wallet,
      // and turns on the proactive "problem with your recent order?" greeting.
      ...(wallet ? { wallet } : {}),
      title: "p2p.me support",
      target: el,
      // When a query is supplied (e.g. FAQ search returned nothing), open the
      // panel straight away and offer the query as a one-tap starter chip that
      // submits it into the chat — the 0.4.2 widget has no prefill API.
      ...(prompt
        ? { homeScreen: false, starterPrompts: [prompt], openOnLoad: true }
        : {}),
    });
    // Lift the floating launcher above the sticky Buy/Pay/Sell footer.
    const host = el.querySelector<HTMLElement>("[data-commops-widget]");
    const shadow = host?.shadowRoot;
    if (shadow) {
      const style = document.createElement("style");
      style.textContent = LAUNCHER_OFFSET_CSS;
      shadow.appendChild(style);
    }
    return handle as Handle;
  });
}

async function rebuildIfNeeded(key: string) {
  if (widget && mountedKey !== key) {
    const previous = await widget;
    previous.destroy();
    container?.remove();
    widget = null;
    container = null;
  }
}

// Mount the persistent floating launcher once, globally, at app start. Rebuilds
// if the market or the logged-in wallet changed since the last mount.
export async function ensureAiSupportWidget(country: string, wallet?: string) {
  const scope = country || "global";
  await rebuildIfNeeded(`${scope}::${wallet ?? ""}::`);
  if (!widget) widget = mount(scope, wallet);
  return widget;
}

// Open the chat panel, optionally prefilled with `prompt` (rebuilds the shared
// instance if the market, wallet, or the prefilled query changed).
export async function openAiSupportChat(
  country: string,
  wallet?: string,
  prompt?: string,
) {
  const scope = country || "global";
  await rebuildIfNeeded(`${scope}::${wallet ?? ""}::${prompt ?? ""}`);
  if (!widget) widget = mount(scope, wallet, prompt);
  (await widget).open();
}
