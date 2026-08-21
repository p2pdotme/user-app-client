// Guards the entry chunk split. @p2pdotme/widgets is a large package, and
// only one module in this app is allowed to pull it in at runtime: chat-view.tsx,
// the only lazily loaded module that imports the widget. Everywhere else,
// including support-theme.ts, may reference its types with a type-only
// import (erased at compile time, zero runtime cost) but never with a value
// import, or the widget silently rejoins the entry chunk.
//
// This is a SOURCE-LEVEL PROXY, not the real invariant. The real invariant
// is a property of the built bundle: does dist/assets/<entry>.js contain the
// widget's code. Proving that needs a full `bun run build` (about three
// minutes with the heap flag this repo's build requires) and belongs in its
// own CI job, not this fast unit suite. What this test checks instead is one
// causal step upstream: a value import (or a value re-export, or a bare
// side-effect import) is what puts a module in a chunk's module graph in the
// first place, so catching a stray one here is a cheap,
// necessary-but-not-sufficient stand-in that fails fast on the mistake most
// likely to reintroduce the real problem. That mistake is not limited to a
// type-only import quietly turning into a value import in this one file:
// the original bug this guards against reached the entry chunk through a
// barrel re-export three modules away from chat-view.tsx (src/hooks/index.ts
// re-exporting use-support-signer with a wildcard export, pulled in by
// auth-guard.tsx), so the pattern below also has to catch a value re-export
// and a bare side-effect import, not just a named import with a from
// clause. The actual bundle assertion is the grep over dist/index.html and
// dist/assets, run by hand and recorded in the pull request.
import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const SRC_ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);

function listSourceFiles(dir: string): string[] {
  const files: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry);
    if (statSync(full).isDirectory()) {
      files.push(...listSourceFiles(full));
    } else if (/\.(ts|tsx)$/.test(entry)) {
      files.push(full);
    }
  }
  return files;
}

// Matches three shapes that pull @p2pdotme/widgets into a module's graph as
// a value: a named or default import with a `from` clause, a named
// re-export with a `from` clause, and a bare side-effect import that has no
// named clause and no `from` keyword at all. Their type-only counterparts
// (an import or export opening with the `type` modifier, fully erased at
// compile time) do NOT count as value imports and are excluded via the
// captured leading modifier below.
//
// Deliberately NOT spelled out as a literal code example in this comment:
// doing so would make the pattern match its own doc comment, since the
// scanner below has no notion of "inside a comment" and would count this
// file itself as a value importer. The pattern also does not match a bare
// substring like the package name alone in a comment (e.g. the prose
// mentions in utils.ts and support-bridge.ts), because every alternative
// requires the actual import/export/quoted-specifier shape, not just the
// name appearing somewhere nearby.
const WIDGET_IMPORT_RE =
  /(?:import|export)\s+(type\s+)?[^;]*?from\s*["']@p2pdotme\/widgets(?:\/[^"']*)?["']|import\s+["']@p2pdotme\/widgets(?:\/[^"']*)?["']/g;

function widgetImportKinds(source: string): Array<"type" | "value"> {
  return [...source.matchAll(WIDGET_IMPORT_RE)].map((m) =>
    m[1] ? "type" : "value",
  );
}

describe("widget import boundary (source-level proxy for the bundle split)", () => {
  it("has exactly one file with a VALUE import of @p2pdotme/widgets: chat-view.tsx", () => {
    const valueImporters = listSourceFiles(SRC_ROOT)
      .filter((file) =>
        widgetImportKinds(readFileSync(file, "utf8")).includes("value"),
      )
      .map((file) => path.relative(SRC_ROOT, file).split(path.sep).join("/"));

    expect(valueImporters).toEqual(["pages/order/help-drawer/chat-view.tsx"]);
  });

  it("imports the widget in lib/support-theme.ts with a type-only import", () => {
    const file = "lib/support-theme.ts";
    const kinds = widgetImportKinds(
      readFileSync(path.join(SRC_ROOT, file), "utf8"),
    );

    expect(
      kinds.length,
      `${file} has no @p2pdotme/widgets import at all`,
    ).toBeGreaterThan(0);
    expect(
      kinds.every((kind) => kind === "type"),
      `${file} should import @p2pdotme/widgets with a type-only import, found kinds: ${JSON.stringify(kinds)}`,
    ).toBe(true);
  });
});
