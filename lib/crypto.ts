import crypto from "crypto";

const ALGO = "aes-256-gcm";

function getEncryptionKey(): Buffer {
  const raw = process.env.ENCRYPTION_KEY || "careerforge-default-key-change-me";
  // Derive a consistent 32-byte key from whatever string is provided
  return crypto.scryptSync(raw, "careerforge-salt", 32);
}

export function encrypt(plaintext: string): string {
  if (!plaintext) return "";
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGO, key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  // Format: iv:tag:ciphertext (all hex)
  return `${iv.toString("hex")}:${tag.toString("hex")}:${encrypted.toString("hex")}`;
}

export function decrypt(encoded: string): string {
  if (!encoded || !encoded.includes(":")) return encoded; // plaintext fallback
  const key = getEncryptionKey();
  const [ivHex, tagHex, cipherHex] = encoded.split(":");
  if (!ivHex || !tagHex || !cipherHex) return encoded; // malformed, return as-is
  const decipher = crypto.createDecipheriv(ALGO, key, Buffer.from(ivHex, "hex"));
  decipher.setAuthTag(Buffer.from(tagHex, "hex"));
  const decrypted = Buffer.concat([decipher.update(Buffer.from(cipherHex, "hex")), decipher.final()]);
  return decrypted.toString("utf8");
}
