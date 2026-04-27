import { sentryVitePlugin } from "@sentry/vite-plugin";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { defineConfig, loadEnv } from "vite";
import { nodePolyfills } from "vite-plugin-node-polyfills";
import { VitePWA } from "vite-plugin-pwa";
import packageJson from "./package.json";

export default ({ mode }: { mode: string }) => {
  process.env = { ...process.env, ...loadEnv(mode, process.cwd()) };
  return defineConfig({
    plugins: [
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
          name: "P2P.me - Pay with USDC at any QR",
          short_name: "P2P.me",
          description: "Pay with USDC at any QR code using P2P.me",
          display: "standalone",
        },
        pwaAssets: {
          disabled: false,
          config: true,
        },
        injectManifest: {
          maximumFileSizeToCacheInBytes: 16 * 1024 * 1024, // 16MB
          globPatterns: ["**/*.{js,css,html,ico,png,svg,webp}"],
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
        "@zkpassport/sdk": path.resolve(__dirname, "node_modules/@zkpassport/sdk"),
        "@reclaimprotocol/js-sdk": path.resolve(__dirname, "node_modules/@reclaimprotocol/js-sdk"),
        "@": path.resolve(__dirname, "./src"),
        "@p2pdotme": path.resolve(__dirname, "./src/core/p2pdotme"),
      },
    },
    optimizeDeps: {
      include: ["@zkpassport/sdk", "@reclaimprotocol/js-sdk"],
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

            // Mapping of chunk names to package name prefixes.
            const groups: Record<string, string[]> = {
              // Intentionally keep React and its helpers together.
              "react-vendor": [
                "react",
                "react-dom",
                "scheduler",
                "react-router",
                "react-router-dom",
                "@sentry"
              ],
              "ui-vendor": ["@radix-ui", "lucide-react", "framer-motion"],
              "web3-vendor": [
                "@thirdweb-dev",
                "ethers",
                "viem",
                "wagmi",
                "walletconnect",
                "biconomy",
              ],
              analytics: ["@amplitude"],
              media: ["qr-scanner", "lottie", "lottie-web"],
            };

            for (const [chunkName, pkgs] of Object.entries(groups)) {
              if (pkgs.some((prefix) => pkgName.startsWith(prefix)))
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
