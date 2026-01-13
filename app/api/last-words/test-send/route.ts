import { sendEmail } from "@/lib/notify";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";

function clamp500(text: string) {
  return text.length > 500 ? text.slice(0, 500) : text;
}

export async function POST() {
  const supabase = await createClient();
  if (!supabase) {
    return Response.json({ error: "Auth is not configured." }, { status: 500 });
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const userId = user?.id;
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const profile = await prisma.userProfile.findUnique({
    where: { userId },
    select: { name: true },
  });

  const row = await prisma.lastWords.findUnique({
    where: { userId },
    select: { message: true, deliveryThreshold: true },
  });
  const message = (row?.message ?? "").trim();
  if (!message) {
    return Response.json(
      { error: "No last words message saved yet." },
      { status: 400 },
    );
  }

  const contacts = await prisma.emergencyContact.findMany({
    where: { userId },
    orderBy: { createdAt: "asc" },
    take: 3,
    select: { id: true, email: true },
  });
  if (contacts.length === 0) {
    return Response.json({ error: "No emergency contacts to notify." }, { status: 400 });
  }

  const baseUrl =
    process.env.APP_BASE_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    "http://localhost:3000";

  const userName = profile?.name || "User";
  const subject = `[TEST] Last Message from ${userName} (Still Alive?)`;
  const body =
    `This is a TEST email preview of your “Silly Last Words”.\n\n` +
    `Delivery threshold (configured): ${row?.deliveryThreshold ?? 48} hours\n` +
    `Dashboard: ${baseUrl}/dashboard\n\n` +
    `Your message:\n\n${clamp500(message)}\n\n` +
    `— Sent automatically by Still Alive? (test mode)\n`;

  const results = await Promise.all(
    contacts.map(async (c) => {
      const res = await sendEmail(c.email, subject, body);
      return { id: c.id, email: c.email, ok: res.ok, error: res.ok ? null : res.error };
    }),
  );

  const sent = results.filter((r) => r.ok).length;
  const failed = results.length - sent;

  return Response.json({ ok: true, sent, failed, results });
}
