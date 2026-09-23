import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";

// Each createChatWidget call yields a handle whose destroy() we can observe.
// Like the real widget, it renders into `target` behind a shadow root, and
// only builds the "Chat with support" card when it was given a signer.
const handles: {
  destroy: ReturnType<typeof vi.fn>;
  open: ReturnType<typeof vi.fn>;
  cardClick: ReturnType<typeof vi.fn>;
  signed: boolean;
}[] = [];
let failNext = false;
// Simulates a widget version that defers its home screen: no card yet.
let deferCard = false;
vi.mock("p2pme-ai-support", () => ({
  createChatWidget: vi.fn((opts: { target: HTMLElement; signer?: unknown }) => {
    if (failNext) {
      failNext = false;
      throw new Error("chunk load failed");
    }
    const host = document.createElement("div");
    host.setAttribute("data-commops-widget", "");
    const shadow = host.attachShadow({ mode: "open" });
    const cardClick = vi.fn();
    if (opts.signer && !deferCard) {
      const card = document.createElement("div");
      card.className = "support-card";
      card.addEventListener("click", cardClick);
      shadow.appendChild(card);
    }
    opts.target.appendChild(host);
    const h = {
      destroy: vi.fn(),
      open: vi.fn(),
      cardClick,
      signed: !!opts.signer,
    };
    handles.push(h);
    return h;
  }),
}));

import {
  canOpenSupportHumanChat,
  destroyAiSupportWidget,
  ensureAiSupportWidget,
  openSupportHumanChat,
  setSupportChatSigner,
} from "@/lib/support-chat";

const signer = {
  address: "0x000000000000000000000000000000000000abcd" as const,
  signMessage: async () => "0xsig",
  getChainId: () => 8453,
};

// Resolve the (mocked) module once up front. Two dynamic imports racing on a
// cold vi.mock registry can let the second one load the real package.
beforeAll(async () => {
  await import("p2pme-ai-support");
});

afterEach(async () => {
  await destroyAiSupportWidget();
  setSupportChatSigner(null, null);
  handles.length = 0;
  failNext = false;
  deferCard = false;
});

describe("support-chat widget lifecycle", () => {
  // SupportWidget's effect cleans up (destroy) and re-runs (ensure) in the
  // same tick whenever its deps change — e.g. on page load, when the chain id
  // arrives a moment after the account, while the first mount's lazy import is
  // still in flight. The re-run must end up with a LIVE launcher.
  it("destroy + ensure while the first import is in flight leaves a live launcher", async () => {
    const first = ensureAiSupportWidget("INR", "0xabc");
    await Promise.resolve(); // mounted, import not yet resolved
    expect(handles).toHaveLength(0);

    const destroying = destroyAiSupportWidget();
    const ensured = ensureAiSupportWidget("INR", "0xabc");
    await Promise.all([first, destroying]);
    const live = (await ensured) as unknown as {
      destroy: ReturnType<typeof vi.fn>;
    };

    expect(live.destroy).not.toHaveBeenCalled();
    // Every other handle created along the way was torn down exactly once.
    for (const h of handles) {
      if (h !== live) expect(h.destroy).toHaveBeenCalledOnce();
    }
  });

  it("a mount superseded before its import lands destroys itself exactly once", async () => {
    const first = ensureAiSupportWidget("INR", "0xabc");
    // One microtask: ensure has mounted (container attached) but the lazy
    // import has not resolved into a handle yet.
    await Promise.resolve();
    expect(handles).toHaveLength(0);
    await destroyAiSupportWidget();
    await first;
    expect(handles).toHaveLength(1);
    expect(handles[0]?.destroy).toHaveBeenCalledOnce();
  });

  it("a failed load does not latch the widget dead — the next open retries", async () => {
    failNext = true;
    await expect(ensureAiSupportWidget("INR", "0xabc")).rejects.toThrow(
      "chunk load failed",
    );
    const retried = await ensureAiSupportWidget("INR", "0xabc");
    expect(handles).toHaveLength(1);
    expect(retried).toBe(handles[0]);
  });

  it("a widget built without a signer is rebuilt once a signer is registered", async () => {
    await ensureAiSupportWidget("INR", "0xabc");
    expect(handles[0]?.signed).toBe(false);

    setSupportChatSigner(signer, "https://bridge.example");
    await ensureAiSupportWidget("INR", "0xabc");
    expect(handles).toHaveLength(2);
    expect(handles[0]?.destroy).toHaveBeenCalledOnce();
    expect(handles[1]?.signed).toBe(true);
  });
});

describe("openSupportHumanChat", () => {
  it("without a signer reports false and mounts nothing", async () => {
    expect(canOpenSupportHumanChat()).toBe(false);
    await expect(openSupportHumanChat("INR", "0xabc")).resolves.toBe(false);
    expect(handles).toHaveLength(0);
  });

  it("with a signer opens the panel and clicks the support card", async () => {
    setSupportChatSigner(signer, "https://bridge.example");
    expect(canOpenSupportHumanChat()).toBe(true);
    await expect(openSupportHumanChat("INR", "0xabc")).resolves.toBe(true);
    expect(handles[0]?.open).toHaveBeenCalledOnce();
    expect(handles[0]?.cardClick).toHaveBeenCalledOnce();
  });

  it("stops, without clicking, when its mount is replaced mid-wait", async () => {
    setSupportChatSigner(signer, "https://bridge.example");
    deferCard = true;
    // While we wait a frame for the card, the Help page unmounts and a new
    // widget — one that does render its card — takes over.
    const raf = vi
      .spyOn(window, "requestAnimationFrame")
      .mockImplementation((cb) => {
        deferCard = false;
        void destroyAiSupportWidget()
          .then(() => ensureAiSupportWidget("INR", "0xabc"))
          .then(() => cb(0));
        return 0;
      });
    try {
      await expect(openSupportHumanChat("INR", "0xabc")).resolves.toBe(false);
      expect(handles).toHaveLength(2);
      for (const h of handles) expect(h.cardClick).not.toHaveBeenCalled();
    } finally {
      raf.mockRestore();
    }
  });
});
