import { AbiErrorSignatureNotFoundError } from "viem";
import { describe, expect, it } from "vitest";
import {
  getUserFacingErrorMessage,
  isAlreadyVerifiedError,
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

describe("liveness / passport attestation reverts", () => {
  // What a revert looks like at gas estimation: the app's TWEstimateGasError
  // ("network fee issue") wrapping viem's AbiErrorSignatureNotFoundError,
  // which carries the 4-byte selector in its message.
  const estimateGasRevert = (selector: string) => ({
    code: "TWEstimateGasError",
    message: "This transaction failed due to a network fee issue",
    cause: new AbiErrorSignatureNotFoundError(selector as `0x${string}`, {
      docsPath: "/docs",
    }),
  });

  it("names a rejected attestation instead of 'Connection problem'", () => {
    // LivenessInvalidSignature()
    expect(getUserFacingErrorMessage(t, estimateGasRevert("0x9cfb0729"))).toBe(
      "VFX_ATTESTATION_INVALID",
    );
    // LivenessAttestationExpired()
    expect(getUserFacingErrorMessage(t, estimateGasRevert("0x54710b53"))).toBe(
      "VFX_ATTESTATION_EXPIRED",
    );
  });

  it("treats a face or passport used by another wallet as already verified", () => {
    // LivenessNullifierAlreadySpent(), KycNullifierAlreadySpent()
    for (const selector of ["0x61746f27", "0xbdbb1a03"]) {
      expect(isAlreadyVerifiedError(estimateGasRevert(selector))).toBe(true);
      expect(getUserFacingErrorMessage(t, estimateGasRevert(selector))).toBe(
        "ERROR_ALREADY_VERIFIED_DESCRIPTION",
      );
    }
  });
});
