import crypto from "crypto";

export function generateSecureRandomString(length = 24): string {
  const alphabet = "abcdefghijkmnpqrstuvwxyz23456789";
  const bytes = crypto.randomBytes(length);
  let str = "";
  for (let i = 0; i < bytes.length; i++) {
    const byte = bytes[i];
    if (byte !== undefined) {
      str += alphabet[byte % alphabet.length];
    }
  }
  return str;
}

export function hashSecret(secret: string): string {
  return crypto.createHash("sha256").update(secret).digest("hex");
}

export function constantTimeEqual(a: string, b: string): boolean {
  const aBuf = Buffer.from(a, "hex");
  const bBuf = Buffer.from(b, "hex");

  if (aBuf.length !== bBuf.length) return false;

  let result = 0;
  for (let i = 0; i < aBuf.length; i++) {
    const aByte = aBuf[i];
    const bByte = bBuf[i];
    if (aByte !== undefined && bByte !== undefined) {
      result |= aByte ^ bByte;
    }
  }
  return result === 0;
}
