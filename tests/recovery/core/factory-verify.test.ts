import { type Address, concat, type Hex, keccak256, pad, slice } from "viem";
import { describe, expect, it } from "vitest";
import { RecoveryError } from "@/recovery/core/errors";
import { verifyFactoryDeploymentData } from "@/recovery/core/factory";

const DEPLOYER = "0x4e59b44847b379578588920cA78FbF26c0B4956C";
const SALT = pad("0x01", { size: 32 });
const BYTECODE =
  "0x6080604052348015600f57600080fd5b50603f80601d6000396000f3fe" as Hex;

// CREATE2 per EIP-1014, computed by hand: keccak256(0xff ++ deployer ++ salt ++ keccak256(init))[12:]
function create2(salt: Hex, bytecode: Hex): Address {
  const hash = keccak256(concat(["0xff", DEPLOYER, salt, keccak256(bytecode)]));
  return slice(hash, 12) as Address;
}

const data = (salt: Hex, bytecode: Hex) => concat([salt, bytecode]);

describe("verifyFactoryDeploymentData", () => {
  const expected = create2(SALT, BYTECODE);

  it("accepts calldata that creates the expected address", () => {
    expect(() =>
      verifyFactoryDeploymentData(data(SALT, BYTECODE), expected),
    ).not.toThrow();
  });

  it("compares addresses case-insensitively", () => {
    expect(() =>
      verifyFactoryDeploymentData(
        data(SALT, BYTECODE),
        expected.toUpperCase().replace("0X", "0x") as Address,
      ),
    ).not.toThrow();
  });

  it.each([
    ["a different salt", data(pad("0x02", { size: 32 }), BYTECODE)],
    ["different bytecode", data(SALT, `${BYTECODE}00` as Hex)],
    ["a swapped-in malicious payload", data(SALT, "0xdeadbeef" as Hex)],
  ])("rejects %s with FactoryDeployFailed", (_n, bad) => {
    try {
      verifyFactoryDeploymentData(bad, expected);
      expect.unreachable();
    } catch (err) {
      expect(err).toBeInstanceOf(RecoveryError);
      expect((err as RecoveryError).code).toBe("FactoryDeployFailed");
      expect((err as RecoveryError).message).toContain(expected);
    }
  });

  it("rejects when the expected address is a different factory", () => {
    expect(() =>
      verifyFactoryDeploymentData(
        data(SALT, BYTECODE),
        "0x00000000000000000000000000000000000000aa",
      ),
    ).toThrow(RecoveryError);
  });

  it("rejects calldata with no init code", () => {
    expect(() => verifyFactoryDeploymentData(SALT, expected)).toThrow(
      RecoveryError,
    );
  });

  it("rejects empty calldata (must not throw something other than a clean refusal)", () => {
    expect(() => verifyFactoryDeploymentData("0x", expected)).toThrow(
      RecoveryError,
    );
  });
});
