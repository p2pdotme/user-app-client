import { err, ok, type Result } from "neverthrow";
import type { ZodSchema, ZodType, z } from "zod";
import { type AppError, createAppError } from "../errors";

/**
 * Parses data using a Zod schema and returns a Neverthrow Result
 * containing either the validated data or a structured ValidationError.
 *
 * @param schema The Zod schema to use for parsing.
 * @param data The unknown data to parse.
 * @param errorMessage The error message to use for the error.
 * @param errorOptions The options to use for the error.
 * @returns An `Ok` with the parsed data if successful, or an `Err` with a structured `AppError`.
 */
export function safeParseWithResult<S extends ZodSchema | ZodType>(
  schema: S,
  data: unknown,
): Result<z.infer<S>, AppError<"Utils">> {
  const validationResult = schema.safeParse(data);
  if (validationResult.success) {
    return ok(validationResult.data as z.infer<S>);
  }
  return err(
    createAppError<"Utils">(validationResult.error.issues[0].message, {
      domain: "Utils",
      code: "ValidationError",
      cause: validationResult.error,
      context: {
        schema,
        data,
      },
    }),
  );
}
