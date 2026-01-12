import { sendSms } from "@/lib/notify";
import { isValidE164 } from "@/lib/phone";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { userToProfile } from "@/lib/supabase/user";
import { createConfirmationToken } from "@/lib/tokens";
import { upsertUserProfile } from "@/lib/user-profile";

export async function PATCH(
  req: Request,
  ctx: { params: { id: string } },
) {
  const supabase = await createClient();
  if (!supabase) {
    return Response.json({ error: "Auth is not configured." }, { status: 500 });
  }
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const userId = user?.id;
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const profile = userToProfile(user);
  await upsertUserProfile(profile);

  const id = ctx.params.id;
  const body = (await req.json().catch(() => null)) as
    | { name?: unknown; phone?: unknown }
    | null;

  const name = typeof body?.name === "string" ? body.name.trim() : "";
  const phone = typeof body?.phone === "string" ? body.phone.trim() : "";

  if (!name || !phone || !isValidE164(phone)) {
    return Response.json(
      { error: "Please enter a valid phone number (E.164 format)" },
      { status: 400 },
    );
  }

  const current = await prisma.emergencyContact.findFirst({
    where: { id, userId },
    select: { id: true, phone: true },
  });
  if (!current) return Response.json({ error: "Not found" }, { status: 404 });

  const phoneChanged = current.phone !== phone;
  if (phoneChanged) {
    const dup = await prisma.emergencyContact.findUnique({
      where: { userId_phone: { userId, phone } },
      select: { id: true },
    });
    if (dup) {
      return Response.json(
        { error: "This phone number is already added." },
        { status: 409 },
      );
    }
  }

  const token = phoneChanged ? createConfirmationToken() : null;
  const expires = phoneChanged ? new Date(Date.now() + 1000 * 60 * 60 * 24) : null;

  const updated = await prisma.emergencyContact.update({
    where: { id },
    data: {
      name,
      phone,
      ...(phoneChanged
        ? {
            isConfirmed: false,
            confirmationToken: token,
            confirmationExpires: expires,
          }
        : {}),
    },
    select: { id: true, name: true, phone: true, isConfirmed: true },
  });

  let smsSent: boolean | null = null;
  if (phoneChanged && token) {
    const baseUrl =
      process.env.APP_BASE_URL ||
      process.env.NEXT_PUBLIC_SITE_URL ||
      "http://localhost:3000";
    const url = `${baseUrl}/confirm-contact?token=${encodeURIComponent(token)}`;
    const sms = `[Still Alive?] Alert: ${profile.name ?? "Your friend"} has set you as their emergency contact. Click the link to confirm: ${url}. After confirmation, you’ll be notified if they miss their check-in deadline.`;
    const smsResult = await sendSms(phone, sms);
    smsSent = smsResult.ok;
  }

  return Response.json({ contact: updated, smsSent });
}

export async function DELETE(
  _req: Request,
  ctx: { params: { id: string } },
) {
  const supabase = await createClient();
  if (!supabase) {
    return Response.json({ error: "Auth is not configured." }, { status: 500 });
  }
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const userId = user?.id;
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const id = ctx.params.id;
  const existing = await prisma.emergencyContact.findFirst({
    where: { id, userId },
    select: { id: true },
  });
  if (!existing) return Response.json({ error: "Not found" }, { status: 404 });

  await prisma.emergencyContact.delete({ where: { id } });
  return Response.json({ ok: true });
}
