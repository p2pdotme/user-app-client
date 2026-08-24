import react from "@vitejs/plugin-react-swc";
import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // Same ordering rule as vite.config.mts: real package subpaths must be
      // listed before the "@p2pdotme" catch-all or they resolve into src.
      // A string alias also matches every subpath under it, so each
      // "@p2pdotme/sdk/<entry>" the app imports needs its own line above the
      // bare "@p2pdotme/sdk" line, or it rewrites to index.mjs/<entry>.
      "@p2pdotme/widgets/support": path.resolve(
        __dirname,
        "node_modules/@p2pdotme/widgets/dist/support.js",
      ),
      "@p2pdotme/sdk/country": path.resolve(
        __dirname,
        "node_modules/@p2pdotme/sdk/dist/country.mjs",
      ),
      "@p2pdotme/sdk/fraud-engine": path.resolve(
        __dirname,
        "node_modules/@p2pdotme/sdk/dist/fraud-engine.mjs",
      ),
      "@p2pdotme/sdk/orders": path.resolve(
        __dirname,
        "node_modules/@p2pdotme/sdk/dist/orders.mjs",
      ),
      "@p2pdotme/sdk/qr-parsers": path.resolve(
        __dirname,
        "node_modules/@p2pdotme/sdk/dist/qr-parsers.mjs",
      ),
      "@p2pdotme/sdk/react": path.resolve(
        __dirname,
        "node_modules/@p2pdotme/sdk/dist/react.mjs",
      ),
      "@p2pdotme/sdk/stake": path.resolve(
        __dirname,
        "node_modules/@p2pdotme/sdk/dist/stake.mjs",
      ),
      "@p2pdotme/sdk/zkkyc": path.resolve(
        __dirname,
        "node_modules/@p2pdotme/sdk/dist/zkkyc.mjs",
      ),
      "@p2pdotme/sdk": path.resolve(
        __dirname,
        "node_modules/@p2pdotme/sdk/dist/index.mjs",
      ),
      "@": path.resolve(__dirname, "./src"),
      "@p2pdotme": path.resolve(__dirname, "./src/core/p2pdotme"),
    },
  },
  test: {
    // Three modules read these at import time and throw without them, so any
    // test that renders a real page needs them set. Add more as tests reach
    // more of the app. Nothing here is a real key.
    env: {
      VITE_CHAIN: "base",
      VITE_RANGO_API_KEY: "test-rango-key",
      VITE_THIRDWEB_CLIENT_ID: "test-client-id",
      VITE_WS_RPC_URL: "wss://rpc.invalid",
    },
    environment: "jsdom",
    globals: false,
    setupFiles: ["./src/test/setup.ts", "./src/test/thirdweb.ts"],
    include: ["src/**/*.test.ts", "src/**/*.test.tsx"],
  },
});
