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

// Any element matching this indicates an open modal overlay whose controls the
// launcher must not sit on top of: Vaul drawers (`[vaul-drawer]`) plus Radix
// dialogs / sheets / alert-dialogs (`role=dialog|alertdialog`), all of which
// carry `data-state="open"` while shown.
const OPEN_MODAL_SELECTOR =
  '[vaul-drawer][data-state="open"],[role="dialog"][data-state="open"],[role="alertdialog"][data-state="open"]';

// Telegram entry. On the home screen it is a TILE sitting beside the widget's
// own "Chat with support" card, not a row under it: the two are peers — one
// reaches the p2p.me team, the other the community group — and stacking them
// made Telegram read as a footnote on the card above it.
//
// Side by side means neither tile has room for a card's worth of content, so
// both collapse to the same two-part shape: icon on top, label under it. The
// support card's own markup is reused and re-laid-out from here (`order: -1`
// lifts its send glyph above the label) so the two tiles match exactly rather
// than approximately — same padding, same 14px/600 label, same line-height.
//
// In the SUPPORT THREAD it stays a full-width row with its subtitle, pinned to
// the foot of the view. There is no second tile to pair with there, and a lone
// half-width tile under a transcript looks like a mistake.
//
// Everything tracks the widget's CSS custom properties, so it follows the panel
// into dark mode instead of hardcoding a surface that goes wrong on a theme flip.
const TELEGRAM_CARD_CSS = `
.p2pme-help-row{display:flex;flex-wrap:wrap;align-items:stretch;gap:10px;
margin:16px 16px 4px}

.p2pme-tg-card{box-sizing:border-box;display:flex;align-items:center;gap:12px;
width:calc(100% - 32px);margin:8px 16px 4px;padding:13px 16px;
border:1px solid var(--cw-border);border-radius:14px;background:var(--cw-bg);
color:var(--cw-fg);font-family:inherit;text-decoration:none;cursor:pointer;
transition:border-color .15s ease,background .15s ease}
.p2pme-tg-card:hover{border-color:#229ED9;background:var(--cw-bot-bg)}
.p2pme-tg-card:focus-visible{outline:2px solid var(--cw-accent);outline-offset:2px}
.p2pme-tg-badge{display:flex;align-items:center;justify-content:center;flex:none;
width:30px;height:30px;border-radius:50%;background:rgba(34,158,217,.14);color:#229ED9}
.p2pme-tg-badge svg{width:17px;height:17px}
.p2pme-tg-text{display:flex;flex-direction:column;gap:1px;flex:1;min-width:0}
.p2pme-tg-title{font-size:14px;font-weight:600;color:var(--cw-fg);line-height:1.3}
.p2pme-tg-sub{font-size:12px;font-weight:400;color:var(--cw-muted);line-height:1.3}
.p2pme-tg-arrow{display:flex;align-items:center;flex:none;color:var(--cw-muted)}
.p2pme-tg-arrow svg{width:15px;height:15px}
.p2pme-tg-card:hover .p2pme-tg-arrow{color:#229ED9}

/* ---- button mode: the two home-screen actions, side by side ----
   They hold one short label each, so they are BUTTONS, not cards: icon and
   label on one line, 12px/10px padding, ~42px tall. Stacking the icon above
   the label made two 86px boxes mostly full of empty space — a card's
   footprint for a card's worth of content it does not have.

   Two class selectors, declared after the base .p2pme-tg-card rule above: the
   row's margin positions the pair, so each child gives up the width + margin
   it carries standalone. A '.p2pme-help-row > *' override ties on specificity
   with .p2pme-tg-card and loses on source order — that left both keeping their
   16px side margins and rendering unequal. */
/* Wrap decided by the CONTENT, not by a px guess: 'flex: 1 1 <n>px' means
   choosing a number for when two labels stop fitting, and any number is wrong
   for some panel width in some locale — which is how "Chat on Telegr…"
   shipped. 'min-width: max-content' never shrinks a button below its own
   label, so the pair wraps to one full-width button each instead of
   truncating. (NOT 'min(max-content, 100%)' — min() rejects intrinsic
   keywords, so that declaration is invalid and dropped silently, leaving
   'min-width: auto' and the very truncation it was meant to prevent. Verified
   with CSS.supports in the live panel.) */
.p2pme-help-row .support-card,
.p2pme-help-row .p2pme-tg-card{flex:1 1 auto;min-width:max-content;
max-width:100%;width:auto;margin:0;
flex-direction:row;align-items:center;justify-content:flex-start;gap:8px;
padding:10px 12px;border-radius:12px;
font-size:13px;font-weight:600;line-height:1.3;box-shadow:none}
/* Bare glyphs at a shared 18px. The Telegram badge's tinted disc is the right
   weight on a full-width card and too heavy inside a 42px button, where it
   crowds the label and makes the two sides look unmatched. */
/* 'order: -1' puts the support card's glyph before its label. Its markup is
   label-then-icon, so without this the two buttons mirror each other — one
   icon left, one icon right — which reads as a mistake. Reordering via CSS
   leaves the widget's own nodes (and its click handler) untouched. */
.p2pme-help-row .support-card-icon{order:-1}
.p2pme-help-row .support-card-icon,
.p2pme-help-row .p2pme-tg-badge{flex:none;width:18px;height:18px;
border-radius:0;background:none}
.p2pme-help-row .support-card-icon svg,
.p2pme-help-row .p2pme-tg-badge svg{width:18px;height:18px}
/* font-size/line-height restated on the LABELS, not just on the buttons. The
   support card's label inherits its button's 13px, but '.p2pme-tg-title' sets
   14px directly on the element, and a direct rule always beats an inherited
   value — so the two labels rendered 13px/16.9 and 14px/18.2 next to each
   other. Truncation is a last resort that should never fire at these widths;
   it is here so a long translation clips instead of overflowing the panel. */
.p2pme-help-row .support-card-label,
.p2pme-help-row .p2pme-tg-title{flex:1;min-width:0;overflow:hidden;
text-overflow:ellipsis;white-space:nowrap;
font-size:13px;font-weight:600;line-height:1.3;color:var(--cw-fg)}
.p2pme-help-row .p2pme-tg-text{flex:1;min-width:0}
/* Both dropped: no room for a second line, and the trailing arrow costs width
   the label needs. The subtitle survives in the support-thread row below, and
   the link still opens in a new tab. */
.p2pme-help-row .p2pme-tg-sub,
.p2pme-help-row .p2pme-tg-arrow{display:none}

/* In the support thread the card is a footer under the transcript, not an item
   in a list — tighten it to the bottom edge of the view. */
.human .p2pme-tg-card{margin:4px 16px 10px}`;

// Telegram's own mark — filled, because it is a brand glyph rather than a UI
// stroke icon like the rest of the widget's chrome.
const TELEGRAM_ICON_SVG =
  '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.568 8.16l-1.861 8.77c-.14.63-.51.78-1.032.486l-2.85-2.1-1.374 1.322c-.152.152-.28.28-.573.28l.204-2.9 5.28-4.77c.23-.204-.05-.318-.356-.114l-6.526 4.11-2.81-.88c-.61-.19-.625-.61.128-.903l10.98-4.23c.508-.19.953.114.79.92z"/></svg>';
// lucide `messages-square`, the same icon the Help page's "Chat with us"
// button renders — path data copied from lucide-react 0.503.0 with its default
// attributes (24x24, fill none, stroke currentColor, width 2, round caps), so
// the two are the same mark rather than two similar ones. Inlined because the
// widget lives in a shadow root and takes markup, not React elements.
const MESSAGES_SQUARE_SVG =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14 9a2 2 0 0 1-2 2H6l-4 4V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2z"/><path d="M18 9h2a2 2 0 0 1 2 2v11l-4-4h-6a2 2 0 0 1-2-2v-1"/></svg>';
const EXTERNAL_ICON_SVG =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>';

// The widget's own class names, grafted onto from out here. Named once so a
// package upgrade that renames them has a single place to follow.
const SUPPORT_CARD_SELECTOR = ".support-card";
const HOME_SELECTOR = ".home";
const HUMAN_SELECTOR = ".human";
const HUMAN_STATUS_SELECTOR = ".human-status";
const TG_CARD_SELECTOR = ".p2pme-tg-card";

function widgetShadow(): ShadowRoot | null {
  return (
    container?.querySelector<HTMLElement>("[data-commops-widget]")
      ?.shadowRoot ?? null
  );
}

// Build one Telegram card. Two are rendered — see injectTelegramCards.
function telegramCard(
  telegram: { url: string; label: string; sub: string; short: string },
  variant: "button" | "card",
) {
  const card = document.createElement("a");
  card.className = "p2pme-tg-card";
  card.href = telegram.url;
  card.target = "_blank";
  card.rel = "noopener noreferrer";

  const badge = document.createElement("span");
  badge.className = "p2pme-tg-badge";
  badge.innerHTML = TELEGRAM_ICON_SVG;

  const text = document.createElement("span");
  text.className = "p2pme-tg-text";
  const title = document.createElement("span");
  title.className = "p2pme-tg-title";
  // textContent, not innerHTML — both lines are translated strings.
  // Short form in the button; the full label only where there is room for it.
  // "Chat on Telegram" beside "Chat with support" needs 351-395px depending on
  // locale (measured across all five) and the widget's row is 339px, so the
  // long label cannot sit side by side without truncating. The brand name plus
  // the Telegram mark says the same thing in half the width.
  title.textContent = variant === "button" ? telegram.short : telegram.label;
  const sub = document.createElement("span");
  sub.className = "p2pme-tg-sub";
  sub.textContent = telegram.sub;
  text.append(title, sub);

  const arrow = document.createElement("span");
  arrow.className = "p2pme-tg-arrow";
  arrow.innerHTML = EXTERNAL_ICON_SVG;

  card.append(badge, text, arrow);
  return card;
}

// Re-skin the widget's own support card so it matches the Help page's "Chat
// with us" button: same lucide `messages-square` mark, same words. Two entry
// points to one action reading "Chat with us / paper plane" on the page and
// "Chat with support / send glyph" in the panel looks like two different
// features, and the send glyph in particular reads as "submit", not "talk to
// someone".
//
// Safe to run more than once (a locale change re-applies it), and a no-op when
// the card is absent — no signer, so the widget hid the human chat. The
// widget's own `setLanguage` never rewrites this label (verified against
// 1.1.1: `chatWithSupport` is read once, at construction), so the override
// is not fighting anything for it.
function applyPrimaryAction(shadow: ShadowRoot) {
  const card = shadow.querySelector(SUPPORT_CARD_SELECTOR);
  if (!card) return;
  const icon = card.querySelector<HTMLElement>(".support-card-icon");
  if (icon) icon.innerHTML = MESSAGES_SQUARE_SVG;
  const label = card.querySelector<HTMLElement>(".support-card-label");
  // textContent, not innerHTML — the label is a translated string.
  if (label && supportPrimaryLabel) label.textContent = supportPrimaryLabel;
}

// Render the Telegram card in BOTH places the user can be after tapping "Chat
// with us": under the home screen's "Chat with support" card, and at the foot
// of the support thread itself. One copy on home only would vanish the moment
// the button did its job and dropped the user into the thread — exactly where
// "this is taking a while, is there another way to reach you?" gets asked.
//
// No-ops when the widget has no home screen, no support card (the human chat
// needs a signer + bridgeUrl), or the host supplied no group URL.
function injectTelegramCards(shadow: ShadowRoot) {
  if (!supportTelegram) return;
  const card = shadow.querySelector(SUPPORT_CARD_SELECTOR);
  const home = shadow.querySelector(HOME_SELECTOR);
  if (!card || !home) return;

  const style = document.createElement("style");
  style.textContent = TELEGRAM_CARD_CSS;
  shadow.appendChild(style);

  // Wrap the widget's support card and ours in one flex row so they sit as
  // equal tiles. `before` + `append` moves the existing node rather than
  // cloning it, so the widget's own click handler travels with it.
  const row = document.createElement("div");
  row.className = "p2pme-help-row";
  card.before(row);
  row.append(card, telegramCard(supportTelegram, "button"));

  // Foot of the support thread, after the status line (which carries the
  // "connecting…" / "resolved" notes) so the card is the last thing in the view.
  const human = shadow.querySelector(HUMAN_SELECTOR);
  const status = human?.querySelector(HUMAN_STATUS_SELECTOR);
  if (status) status.after(telegramCard(supportTelegram, "card"));
  else human?.appendChild(telegramCard(supportTelegram, "card"));
}

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
// The resolved handle of the CURRENT mount, set once its lazy import lands.
// Teardown destroys this synchronously instead of awaiting `widget`: awaiting
// let a re-run in the same tick (SupportWidget's effect cleans up and re-runs
// on every signer / label / bridge change) pick up the old promise from
// ensureAiSupportWidget, after which the resumed teardown destroyed the very
// widget the new run had just adopted — the launcher vanished until the next
// click.
let mountedHandle: Handle | null = null;
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
let supportTelegram: {
  url: string;
  label: string;
  sub: string;
  short: string;
} | null = null;
// Label for the widget's own "Chat with support" card. Overridden so the button
// matches the Help page's "Chat with us" — one action, one name, one icon,
// whichever surface the user reached it from. Null leaves the widget's wording.
let supportPrimaryLabel: string | null = null;

/** Provide (or clear, with nulls) the wallet signer + bridge URL that power the
 *  widget's built-in human support chat. Call before mounting/opening. */
export function setSupportChatSigner(
  signer: SupportSigner | null,
  bridgeUrl: string | null,
) {
  supportSigner = signer;
  supportBridgeUrl = bridgeUrl;
}

/**
 * Label for the widget's primary support action, so it reads the same as the
 * Help page button that opens it. Set before mounting; also patches a card
 * already on screen.
 */
export function setSupportChatPrimaryLabel(label: string | null) {
  supportPrimaryLabel = label;
  const shadow = widgetShadow();
  if (shadow) applyPrimaryAction(shadow);
}

/** Market Telegram group, rendered as a secondary row inside the widget's home
 *  screen under "Chat with support". Pass null to drop it. Set before
 *  mounting — the row is injected at widget creation. */
export function setSupportChatTelegram(
  telegram: { url: string; label: string; sub: string; short: string } | null,
) {
  supportTelegram = telegram;
  // Also patch cards already on screen. The widget is only rebuilt when the
  // market or wallet changes, so without this an in-app language switch would
  // leave them in the previous language until the next rebuild.
  const cards =
    widgetShadow()?.querySelectorAll<HTMLAnchorElement>(TG_CARD_SELECTOR);
  if (!cards) return;
  for (const card of cards) {
    if (!telegram) {
      card.remove();
      continue;
    }
    card.href = telegram.url;
    const title = card.querySelector<HTMLElement>(".p2pme-tg-title");
    if (title) {
      title.textContent = card.closest(".p2pme-help-row")
        ? telegram.short
        : telegram.label;
    }
    const sub = card.querySelector<HTMLElement>(".p2pme-tg-sub");
    if (sub) sub.textContent = telegram.sub;
  }
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

// Whether the widget will be built with the human chat: both a wallet signer
// and a bridge URL are registered.
function hasHumanChat(): boolean {
  return !!(supportSigner && supportBridgeUrl);
}

// Identity of a mount. The signer's presence is part of it: a widget built
// without one has no human chat, so once a signer is registered the next
// open must rebuild rather than reuse the signer-less instance forever.
function mountKey(country: string, wallet?: string, prompt?: string): string {
  return `${country}::${wallet ?? ""}::${prompt ?? ""}::${hasHumanChat() ? "human" : "ai"}`;
}

function mount(
  country: string,
  wallet?: string,
  prompt?: string,
): Promise<Handle> {
  const el = document.createElement("div");
  document.body.appendChild(el);
  container = el;
  mountedKey = mountKey(country, wallet, prompt);
  // Lazy-import so the widget bundle stays out of the initial app chunk.
  const mounting = import("p2pme-ai-support").then(({ createChatWidget }) => {
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
    // Superseded while the import was in flight: a teardown (or a rebuild for
    // another market / wallet) already detached this mount. Destroy it here —
    // nothing else holds it — and leave the module state to the newer mount.
    if (container !== el) {
      handle.destroy();
      return handle as Handle;
    }
    mountedHandle = handle as Handle;
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
      applyPrimaryAction(shadow);
      injectTelegramCards(shadow);
      ensureModalObserver();
      syncLauncherVisibility();
    }
    return handle as Handle;
  });
  // A failed chunk fetch (flaky network, a deploy that rotated the chunk)
  // must not latch the module dead: `widget` would hold the rejected promise
  // and every later open would re-await it. Clear this mount so the next call
  // imports again, then let the caller see the failure.
  mounting.catch(() => {
    if (container === el) teardown();
  });
  return mounting;
}

// Detach the current mount, synchronously. A mount whose import has not landed
// yet sees `container` move on and destroys itself (see `mount`).
function teardown() {
  mountedHandle?.destroy();
  mountedHandle = null;
  container?.remove();
  widget = null;
  container = null;
  mountedKey = null;
  hideStyleEl = null;
}

function rebuildIfNeeded(key: string) {
  if (widget && mountedKey !== key) teardown();
}

// Mount the persistent floating launcher once, globally, at app start. Rebuilds
// if the market or the logged-in wallet changed since the last mount.
export async function ensureAiSupportWidget(country: string, wallet?: string) {
  const scope = country || "global";
  rebuildIfNeeded(mountKey(scope, wallet));
  if (!widget) widget = mount(scope, wallet);
  return widget;
}

// Tear the shared instance down entirely: destroy the widget, drop its
// container + shadow-root styles, and stop the modal observer. Called when the
// Help page (the only surface that mounts the launcher) unmounts, so the
// floating icon never lingers on other screens.
export async function destroyAiSupportWidget() {
  teardown();
  modalObserver?.disconnect();
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
  rebuildIfNeeded(mountKey(scope, wallet, prompt));
  if (!widget) widget = mount(scope, wallet, prompt);
  (await widget).open();
}

/** True when "Chat with us" can reach the human chat: a wallet signer and
 *  bridge URL are registered, so the widget builds its support card. Checked
 *  synchronously so a caller can fall back inside the same user gesture. */
export function canOpenSupportHumanChat(): boolean {
  return hasHumanChat();
}

// Open the panel straight into the built-in human support thread, skipping the
// home screen. Used by the Help page's "Chat with us" — an entry point that
// means "talk to the team", so landing on the AI home screen and making the
// user find the card again is a wasted tap.
//
// Done by clicking the widget's own "Chat with support" card rather than
// driving the view directly: the handle exposes only open/close/toggle, and the
// card already runs the widget's full sign-in + thread-open path.
//
// Resolves true once the card was clicked. False when there is no human chat
// to open (no signer — check canOpenSupportHumanChat first), when this mount
// was replaced while waiting, or when the card never appeared; the caller
// decides the fallback instead of the button silently doing nothing.
export async function openSupportHumanChat(
  country: string,
  wallet?: string,
): Promise<boolean> {
  if (!hasHumanChat()) return false;
  const scope = country || "global";
  rebuildIfNeeded(mountKey(scope, wallet));
  if (!widget) widget = mount(scope, wallet);
  const mine = container;
  (await widget).open();

  // The card is built synchronously with the rest of the widget, so it is
  // normally there the moment `mount` resolves. Give it a few frames anyway in
  // case a future version defers the home screen. Every frame re-checks that
  // this is still the same mount: a teardown or rebuild in between (the Help
  // page unmounting, a market or wallet switch) must not have us click a card
  // on a different widget.
  for (let frame = 0; frame < 10; frame++) {
    if (container !== mine) return false;
    const card = widgetShadow()?.querySelector<HTMLElement>(
      SUPPORT_CARD_SELECTOR,
    );
    if (card) {
      card.click();
      return true;
    }
    await new Promise((resolve) => requestAnimationFrame(resolve));
  }
  return false;
}
