import { z } from "zod";
import { istDateToInstant } from "@/tax/lib/fy";

/** Non-negative amount typed by a user, e.g. "1,23,456.78". */
export const AmountInputSchema = z
  .string()
  .trim()
  .transform((s) => s.replace(/,/g, ""))
  .pipe(z.string().regex(/^\d+(\.\d+)?$/, "Enter a positive number"));

/** IST calendar date "YYYY-MM-DD" that actually exists. */
export const IstDateInputSchema = z
  .string()
  .refine((s) => istDateToInstant(s) !== null, "Enter a valid date");

/** Empty is allowed while typing; anything else must be valid. */
export const isValidOptional = (schema: z.ZodType, value: string): boolean =>
  value === "" || schema.safeParse(value).success;
