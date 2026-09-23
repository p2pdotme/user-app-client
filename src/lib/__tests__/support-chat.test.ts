import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";

// Each createChatWidget call yields a handle whose destroy() we can observe.
const handles: {
  destroy: ReturnType<typeof vi.fn>;
  open: ReturnType<typeof vi.fn>;
}[] = [];
vi.mock("p2pme-ai-support", () => ({
  createChatWidget: vi.fn(() => {
    const h = { destroy: vi.fn(), open: vi.fn() };
    handles.push(h);
    return h;
  }),
}));

import {
  destroyAiSupportWidget,
  ensureAiSupportWidget,
} from "@/lib/support-chat";

// Resolve the (mocked) module once up front. Two dynamic imports racing on a
// cold vi.mock registry can let the second one load the real package.
beforeAll(async () => {
  await import("p2pme-ai-support");
});

afterEach(async () => {
  await destroyAiSupportWidget();
  handles.length = 0;
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
});
