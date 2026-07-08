import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router";
import App from "./App.tsx";
import "./index.css";
import "./lib/i18n";
import "./lib/sentry";
import { reactErrorHandler } from "@sentry/react";

// Safety net: if a lazy chunk fails to load (typically because a new deploy
// replaced hashed assets and an old chunk is now 404ing), recover with a single
// full reload to the current build instead of leaving a blank screen. The
// timestamp guard prevents reload loops on a genuinely broken chunk.
window.addEventListener("vite:preloadError", (() => {
  const last = Number(sessionStorage.getItem("chunk-reload-at") || 0);
  if (Date.now() - last < 10_000) return;
  sessionStorage.setItem("chunk-reload-at", String(Date.now()));
  window.location.reload();
}) as EventListener);

const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error("Failed to find root element with id 'root'");
}

createRoot(rootElement, {
  onUncaughtError: reactErrorHandler((error, errorInfo) => {
    console.warn("Uncaught error", error, errorInfo.componentStack);
  }),
  onCaughtError: reactErrorHandler(),
  onRecoverableError: reactErrorHandler(),
}).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
);
