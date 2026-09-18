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
//
// The floating launcher also sat on top of controls inside modal surfaces —
// e.g. the copy-address button on the Deposit USDC drawer. Whenever any modal
// overlay is open (Vaul drawer or a Radix dialog/sheet/alert-dialog) we hide the
// launcher entirely so it can never overlap in-modal buttons, then restore it on
// close. A single MutationObserver on <body> makes this generic across every
// current and future modal surface without per-modal wiring.
//
// Two more things are grafted onto the widget from out here, both because the
// published package (1.1.1) exposes no option for them and neither is worth
// gating on an npm release:
//
//  - `openSupportHumanChat()` opens the panel straight into the widget's
//    built-in human thread, by clicking the widget's own "Chat with support"
//    card. The handle only exposes `open()`, which lands on the home screen.
//  - a "Chat on Telegram" row is injected under that card, so the market's
//    Telegram group stays one tap away without being the front door.
//
// Both reach into the widget's shadow root, which is `mode: 'open'` — the same
// access the launcher-offset style below already relies on. Every selector is
// guarded: a widget release that renames these classes loses the Telegram row
// and falls back to opening on home, rather than throwing.

const API_URL =
  (import.meta.env.VITE_SUPPORT_WIDGET_API_URL as string | undefined) ??
  "https://commops-production.up.railway.app";

type Handle = { open: () => void; close: () => void; destroy: () => void };

// Clear the sticky footer (~88px) plus the mobile home-indicator safe area, with
// a little breathing room, so the launcher never overlaps the Sell USDC button.
const LAUNCHER_OFFSET_CSS =
  ".launcher{bottom:calc(env(safe-area-inset-bottom, 0px) + 96px)!important}";

// Telegram row, styled to sit UNDER the widget's "Chat with support" card as
// the secondary option: no border, muted text, and the widget's own CSS custom
// properties so it tracks the panel's light/dark surface instead of hardcoding
// a colour. Margins match `.support-card` (16px gutters) so the two line up.
const TELEGRAM_ROW_CSS = `
.p2pme-tg-row{display:flex;align-items:center;gap:10px;width:calc(100% - 32px);
margin:0 16px 4px;padding:10px 14px;border-radius:12px;background:transparent;
color:var(--cw-muted);font-family:inherit;font-size:13px;font-weight:500;
text-decoration:none;cursor:pointer;transition:background .15s ease,color .15s ease}
.p2pme-tg-row:hover{background:var(--cw-bot-bg);color:var(--cw-fg)}
.p2pme-tg-row:focus-visible{outline:2px solid var(--cw-accent);outline-offset:2px}
.p2pme-tg-label{flex:1}
.p2pme-tg-icon{display:flex;align-items:center;color:#229ED9}
.p2pme-tg-icon svg{width:18px;height:18px}
.p2pme-tg-arrow{display:flex;align-items:center;opacity:.55}
.p2pme-tg-arrow svg{width:14px;height:14px}`;

// Telegram's own mark — filled, because it is a brand glyph rather than a UI
// stroke icon like the rest of the widget's chrome.
const TELEGRAM_ICON_SVG =
  '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.568 8.16l-1.861 8.77c-.14.63-.51.78-1.032.486l-2.85-2.1-1.374 1.322c-.152.152-.28.28-.573.28l.204-2.9 5.28-4.77c.23-.204-.05-.318-.356-.114l-6.526 4.11-2.81-.88c-.61-.19-.625-.61.128-.903l10.98-4.23c.508-.19.953.114.79.92z"/></svg>';
const EXTERNAL_ICON_SVG =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>';

// The widget's own class names, grafted onto from out here. Named once so a
// package upgrade that renames them has a single place to follow.
const SUPPORT_CARD_SELECTOR = ".support-card";
const HOME_SELECTOR = ".home";

// Render the Telegram row into the widget's home screen, directly after the
// "Chat with support" card. No-ops when the widget has no home screen, no
// support card (the human chat needs a signer + bridgeUrl), or the host never
// supplied a group URL.
function injectTelegramRow(shadow: ShadowRoot) {
  if (!supportTelegram) return;
  const card = shadow.querySelector(SUPPORT_CARD_SELECTOR);
  const home = shadow.querySelector(HOME_SELECTOR);
  if (!card || !home) return;

  const style = document.createElement("style");
  style.textContent = TELEGRAM_ROW_CSS;
  shadow.appendChild(style);

  const row = document.createElement("a");
  row.className = "p2pme-tg-row";
  row.href = supportTelegram.url;
  row.target = "_blank";
  row.rel = "noopener noreferrer";
  const icon = document.createElement("span");
  icon.className = "p2pme-tg-icon";
  icon.innerHTML = TELEGRAM_ICON_SVG;
  const label = document.createElement("span");
  label.className = "p2pme-tg-label";
  // textContent, not innerHTML — the label is a translated string.
  label.textContent = supportTelegram.label;
  const arrow = document.createElement("span");
  arrow.className = "p2pme-tg-arrow";
  arrow.innerHTML = EXTERNAL_ICON_SVG;
  row.append(icon, label, arrow);
  card.after(row);
}

// Any element matching this indicates an open modal overlay whose controls the
// launcher must not sit on top of: Vaul drawers (`[vaul-drawer]`) plus Radix
// dialogs / sheets / alert-dialogs (`role=dialog|alertdialog`), all of which
// carry `data-state="open"` while shown.
const OPEN_MODAL_SELECTOR =
  '[vaul-drawer][data-state="open"],[role="dialog"][data-state="open"],[role="alertdialog"][data-state="open"]';

// Minimal wallet interface the widget's built-in human chat signs in with. Kept
// local so this module doesn't import a type from the widget package (whose
// shape it matches structurally).
type SupportSigner = {
  address: `0x${string}`;
  signMessage: (message: string) => Promise<string>;
  getChainId: () => number;
};

let widget: Promise<Handle> | null = null;
let container: HTMLDivElement | null = null;
let mountedKey: string | null = null;
// Wallet signer + bridge URL for the widget's built-in "Talk to a human"
// (order-less) chat. Set by SupportWidget once a wallet is connected; when both
// are present the widget opens a live support thread itself, over the bridge.
// Null → the AI stays the only surface (no human action).
let supportSigner: SupportSigner | null = null;
let supportBridgeUrl: string | null = null;
// Market Telegram group + its localized label, for the row injected under the
// widget's "Chat with support" card. Null → no row. Held here rather than
// passed through `mount` because the label comes from i18n inside React while
// the injection happens in this module.
let supportTelegram: { url: string; label: string } | null = null;

/** Provide (or clear, with nulls) the wallet signer + bridge URL that power the
 *  widget's built-in human support chat. Call before mounting/opening. */
export function setSupportChatSigner(
  signer: SupportSigner | null,
  bridgeUrl: string | null,
) {
  supportSigner = signer;
  supportBridgeUrl = bridgeUrl;
}

/** Market Telegram group, rendered as a secondary row inside the widget's home
 *  screen under "Chat with support". Pass null to drop it. Set before
 *  mounting — the row is injected at widget creation. */
export function setSupportChatTelegram(
  telegram: { url: string; label: string } | null,
) {
  supportTelegram = telegram;
  // Also patch a row that is already on screen. The widget is only rebuilt when
  // the market or wallet changes, so without this an in-app language switch
  // would leave the row in the previous language until the next rebuild.
  const row = container
    ?.querySelector<HTMLElement>("[data-commops-widget]")
    ?.shadowRoot?.querySelector<HTMLAnchorElement>(".p2pme-tg-row");
  if (!row) return;
  if (!telegram) {
    row.remove();
    return;
  }
  row.href = telegram.url;
  const label = row.querySelector<HTMLElement>(".p2pme-tg-label");
  if (label) label.textContent = telegram.label;
}
// The <style> tag inside the current widget's shadow root that we toggle to
// hide/show the launcher. Re-created on each mount (survives rebuilds).
let hideStyleEl: HTMLStyleElement | null = null;
let modalObserver: MutationObserver | null = null;

function isModalOpen(): boolean {
  return !!document.querySelector(OPEN_MODAL_SELECTOR);
}

// Hide the launcher while a modal is open; restore it otherwise.
function syncLauncherVisibility() {
  if (!hideStyleEl) return;
  hideStyleEl.textContent = isModalOpen()
    ? ".launcher{display:none!important}"
    : "";
}

// Start (once) a body-wide observer that re-checks modal state whenever a
// dialog/drawer mounts, unmounts, or flips its data-state.
function ensureModalObserver() {
  if (modalObserver) return;
  modalObserver = new MutationObserver(syncLauncherVisibility);
  modalObserver.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ["data-state"],
  });
}

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
      // AI-first, human-fallback: when a wallet signer + bridge URL are wired the
      // widget renders a "Talk to a human" action that opens a live order-less
      // support thread with the p2p.me team, over the bridge, inside the widget
      // itself. Without them the action is hidden and the AI is the only surface.
      ...(supportSigner && supportBridgeUrl
        ? { signer: supportSigner, bridgeUrl: supportBridgeUrl }
        : {}),
      // When a query is supplied (e.g. FAQ search returned nothing), open the
      // panel straight away and offer the query as a one-tap starter chip that
      // submits it into the chat — the 0.4.2 widget has no prefill API.
      ...(prompt
        ? { homeScreen: false, starterPrompts: [prompt], openOnLoad: true }
        : {}),
    });
    // Lift the floating launcher above the sticky Buy/Pay/Sell footer, and add a
    // second (initially empty) style tag we toggle to hide the launcher whenever
    // a modal overlay is open so it never covers in-modal controls.
    const host = el.querySelector<HTMLElement>("[data-commops-widget]");
    const shadow = host?.shadowRoot;
    if (shadow) {
      const style = document.createElement("style");
      style.textContent = LAUNCHER_OFFSET_CSS;
      shadow.appendChild(style);
      hideStyleEl = document.createElement("style");
      shadow.appendChild(hideStyleEl);
      injectTelegramRow(shadow);
      ensureModalObserver();
      syncLauncherVisibility();
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
    hideStyleEl = null;
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

// Tear the shared instance down entirely: destroy the widget, drop its
// container + shadow-root styles, and stop the modal observer. Called when the
// Help page (the only surface that mounts the launcher) unmounts, so the
// floating icon never lingers on other screens.
export async function destroyAiSupportWidget() {
  if (widget) {
    const handle = await widget;
    handle.destroy();
  }
  container?.remove();
  modalObserver?.disconnect();
  widget = null;
  container = null;
  mountedKey = null;
  hideStyleEl = null;
  modalObserver = null;
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

// Open the panel straight into the built-in human support thread, skipping the
// home screen. Used by the Help page's "Chat with us" — an entry point that
// means "talk to the team", so landing on the AI home screen and making the
// user find the card again is a wasted tap.
//
// Done by clicking the widget's own "Chat with support" card rather than
// driving the view directly: the handle exposes only open/close/toggle, and the
// card already runs the widget's full sign-in + thread-open path. If the card
// isn't there — no wallet signer, so the widget hid the human chat — the panel
// simply stays on home, which is the right fallback.
export async function openSupportHumanChat(country: string, wallet?: string) {
  const scope = country || "global";
  await rebuildIfNeeded(`${scope}::${wallet ?? ""}::`);
  if (!widget) widget = mount(scope, wallet);
  (await widget).open();
  container
    ?.querySelector<HTMLElement>("[data-commops-widget]")
    ?.shadowRoot?.querySelector<HTMLElement>(SUPPORT_CARD_SELECTOR)
    ?.click();
}
