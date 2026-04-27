import type { Result, ResultAsync } from "neverthrow";

/**
 * Creates a pass-through logger that prints the `Ok` or `Err` variant of a `Result`
 * (or `ResultAsync`) **without** disturbing its original flow.
 *
 * Usage:
 * ```ts
 * getWalletAddressBook()
 *   .andThen(doSomething)
 *   .andThen(teeLog("wallet.fetch"));
 * ```
 *
 * The logger is curried so you can supply a custom label once and re-use it.
 */
export function teeLog(label: string = "Result") {
  return (result: Result<unknown, unknown>) => {
    console.log(`[${label}]`, result.isOk() ? "OK" : "ERR", result);
    return result;
  };
}

/**
 * Async counterpart to {@link teeLog}. Works with `ResultAsync` values.
 *
 * ```ts
 * parseHeaders(raw)
 *   .asyncAndThen(findUser)
 *   .pipe(teeAsyncLog("http.parse"))
 * ```
 */
export function teeAsyncLog(label: string = "ResultAsync") {
  return (resultAsync: ResultAsync<unknown, unknown>) =>
    resultAsync
      .map((value) => {
        console.log(`[${label}] OK`, value);
        return value;
      })
      .mapErr((err) => {
        console.error(`[${label}] ERR`, err);
        return err;
      });
}
