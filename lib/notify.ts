import nodemailer from "nodemailer";
import twilio from "twilio";

function env(name: string) {
  return process.env[name];
}

export async function sendSms(to: string, body: string) {
  const accountSid = env("TWILIO_ACCOUNT_SID");
  const authToken = env("TWILIO_AUTH_TOKEN");
  const from = env("TWILIO_FROM_NUMBER") || env("TWILIO_PHONE_NUMBER");

  if (!accountSid || !authToken || !from) {
    console.error("[sms] Twilio env vars missing; cannot send SMS", {
      hasAccountSid: Boolean(accountSid),
      hasAuthToken: Boolean(authToken),
      hasFrom: Boolean(from),
    });
    return { ok: false as const, error: "Twilio not configured" };
  }

  try {
    const client = twilio(accountSid, authToken);
    const msg = await client.messages.create({ to, from, body });
    return { ok: true as const, sid: msg.sid };
  } catch (err) {
    console.error("[sms] failed to send", { to, err });
    return { ok: false as const, error: "Failed to send SMS. Please try again later." };
  }
}

export async function sendEmail(to: string, subject: string, text: string) {
  const host = env("SMTP_HOST");
  const port = env("SMTP_PORT");
  const user = env("SMTP_USER");
  const pass = env("SMTP_PASS");
  const from = env("SMTP_FROM") || env("EMAIL_FROM") || env("SMTP_USER");

  if (!host || !port || !user || !pass || !from) {
    console.error("[email] SMTP env vars missing; cannot send email", {
      hasHost: Boolean(host),
      hasPort: Boolean(port),
      hasUser: Boolean(user),
      hasPass: Boolean(pass),
      hasFrom: Boolean(from),
    });
    return { ok: false as const, error: "Email not configured" };
  }

  try {
    const transporter = nodemailer.createTransport({
      host,
      port: Number(port),
      secure: Number(port) === 465,
      auth: { user, pass },
    });

    await transporter.sendMail({ from, to, subject, text });
    return { ok: true as const };
  } catch (err) {
    console.error("[email] failed to send", { to, err });

    const anyErr = err as
      | (Error & { responseCode?: number; response?: string; code?: string })
      | null
      | undefined;

    const parts: string[] = [];
    if (anyErr?.code) parts.push(String(anyErr.code));
    if (typeof anyErr?.responseCode === "number") parts.push(`responseCode=${anyErr.responseCode}`);
    if (anyErr?.message) parts.push(anyErr.message);
    else if (anyErr) parts.push(String(anyErr));

    const detail = parts.filter(Boolean).join(" | ");
    return {
      ok: false as const,
      error: detail ? `Email send failed: ${detail}` : "Failed to send email. Please try again later.",
    };
  }
}
