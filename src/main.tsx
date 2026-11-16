import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router";
import App from "./App.tsx";
import "./index.css";
import { i18nReady } from "./lib/i18n";
import "./lib/sentry";
import { reactErrorHandler } from "@sentry/react";

const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error("Failed to find root element with id 'root'");
}

// Wait for the user's language (a small chunk for non-English users) so the
// first paint is already translated. Never block rendering on a failure.
await i18nReady.catch(() => undefined);

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
