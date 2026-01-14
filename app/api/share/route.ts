import crypto from "node:crypto";
import { getPrisma } from "@/lib/prisma";
import { createShareToken } from "@/lib/share-token";
import { createClient } from "@/lib/supabase/server";

const BADGES = [
  { threshold: 7, name: "Tenacious Vitality" },
  { threshold: 30, name: "Survival Master" },
  { threshold: 100, name: "Human Lifer" },
] as const;

function toPublicId(userId: string) {
  return crypto.createHash("sha256").update(userId).digest("hex").slice(0, 8).toUpperCase();
}

function badgeForStreak(streak: number) {
  if (streak >= 100) return BADGES[2].name;
  if (streak >= 30) return BADGES[1].name;
  if (streak >= 7) return BADGES[0].name;
  return "Rookie Survivor";
}

export async function POST(req: Request) {
  const supabase = await createClient();
  if (!supabase) {
    return Response.json({ error: "Auth is not configured." }, { status: 500 });
  }
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const prisma = getPrisma();
  const last = await prisma.checkIn.findFirst({
    where: { userId: user.id },
    orderBy: { checkInTime: "desc" },
    select: { checkInTime: true, streakCount: true },
  });

  if (!last) {
    return Response.json({ error: "No check-ins yet." }, { status: 400 });
  }

  const now = new Date();
  const isInactive = now.getTime() - last.checkInTime.getTime() > 1000 * 60 * 60 * 24;
  const currentStreak = isInactive ? 0 : last.streakCount;

  const body = (await req.json().catch(() => null)) as { badge?: string } | null;
  const requested = typeof body?.badge === "string" ? body.badge : null;
  const requestedBadge = requested
    ? BADGES.find((b) => b.name === requested && currentStreak >= b.threshold)
    : null;
  const badge = requestedBadge?.name ?? badgeForStreak(currentStreak);

  const token = createShareToken({
    pid: toPublicId(user.id),
    streak: currentStreak,
    badge,
    ts: Date.now(),
    lastCheckInIso: last.checkInTime.toISOString(),
  });

  if (!token) {
    return Response.json(
      { error: "Share is not configured. Missing SHARE_TOKEN_SECRET." },
      { status: 500 },
    );
  }

  const text = `Still Alive? 连续 ${currentStreak} 天仍存活（${badge}）。来一起签到：`;

  return Response.json({ token, text });
}
