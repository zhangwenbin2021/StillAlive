import crypto from "node:crypto";

type SharePayloadV1 = {
  v: 1;
  pid: string;
  streak: number;
  badge: string;
  ts: number;
  lastCheckInIso?: string;
};

function base64UrlEncode(input: Buffer | string) {
  const buf = typeof input === "string" ? Buffer.from(input, "utf8") : input;
  return buf
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function base64UrlDecodeToBuffer(input: string) {
  const pad = input.length % 4 === 0 ? "" : "=".repeat(4 - (input.length % 4));
  const b64 = input.replace(/-/g, "+").replace(/_/g, "/") + pad;
  return Buffer.from(b64, "base64");
}

function getSecret() {
  const secret = process.env.SHARE_TOKEN_SECRET;
  if (!secret) return null;
  return secret;
}

export function createShareToken(payload: Omit<SharePayloadV1, "v">): string | null {
  const secret = getSecret();
  if (!secret) return null;

  const body = base64UrlEncode(JSON.stringify({ v: 1, ...payload } satisfies SharePayloadV1));
  const sig = crypto.createHmac("sha256", secret).update(body).digest();
  return `${body}.${base64UrlEncode(sig)}`;
}

export function verifyShareToken(token: string): SharePayloadV1 | null {
  const secret = getSecret();
  if (!secret) return null;

  const [body, sigB64] = token.split(".");
  if (!body || !sigB64) return null;

  const expected = crypto.createHmac("sha256", secret).update(body).digest();
  const actual = base64UrlDecodeToBuffer(sigB64);

  if (actual.length !== expected.length) return null;
  if (!crypto.timingSafeEqual(actual, expected)) return null;

  try {
    const parsed = JSON.parse(base64UrlDecodeToBuffer(body).toString("utf8")) as SharePayloadV1;
    if (parsed.v !== 1) return null;
    if (typeof parsed.pid !== "string") return null;
    if (typeof parsed.streak !== "number") return null;
    if (typeof parsed.badge !== "string") return null;
    if (typeof parsed.ts !== "number") return null;
    if (parsed.lastCheckInIso && typeof parsed.lastCheckInIso !== "string") return null;
    return parsed;
  } catch {
    return null;
  }
}

