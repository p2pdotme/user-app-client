import "@testing-library/jest-dom/vitest";
import "@/lib/i18n";
import { cleanup } from "@testing-library/react";
import { afterEach, vi } from "vitest";

// jsdom does not implement matchMedia. The default theme is "system", and
// getResolvedTheme in src/core/client/settings.ts calls matchMedia for it.
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: (query: string) => ({
    addEventListener: () => {},
    addListener: () => {},
    dispatchEvent: () => false,
    matches: false,
    media: query,
    onchange: null,
    removeEventListener: () => {},
    removeListener: () => {},
  }),
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});
