import { keccak256, toBytes } from "viem";

export type ParsedVaa = {
  version: number;
  guardianSetIndex: number;
  guardianSignatures: Array<{ index: number; signature: Buffer }>;
  timestamp: number;
  nonce: number;
  emitterChain: number;
  emitterAddress: Buffer;
  sequence: bigint;
  consistencyLevel: number;
  payload: Buffer;
  hash: Buffer; // keccak256(body) — used for PostedVAA PDA + secp256k1 message
};

export function parseVaa(vaaBytes: Uint8Array): ParsedVaa {
  const buf = Buffer.from(vaaBytes);
  const version = buf[0];
  const guardianSetIndex = buf.readUInt32BE(1);
  const sigCount = buf[5];
  const sigLength = 66; // guardian_index(1) + signature(65)

  const guardianSignatures: Array<{ index: number; signature: Buffer }> = [];
  for (let i = 0; i < sigCount; i++) {
    const start = 6 + i * sigLength;
    guardianSignatures.push({
      index: buf[start],
      signature: buf.subarray(start + 1, start + 66), // 65 bytes: r(32)+s(32)+v(1)
    });
  }

  // Copy body bytes into a fresh buffer (avoid subarray view offset issues with keccak256)
  const body = Buffer.from(buf.subarray(6 + sigLength * sigCount));

  // Hash is single keccak256 of the body (Secp256k1 program hashes it again → double keccak = what guardians sign)
  const hashHex = keccak256(body);
  const hash = Buffer.from(hashHex.slice(2), "hex");

  console.log("[parseVaa] guardianSetIndex:", buf.readUInt32BE(1), "sigCount:", sigCount);
  console.log("[parseVaa] bodyLen:", body.length, "hash:", hashHex);

  return {
    version,
    guardianSetIndex,
    guardianSignatures,
    timestamp: body.readUInt32BE(0),
    nonce: body.readUInt32BE(4),
    emitterChain: body.readUInt16BE(8),
    emitterAddress: body.subarray(10, 42),
    sequence: body.readBigUInt64BE(42),
    consistencyLevel: body[50],
    payload: body.subarray(51),
    hash,
  };
}
