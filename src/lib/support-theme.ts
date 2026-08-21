// Maps the app's design tokens onto the P2PTheme the @p2pdotme/widgets Support
// surfaces read, so the panel matches the drawer it sits in rather than
// shipping the package default.
//
// These are var(--token) references, not resolved colours, on purpose. This
// app ships a light palette on :root and a dark one on .dark and switches with
// next-themes at runtime. Copying oklch literals here would pin the panel to
// whichever palette was copied and it would be wrong in the other theme, which
// is exactly the bug goat.cash has. themeToCssVars assigns these straight
// through as inline custom properties, so the cascade resolves them per theme.
import type { SupportTheme } from "@p2pdotme/widgets/support";

export const SUPPORT_THEME: SupportTheme = {
  colors: {
    bg: "var(--background)",
    surfaceAlt: "var(--muted)",
    fg: "var(--foreground)",
    muted: "var(--muted-foreground)",
    border: "var(--border)",
    accent: "var(--primary)",
    accentFg: "var(--primary-foreground)",
    success: "var(--success)",
    danger: "var(--destructive)",
  },
  // --radius is 0.625rem, so 10px. These two fields are numbers, not strings.
  radii: { modal: 10, button: 8 },
  font: "var(--font-sans)",
};
