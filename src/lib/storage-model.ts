import { err, ok, type Result } from "neverthrow";
import type { ZodSchema, ZodType } from "zod";
import { type AppError, createAppError } from "@/lib/errors";

// Deep merge where `data` wins if defined; arrays are replaced, not merged
export function deepMergeDefaults<T>(defaults: T, data: unknown): T {
  if (Array.isArray(defaults)) {
    return (Array.isArray(data) ? (data as unknown as T) : defaults) as T;
  }
  if (
    defaults &&
    typeof defaults === "object" &&
    data &&
    typeof data === "object" &&
    !Array.isArray(data)
  ) {
    const out: Record<string, unknown> = {
      ...(defaults as Record<string, unknown>),
    };
    for (const key of Object.keys(data as Record<string, unknown>)) {
      const dv = (defaults as Record<string, unknown>)[key];
      const v = (data as Record<string, unknown>)[key];
      out[key] = dv === undefined ? v : deepMergeDefaults(dv, v);
    }
    return out as T;
  }
  return (data === undefined ? defaults : (data as T)) as T;
}

// Prune unknown keys by using the defaults object as a template
export function pruneUnknownUsingTemplate<T>(value: unknown, template: T): T {
  if (Array.isArray(template)) {
    return (Array.isArray(value) ? (value as unknown as T) : template) as T;
  }
  if (
    template &&
    typeof template === "object" &&
    value &&
    typeof value === "object" &&
    !Array.isArray(value)
  ) {
    const out: Record<string, unknown> = {};
    for (const key of Object.keys(template as Record<string, unknown>)) {
      const tv = (template as Record<string, unknown>)[key];
      const vv = (value as Record<string, unknown>)[key];
      out[key] = pruneUnknownUsingTemplate(vv, tv);
    }
    return out as T;
  }
  return (value === undefined ? template : (value as T)) as T;
}

export type LoadOptions<T> = {
  key: string;
  schema: ZodSchema<T> | ZodType<T>;
  getDefault: () => T;
  migrate?: (raw: unknown) => unknown; // optional, model-specific
  prune?: boolean; // default: true; set false for open-ended containers (e.g., record maps)
};

export function loadFromStorageWithMigrations<T>({
  key,
  schema,
  getDefault,
  migrate,
  prune = true,
}: LoadOptions<T>): Result<T, AppError<"Utils">> {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return ok(getDefault());

    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      return ok(getDefault()); // corrupted JSON -> fall back
    }

    const migrated = migrate ? migrate(parsed) : parsed;

    // 1) fill missing fields from defaults
    const merged = deepMergeDefaults(getDefault(), migrated);
    // 2) optionally prune unknown keys (ignore extras from older/newer shapes)
    const toValidate = prune
      ? pruneUnknownUsingTemplate(merged, getDefault())
      : merged;
    // 3) strict-validate final shape
    const validation = (schema as ZodSchema<T>).safeParse(toValidate);
    if (validation.success) return ok(validation.data);

    return ok(getDefault()); // final guardrail: never block app usage
  } catch (cause) {
    return err(
      createAppError<"Utils">("FAILED_TO_LOAD_FROM_STORAGE", {
        domain: "Utils",
        code: "StorageError",
        cause,
        context: { key },
      }),
    );
  }
}

export function saveStrictToStorage<T>({
  key,
  schema,
  value,
}: {
  key: string;
  schema: ZodSchema<T> | ZodType<T>;
  value: T;
}): Result<T, AppError<"Utils">> {
  const parsed = (schema as ZodSchema<T>).safeParse(value);
  if (!parsed.success) {
    return err(
      createAppError<"Utils">(
        parsed.error.issues[0]?.message ?? "ValidationError",
        {
          domain: "Utils",
          code: "ValidationError",
          cause: parsed.error,
          context: { key, value },
        },
      ),
    );
  }
  try {
    localStorage.setItem(key, JSON.stringify(parsed.data));
    return ok(parsed.data);
  } catch (cause) {
    return err(
      createAppError<"Utils">("FAILED_TO_SAVE_TO_STORAGE", {
        domain: "Utils",
        code: "StorageError",
        cause,
        context: { key },
      }),
    );
  }
}
