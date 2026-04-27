import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import prettier from "prettier";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const i18nDir = path.join(__dirname, "../src/lib/i18n");

function findTranslationBlock(source: string): { open: number; close: number } {
  const idx = source.indexOf("translation:");
  if (idx < 0) throw new Error("translation object not found");
  const open = source.indexOf("{", idx);
  if (open < 0) throw new Error("translation block open brace not found");
  let depth = 0;
  let close = -1;
  for (let i = open; i < source.length; i++) {
    const ch = source[i];
    if (ch === "{") depth++;
    else if (ch === "}") {
      depth--;
      if (depth === 0) {
        close = i;
        break;
      }
    }
  }
  if (close === -1) throw new Error("translation block close brace not found");
  return { open, close };
}

function parseEntries(body: string): Map<string, string> {
  const entries = new Map<string, string>();
  let i = 0;
  const len = body.length;
  const isKeyChar = (c: string) => /[A-Z0-9_]/.test(c);

  const skipWs = () => {
    while (i < len && /\s/.test(body[i])) i++;
  };

  while (i < len) {
    skipWs();
    let j = i;
    while (j < len && isKeyChar(body[j])) j++;
    if (j === i) {
      const nl = body.indexOf("\n", i);
      if (nl === -1) break;
      i = nl + 1;
      continue;
    }
    const key = body.slice(i, j);
    i = j;
    skipWs();
    if (body[i] !== ":") {
      const nl = body.indexOf("\n", i);
      if (nl === -1) break;
      i = nl + 1;
      continue;
    }
    i++;
    skipWs();
    const quote = body[i] === '"' || body[i] === "'" ? body[i] : null;
    if (!quote) {
      const nl = body.indexOf("\n", i);
      if (nl === -1) break;
      i = nl + 1;
      continue;
    }
    const valStart = i;
    i++;
    let escaped = false;
    while (i < len) {
      const ch = body[i];
      if (escaped) {
        escaped = false;
      } else if (ch === "\\") {
        escaped = true;
      } else if (ch === quote) {
        i++;
        break;
      }
      i++;
    }
    const valueLiteral = body.slice(valStart, i);
    while (i < len && /\s/.test(body[i])) i++;
    if (body[i] === ",") i++;
    const normalized = valueLiteral
      .replace(/\r?\n+/g, " ")
      .replace(/\s+/g, (m) => (m.includes("\\n") ? m : " "));
    entries.set(key, normalized);
  }
  return entries;
}

async function formatWithPrettier(
  source: string,
  filePath: string,
): Promise<string> {
  try {
    const resolvedConfig = await prettier.resolveConfig(filePath);
    return await prettier.format(source, {
      ...resolvedConfig,
      filepath: filePath,
    });
  } catch {
    return source;
  }
}

async function sortI18nFile(filePath: string) {
  const src = fs.readFileSync(filePath, "utf8");
  const { open, close } = findTranslationBlock(src);
  const body = src.slice(open + 1, close);
  const entries = parseEntries(body);
  if (entries.size === 0) return;
  const keys = [...entries.keys()].sort();
  const indentMatch = body.match(/\n(\s+)[A-Z0-9_]+\s*:/);
  const indent = indentMatch ? indentMatch[1] : "    ";
  const newLines = keys.map((k) => `${indent}${k}: ${entries.get(k)},`);
  const newBody = `\n${newLines.join("\n")}\n  `;
  const out = src.slice(0, open + 1) + newBody + src.slice(close);
  const formatted = await formatWithPrettier(out, filePath);
  if (formatted !== src) {
    fs.writeFileSync(filePath, formatted, "utf8");
    console.log(`Sorted: ${path.relative(process.cwd(), filePath)}`);
  }
}

async function main() {
  const files = fs
    .readdirSync(i18nDir)
    .filter((f) => f.endsWith(".ts") && f !== "index.ts")
    .map((f) => path.join(i18nDir, f));
  await Promise.all(files.map((f) => sortI18nFile(f)));
}

await main();
