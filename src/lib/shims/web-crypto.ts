/**
 * Minimal stand-in for Node's `crypto` module, used ONLY for imports coming
 * from `@p2pdotme/sdk` (see the `sdk-web-crypto` plugin in vite.config.mts).
 *
 * The SDK bundles the Node build of `@noble/hashes`, which does
 * `import * as nc from "crypto"` and then uses `nc.webcrypto.getRandomValues`.
 * Without this shim, vite-plugin-node-polyfills substitutes crypto-browserify
 * (~1 MB with bn.js, elliptic and readable-stream) into the startup bundle just
 * to reach a function every browser already provides.
 */
export const webcrypto: Crypto = globalThis.crypto;

export default { webcrypto };
