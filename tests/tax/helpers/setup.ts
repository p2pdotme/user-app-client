import { afterEach } from "vitest";
import { resetTaxSession } from "@/tax/contexts";

// The tax settings outlive their provider (in-memory session), so each test
// has to start from an empty one.
afterEach(() => resetTaxSession());

// jsdom lacks this browser API, which Radix uses to measure its controls
class ResizeObserverStub {
  observe(): void {}
  unobserve(): void {}
  disconnect(): void {}
}
globalThis.ResizeObserver ??=
  ResizeObserverStub as unknown as typeof ResizeObserver;

// Radix Select / Popover rely on pointer-capture and scrollIntoView, which
// jsdom does not implement.
if (!Element.prototype.hasPointerCapture) {
  Element.prototype.hasPointerCapture = () => false;
  Element.prototype.setPointerCapture = () => {};
  Element.prototype.releasePointerCapture = () => {};
}
Element.prototype.scrollIntoView ??= () => {};
