import bcrypt from "bcryptjs";
import crypto from "crypto";

function requiredEnv(name: string) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing required env var: ${name}`);
  return v;
}

function deriveKey() {
  const password = requiredEnv("LAST_WORDS_ENC_PASSWORD");
  const salt = requiredEnv("LAST_WORDS_BCRYPT_SALT");

  const bcryptHash = bcrypt.hashSync(password, salt);
  return crypto.createHash("sha256").update(bcryptHash).digest();
}

export function encryptLastWords(plaintext: string) {
  const key = deriveKey();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();

  return `v1:${iv.toString("base64")}:${tag.toString("base64")}:${ciphertext.toString("base64")}`;
}

export function decryptLastWords(payload: string) {
  const [v, ivB64, tagB64, dataB64] = payload.split(":");
  if (v !== "v1" || !ivB64 || !tagB64 || !dataB64) throw new Error("Bad payload");

  const key = deriveKey();
  const iv = Buffer.from(ivB64, "base64");
  const tag = Buffer.from(tagB64, "base64");
  const data = Buffer.from(dataB64, "base64");

  const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(tag);
  const plaintext = Buffer.concat([decipher.update(data), decipher.final()]);
  return plaintext.toString("utf8");
}
