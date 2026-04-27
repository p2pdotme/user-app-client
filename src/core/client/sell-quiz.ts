import { err, ok, type Result } from "neverthrow";
import { z } from "zod";
import { STORAGE_KEYS } from "@/lib/constants";
import { type AppError, createAppError } from "@/lib/errors";
import {
  loadFromStorageWithMigrations,
  saveStrictToStorage,
} from "@/lib/storage-model";

// Persisted quiz state for gating sell flow
const SellQuizSchema = z.object({
  completedAt: z.number().optional(), // epoch ms
  completed: z.boolean().default(false),
  version: z.literal(1).default(1),
});

export type SellQuizState = z.infer<typeof SellQuizSchema>;
export type SellQuizError = AppError<"SellQuiz">;

const defaultSellQuizState = (): SellQuizState => ({
  completed: false,
  version: 1,
});

export function getSellQuizState(): Result<SellQuizState, SellQuizError> {
  const res = loadFromStorageWithMigrations<SellQuizState>({
    key: STORAGE_KEYS.SELL_QUIZ,
    schema: SellQuizSchema,
    getDefault: defaultSellQuizState,
    migrate: (raw) => raw,
  });
  return res.mapErr((e) =>
    createAppError<"SellQuiz">(e.message, {
      domain: "SellQuiz",
      code: e.code,
      cause: e.cause,
      context: e.context ?? {},
    }),
  );
}

export function markSellQuizCompleted(): Result<SellQuizState, SellQuizError> {
  const next: SellQuizState = {
    completed: true,
    completedAt: Date.now(),
    version: 1,
  };
  const res = saveStrictToStorage<SellQuizState>({
    key: STORAGE_KEYS.SELL_QUIZ,
    schema: SellQuizSchema,
    value: next,
  });
  return res.match(
    (value) => ok(value),
    (e) =>
      err(
        createAppError<"SellQuiz">(e.message, {
          domain: "SellQuiz",
          code: e.code,
          cause: e.cause,
          context: e.context ?? {},
        }),
      ),
  );
}
