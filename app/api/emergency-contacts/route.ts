import { sendSms } from "@/lib/notify";
import { isValidE164 } from "@/lib/phone";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { userToProfile } from "@/lib/supabase/user";
import { createConfirmationToken } from "@/lib/tokens";
import { upsertUserProfile } from "@/lib/user-profile";

export async function GET() {
  const supabase = await createClient();
  if (!supabase) {
    return Response.json({ error: "Auth is not configured." }, { status: 500 });
  }
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const userId = user?.id;
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const contacts = await prisma.emergencyContact.findMany({
    where: { userId },
    orderBy: { createdAt: "asc" },
    take: 3,
    select: { id: true, name: true, phone: true, isConfirmed: true },
  });

  return Response.json({ contacts });
}

export async function POST(req: Request) {
  const supabase = await createClient();
  if (!supabase) {
    return Response.json({ error: "Auth is not configured." }, { status: 500 });
  }
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const userId = user?.id;
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  await upsertUserProfile(userToProfile(user));

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

  const count = await prisma.emergencyContact.count({ where: { userId } });
  if (count >= 3) {
    return Response.json(
      { error: "You can only add up to 3 emergency contacts." },
      { status: 400 },
    );
  }

  const existing = await prisma.emergencyContact.findUnique({
    where: { userId_phone: { userId, phone } },
    select: { id: true },
  });
  if (existing) {
    return Response.json(
      { error: "This phone number is already added." },
      { status: 409 },
    );
  }

  const token = createConfirmationToken();
  const expires = new Date(Date.now() + 1000 * 60 * 60 * 24);

  const contact = await prisma.emergencyContact.create({
    data: {
      userId,
      name,
      phone,
      isConfirmed: false,
      confirmationToken: token,
      confirmationExpires: expires,
    },
    select: { id: true, name: true, phone: true, isConfirmed: true },
  });

  const baseUrl =
    process.env.APP_BASE_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    "http://localhost:3000";
  const url = `${baseUrl}/confirm-contact?token=${encodeURIComponent(token)}`;
  const profile = userToProfile(user);
  const sms = `[Still Alive?] Alert: ${profile.name ?? "Your friend"} has set you as their emergency contact. Click the link to confirm: ${url}. After confirmation, you’ll be notified if they miss their check-in deadline.`;

  const smsResult = await sendSms(phone, sms);

  return Response.json({
    contact,
    smsSent: smsResult.ok,
  });
}
