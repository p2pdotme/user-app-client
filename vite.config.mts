import { sentryVitePlugin } from "@sentry/vite-plugin";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { defineConfig, loadEnv, type Plugin } from "vite";
import { nodePolyfills } from "vite-plugin-node-polyfills";
import { VitePWA } from "vite-plugin-pwa";
import packageJson from "./package.json";

/**
 * Point `crypto` imports inside @p2pdotme/sdk at a tiny Web Crypto shim. See
 * src/lib/shims/web-crypto.ts for why. Only the SDK's files are touched.
 */
function sdkWebCrypto(): Plugin {
  const shim = path.resolve(__dirname, "src/lib/shims/web-crypto.ts");
  // The node-polyfills plugin aliases "crypto" before resolveId hooks run, so
  // rewrite the import in the SDK's own files instead of resolving it.
  const importPattern = /from\s+["'](?:node:)?crypto["']/g;
  return {
    name: "sdk-web-crypto",
    enforce: "pre",
    transform(code, id) {
      if (!id.includes("/@p2pdotme/sdk/dist/") || !importPattern.test(code)) {
        importPattern.lastIndex = 0;
        return null;
      }
      importPattern.lastIndex = 0;
      return {
        code: code.replace(importPattern, `from ${JSON.stringify(shim)}`),
        map: null,
      };
    },
  };
}

export default ({ mode }: { mode: string }) => {
  process.env = { ...process.env, ...loadEnv(mode, process.cwd()) };
  return defineConfig({
    plugins: [
      sdkWebCrypto(),
      react(),
      tailwindcss(),
      nodePolyfills({
        // To exclude specific polyfills, add them to this list.
        exclude: [
          "fs", // Excludes the polyfill for `fs` and `node:fs`.
        ],
        // Whether to polyfill specific globals.
        globals: {
          Buffer: true, // can also be 'build', 'dev', or false
          global: true,
          process: true,
        },
        // Override the default polyfills for specific modules.
        overrides: {
          // Since `fs` is not supported in browsers, we can use the `memfs` package to polyfill it.
          fs: "memfs",
        },
        // Whether to polyfill `node:` protocol imports.
        protocolImports: true,
      }),
      VitePWA({
        strategies: "injectManifest",
        srcDir: "src",
        filename: "sw.ts",
        injectRegister: false,
        registerType: "autoUpdate",
        workbox: {
          clientsClaim: true,
          skipWaiting: true,
          maximumFileSizeToCacheInBytes: 16 * 1024 * 1024, // 16MB
        },
        manifest: {
          id: "/",
          name: "P2P.me - Pay with USDC at any QR",
          short_name: "P2P.me",
          description: "Pay with USDC at any QR code using P2P.me",
          display: "standalone",
          start_url: "/",
          scope: "/",
          lang: "en",
          categories: ["finance"],
        },
        pwaAssets: {
          disabled: false,
          config: true,
        },
        injectManifest: {
          maximumFileSizeToCacheInBytes: 16 * 1024 * 1024, // 16MB
          globPatterns: ["**/*.{js,css,html,ico,png,svg,webp}"],
          globIgnores: ["**/barretenberg*.js"],
        },
      }),
      sentryVitePlugin({
        org: "p2pme",
        project: "user-app-new",
        authToken: process.env.VITE_SENTRY_AUTH_TOKEN,
        telemetry: false,
        sourcemaps: {
          filesToDeleteAfterUpload: ["dist/assets/**.js.map"],
        },
      }),
    ],
    resolve: {
      alias: {
        react: path.resolve(__dirname, 'node_modules/react'),
        'react-dom': path.resolve(__dirname, 'node_modules/react-dom'),
        "@p2pdotme/order-routing": path.resolve(__dirname, "node_modules/@p2pdotme/order-routing"),
        "@p2pdotme/sdk/country": path.resolve(__dirname, "node_modules/@p2pdotme/sdk/dist/country.mjs"),
        "@p2pdotme/sdk/orders": path.resolve(__dirname, "node_modules/@p2pdotme/sdk/dist/orders.mjs"),
        "@p2pdotme/sdk/fraud-engine": path.resolve(__dirname, "node_modules/@p2pdotme/sdk/dist/fraud-engine.mjs"),
        "@p2pdotme/sdk/react": path.resolve(__dirname, "node_modules/@p2pdotme/sdk/dist/react.mjs"),
        "@p2pdotme/sdk/qr-parsers": path.resolve(__dirname, "node_modules/@p2pdotme/sdk/dist/qr-parsers.mjs"),
        "@p2pdotme/sdk/zkkyc": path.resolve(__dirname, "node_modules/@p2pdotme/sdk/dist/zkkyc.mjs"),
        "@p2pdotme/sdk": path.resolve(__dirname, "node_modules/@p2pdotme/sdk/dist/index.mjs"),
        // Must sit above the "@p2pdotme" -> ./src/core/p2pdotme catch-all below,
        // which would otherwise resolve this to src/core/p2pdotme/widgets/support.
        "@p2pdotme/widgets/support": path.resolve(__dirname, "node_modules/@p2pdotme/widgets/dist/support.js"),
        "@reclaimprotocol/js-sdk": path.resolve(__dirname, "node_modules/@reclaimprotocol/js-sdk"),
        "@": path.resolve(__dirname, "./src"),
        "@p2pdotme": path.resolve(__dirname, "./src/core/p2pdotme"),
      },
    },
    define: {
      global: "globalThis",
      "import.meta.env.CONTRACT_VERSION": JSON.stringify(packageJson.contractVersion),
    },
    build: {
      target: "esnext",

      // show warning only for >4 MB chunks
      chunkSizeWarningLimit: 4000,

      rollupOptions: {
        output: {
          manualChunks(id: string) {
            if (!id.includes("node_modules")) return undefined;

            // Grab the first path segment after node_modules to identify the package.
            const parts = id.split("node_modules/")[1].split("/");
            const pkgName = parts[0].startsWith("@")
              ? `${parts[0]}/${parts[1]}`
              : parts[0];

            // Only group packages that every screen needs at startup. Grouping
            // lazily-used libraries (ethers, Radix, QR/Lottie, ...) into named
            // vendor chunks forced them to download and parse before the first
            // paint; Rollup's automatic splitting keeps them with the screens
            // that use them.
            const groups: Record<string, string[]> = {
              // Intentionally keep React and its helpers together.
              "react-vendor": [
                "react",
                "react-dom",
                "scheduler",
                "react-router",
                "react-router-dom",
                "@sentry",
              ],
            };

            for (const [chunkName, pkgs] of Object.entries(groups)) {
              // Exact package match (a prefix match would also catch e.g.
              // react-day-picker and react-hook-form). "@sentry" is a scope.
              if (
                pkgs.some((pkg) =>
                  pkg.startsWith("@") && !pkg.includes("/")
                    ? pkgName.startsWith(`${pkg}/`)
                    : pkgName === pkg,
                )
              )
                return chunkName;
            }

            // Let Vite handle all other dependency splitting.
            return undefined;
          },
        },
      },
      sourcemap: true,
    },
  });
};
