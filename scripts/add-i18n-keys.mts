/**
 * Insert new English translation keys into src/lib/i18n/en.ts in sorted order.
 *
 * Usage: bun run scripts/add-i18n-keys.mts path/to/keys.json
 * where keys.json is a flat object: { "MY_KEY": "My text", ... }
 *
 * Existing keys are left untouched (a warning is printed). Other locales fall
 * back to English via i18next `fallbackLng`.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const enPath = path.join(__dirname, "../src/lib/i18n/en.ts");

const input = process.argv[2];
if (!input) {
  console.error("Usage: bun run scripts/add-i18n-keys.mts keys.json");
  process.exit(1);
}
const additions: Record<string, string> = JSON.parse(
  fs.readFileSync(input, "utf8"),
);

const lines = fs.readFileSync(enPath, "utf8").split("\n");
const keyLine = /^ {4}([A-Z0-9_]+):/;

for (const [key, value] of Object.entries(additions).sort(([a], [b]) =>
  a.localeCompare(b),
)) {
  if (lines.some((l) => l.startsWith(`    ${key}:`))) {
    console.warn(`skip existing key ${key}`);
    continue;
  }
  const entry = `    ${key}: ${JSON.stringify(value)},`;
  let insertAt = -1;
  let lastKeyLine = -1;
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(keyLine);
    if (!m) continue;
    lastKeyLine = i;
    if (m[1].localeCompare(key) > 0) {
      insertAt = i;
      break;
    }
  }
  if (insertAt === -1) {
    // after the last key's (possibly multi-line) value
    insertAt = lastKeyLine + 1;
    while (
      insertAt < lines.length &&
      !/^ {4}[A-Z0-9_]+:|^ {2}\}/.test(lines[insertAt])
    )
      insertAt++;
  }
  lines.splice(insertAt, 0, entry);
}

fs.writeFileSync(enPath, lines.join("\n"));
console.log(`added ${Object.keys(additions).length} key(s)`);
