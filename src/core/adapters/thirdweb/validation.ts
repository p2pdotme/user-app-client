import { err, ok, type Result } from "neverthrow";
import { formatUnits, type Hex, hexToString, isAddress } from "viem";
import { type ZodSchema, type ZodType, z } from "zod";
import { SUPPORTED_CURRENCIES } from "@/lib/constants";
import { type AppError, createAppError } from "@/lib/errors";

export type ThirdwebAdapterError = AppError<"ThirdwebAdapter">;

/**
 * Validates data using a Zod schema and returns a Neverthrow Result
 * containing either the validated data or a structured ZodError.
 *
 * @param schema The Zod schema to use for validation.
 * @param data The unknown data to validate.
 * @returns An `Ok` with the validated data if successful, or an `Err` with a structured `ZodError`.
 */
export function validateBeforeUse<S extends ZodSchema | ZodType>(
  schema: S,
  data: unknown,
): Result<z.infer<S>, ThirdwebAdapterError> {
  const validationResult = schema.safeParse(data);
  if (validationResult.success) {
    return ok(validationResult.data as z.infer<S>);
  }
  return err(
    createAppError<"ThirdwebAdapter">(z.prettifyError(validationResult.error), {
      domain: "ThirdwebAdapter",
      code: "TWValidateError",
      cause: validationResult.error,
      context: {
        schema,
        data,
      },
    }),
  );
}

export const OrderIdSchema = z
  .string()
  .refine((id) => !Number.isNaN(Number(id)) && Number(id) >= 0, {
    message: "Order ID must be a number greater than or equal to 0",
  });

export const CurrencySchema = z
  .string()
  .transform((val) => hexToString(val as Hex, { size: 32 }))
  .pipe(z.enum(SUPPORTED_CURRENCIES));

const OrderStatusSchema = z
  .number()
  .refine((val) => val >= 0 && val <= 4, {
    error: "Order status must be between 0 and 4",
  })
  .transform((val) => {
    switch (val) {
      case 0:
        return "PLACED";
      case 1:
        return "ACCEPTED";
      case 2:
        return "PAID";
      case 3:
        return "COMPLETED";
      case 4:
        return "CANCELLED";
      default:
        throw new Error(`Invalid order status value: ${val}`);
    }
  });

const OrderTypeSchema = z
  .number()
  .refine((val) => val >= 0 && val <= 2, {
    error: "Order type must be between 0 and 2",
  })
  .transform((val) => {
    switch (val) {
      case 0:
        return "BUY";
      case 1:
        return "SELL";
      case 2:
        return "PAY";
      default:
        throw new Error(`Invalid order type value: ${val}`);
    }
  });

const DisputeStatusSchema = z
  .number()
  .refine((val) => val >= 0 && val <= 2, {
    error: "Dispute status must be between 0 and 2",
  })
  .transform((val) => {
    switch (val) {
      case 0:
        return "DEFAULT";
      case 1:
        return "RAISED";
      case 2:
        return "SETTLED";
      default:
        throw new Error(`Invalid dispute status value: ${val}`);
    }
  });

const EntitySchema = z
  .number()
  .refine((val) => val >= 0 && val <= 1, {
    error: "Entity must be between 0 and 1",
  })
  .transform((val) => {
    switch (val) {
      case 0:
        return "USER";
      case 1:
        return "MERCHANT";
      default:
        throw new Error(`Invalid entity value: ${val}`);
    }
  });

export const DisputeSchema = z.object({
  accountNumber: z.bigint().transform((val) => val.toString()),
  raisedBy: EntitySchema,
  status: DisputeStatusSchema,
  redactTransId: z.bigint().transform((val) => val.toString()),
});

// Order Schema for contract data
export const OrderSchema = z.object({
  acceptedAccountNo: z.bigint().transform((val) => val.toString()),
  acceptedMerchant: z.string().refine((val) => isAddress(val), {
    error: "Accepted merchant must be a valid address",
  }),
  amount: z.bigint().transform((val) => formatUnits(val, 6)),
  assignedAccountNos: z.array(z.bigint().transform((val) => val.toString())),
  completedTimestamp: z.bigint().transform((val) => val.toString()),
  currency: CurrencySchema,
  disputeInfo: DisputeSchema,
  encMerchantUpi: z.string(),
  encUpi: z.string(),
  fiatAmount: z.bigint().transform((val) => formatUnits(val, 6)),
  id: z.bigint().transform((val) => val.toString()),
  orderType: OrderTypeSchema,
  placedTimestamp: z.bigint().transform((val) => val.toString()),
  preferredPaymentChannelConfigId: z
    .bigint()
    .transform((val) => val.toString()),
  pubkey: z.string(),
  recipientAddr: z.string().refine((val) => isAddress(val), {
    error: "Recipient address must be a valid address",
  }),
  status: OrderStatusSchema,
  user: z.string().refine((val) => isAddress(val), {
    error: "User address must be a valid address",
  }),
  userCompleted: z.boolean(),
  userCompletedTimestamp: z.bigint().transform((val) => val.toString()),
  userPubKey: z.string(),
});

export type OrderStatus = z.infer<typeof OrderStatusSchema>;
export type OrderType = z.infer<typeof OrderTypeSchema>;
export type DisputeStatus = z.infer<typeof DisputeStatusSchema>;
export type Entity = z.infer<typeof EntitySchema>;
export type Order = z.infer<typeof OrderSchema>;
