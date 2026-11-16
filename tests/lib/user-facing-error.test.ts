import { describe, expect, it } from "vitest";
import {
  getUserFacingErrorMessage,
  isNetworkOrTimeoutError,
  isUserCancellation,
} from "@/lib/user-facing-error";

const t = ((key: string) => key) as unknown as Parameters<
  typeof getUserFacingErrorMessage
>[0];

describe("isUserCancellation", () => {
  it("matches explicit user rejections", () => {
    expect(isUserCancellation(new Error("User rejected the request"))).toBe(
      true,
    );
    expect(isUserCancellation("Popup closed by user")).toBe(true);
    expect(isUserCancellation({ message: "modal closed" })).toBe(true);
  });

  it("does not treat a fetch timeout abort as a user cancel", () => {
    expect(isUserCancellation(new Error("The operation was aborted"))).toBe(
      false,
    );
    expect(
      isUserCancellation(
        new DOMException("signal is aborted without reason", "AbortError"),
      ),
    ).toBe(false);
  });
});

describe("getUserFacingErrorMessage send context", () => {
  it("keeps the plain network / timeout copy by default", () => {
    expect(getUserFacingErrorMessage(t, new Error("Failed to fetch"))).toBe(
      "ERROR_NETWORK_DESCRIPTION",
    );
    expect(getUserFacingErrorMessage(t, new Error("Request timed out"))).toBe(
      "ERROR_TIMEOUT_DESCRIPTION",
    );
    expect(
      getUserFacingErrorMessage(t, new Error("The operation was aborted")),
    ).toBe("ERROR_TIMEOUT_DESCRIPTION");
  });

  it("warns that a send may have gone through on network / timeout errors", () => {
    for (const message of [
      "Failed to fetch",
      "Request timed out",
      "The operation was aborted",
    ]) {
      expect(isNetworkOrTimeoutError(new Error(message))).toBe(true);
      expect(
        getUserFacingErrorMessage(t, new Error(message), { context: "send" }),
      ).toBe("RVW_ERROR_SEND_UNCONFIRMED_DESCRIPTION");
    }
  });

  it("leaves non-network send failures and fallbacks unchanged", () => {
    expect(
      getUserFacingErrorMessage(t, new Error("insufficient funds"), {
        context: "send",
      }),
    ).toBe("ERROR_INSUFFICIENT_BALANCE_DESCRIPTION");
    expect(
      getUserFacingErrorMessage(t, new Error("something odd"), {
        fallbackKey: "PAYF_WITHDRAW_FAILED_DESCRIPTION",
        context: "send",
      }),
    ).toBe("PAYF_WITHDRAW_FAILED_DESCRIPTION");
    expect(
      getUserFacingErrorMessage(t, new Error("something odd"), "CUSTOM_KEY"),
    ).toBe("CUSTOM_KEY");
    expect(isNetworkOrTimeoutError(new Error("insufficient funds"))).toBe(
      false,
    );
  });
});
