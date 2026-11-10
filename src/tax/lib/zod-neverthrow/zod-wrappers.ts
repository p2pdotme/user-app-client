import { err, ok, type Result } from "neverthrow";
import { type ZodType, z } from "zod";
import { type AppError, createAppError, type Domain } from "@/tax/lib/errors";

/**
 * Parses data using a Zod schema and returns a neverthrow Result containing
 * either the validated data or a structured ValidationError.
 */
export function safeParseWithResult<
  S extends ZodType,
  D extends Domain = "Utils",
>(
  schema: S,
  data: unknown,
  domain: D = "Utils" as D,
): Result<z.infer<S>, AppError<D>> {
  const result = schema.safeParse(data);
  if (result.success) return ok(result.data);
  return err(
    createAppError<D>(z.prettifyError(result.error), {
      domain,
      code: "ValidationError",
      cause: result.error,
    }),
  );
}
