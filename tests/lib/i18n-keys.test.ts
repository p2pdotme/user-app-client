import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { en } from "@/lib/i18n/en";

/**
 * Every literal translation key used in the source must exist in English
 * (the fallback language). Catches keys deleted as "unused" by mistake and
 * new keys that were used but never added.
 */
function sourceFiles(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      return full.includes(`${path.sep}i18n`) ? [] : sourceFiles(full);
    }
    return /\.(ts|tsx)$/.test(entry.name) ? [full] : [];
  });
}

describe("i18n keys", () => {
  it('every literal t("KEY") used in src exists in en.ts', () => {
    const keys = new Set(Object.keys(en.translation));
    const missing = new Map<string, string>();
    const literal = /\bt\(\s*["']([A-Z][A-Z0-9_]+)["']/g;
    for (const file of sourceFiles(path.resolve(__dirname, "../../src"))) {
      const code = fs.readFileSync(file, "utf8");
      for (const match of code.matchAll(literal)) {
        if (!keys.has(match[1])) {
          missing.set(match[1], path.relative(process.cwd(), file));
        }
      }
    }
    expect(Object.fromEntries(missing)).toEqual({});
  });
});
