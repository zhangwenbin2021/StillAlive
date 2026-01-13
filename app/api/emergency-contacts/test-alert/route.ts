import { sendEmail } from "@/lib/notify";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";

const ALLOWED_THRESHOLDS = new Set([12, 24, 36, 48]);

function fmtDateTimeClean(date: Date) {
  const datePart = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  }).format(date);
  const timePart = new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(date);
  return `${datePart} - ${timePart}`;
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
    select: { name: true, email: true },
  });

  const settings = await prisma.userSettings.findUnique({
    where: { userId },
    select: { miaThresholdHrs: true },
  });
  const threshold = ALLOWED_THRESHOLDS.has(settings?.miaThresholdHrs ?? 24)
    ? (settings?.miaThresholdHrs ?? 24)
    : 24;

  const last = await prisma.checkIn.findFirst({
    where: { userId },
    orderBy: { checkInTime: "desc" },
    select: { checkInTime: true },
  });

  const baseUrl =
    process.env.APP_BASE_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    "http://localhost:3000";

  const contacts = await prisma.emergencyContact.findMany({
    where: { userId },
    orderBy: { createdAt: "asc" },
    take: 3,
    select: { id: true, name: true, email: true },
  });
  if (contacts.length === 0) {
    return Response.json({ error: "No emergency contacts to notify." }, { status: 400 });
  }

  const userName = profile?.name || "Your friend";
  const subject = `[TEST] [Still Alive?] Emergency Alert: ${userName} may be MIA`;
  const lastCheckInText = last?.checkInTime ? fmtDateTimeClean(last.checkInTime) : "N/A";
  const emergencyBody =
    `This is a TEST email sent by ${userName} via Still Alive?.\n\n` +
    `Configured MIA threshold: ${threshold} hours\n` +
    `Last check-in: ${lastCheckInText}\n\n` +
    `Dashboard: ${baseUrl}/dashboard\n\n` +
    `If this were real, you'd be receiving this because ${userName} hasn't checked in for ${threshold} hours.\n`;

  const results = await Promise.all(
    contacts.map(async (c) => {
      const res = await sendEmail(c.email, subject, emergencyBody);
      return { id: c.id, email: c.email, ok: res.ok, error: res.ok ? null : res.error };
    }),
  );

  const sent = results.filter((r) => r.ok).length;
  const failed = results.length - sent;

  return Response.json({ ok: true, sent, failed, results });
}
