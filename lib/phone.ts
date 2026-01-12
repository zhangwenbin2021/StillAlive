const E164_REGEX = /^\+[1-9]\d{1,14}$/;

export function isValidE164(phone: string) {
  return E164_REGEX.test(phone);
}

export function maskPhone(phone: string) {
  if (!phone.startsWith("+")) return phone;
  if (phone.length <= 5) return phone;

  const prefix = phone.slice(0, 2); // e.g. +1
  const tail = phone.slice(-3);
  return `${prefix}${"X".repeat(Math.max(0, phone.length - prefix.length - tail.length))}${tail}`;
}

