import crypto from "crypto";

export function createConfirmationToken() {
  return crypto.randomBytes(24).toString("hex");
}

