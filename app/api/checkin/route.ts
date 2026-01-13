import { getPrisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { userToProfile } from "@/lib/supabase/user";
import { upsertUserProfile } from "@/lib/user-profile";

function isSameUtcDay(a: Date, b: Date) {
  return (
    a.getUTCFullYear() === b.getUTCFullYear() &&
    a.getUTCMonth() === b.getUTCMonth() &&
    a.getUTCDate() === b.getUTCDate()
  );
}

export async function POST() {
  const supabase = await createClient();
  if (!supabase) {
    return Response.json({ error: "Auth is not configured." }, { status: 500 });
  }
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const userId = user.id;
  await upsertUserProfile(userToProfile(user));

  const prisma = getPrisma();
  const now = new Date();

  const last = await prisma.checkIn.findFirst({
    where: { userId },
    orderBy: { checkInTime: "desc" },
  });

  if (last && now.getTime() - last.checkInTime.getTime() < 1000 * 60 * 60) {
    return Response.json(
      { error: "You already checked in within the last hour. Try again later." },
      { status: 429 },
    );
  }

  let newStreak = 1;
  if (last) {
    const msSinceLast = now.getTime() - last.checkInTime.getTime();
    const isInactive = msSinceLast > 1000 * 60 * 60 * 24;

    if (isInactive) newStreak = 1;
    else if (isSameUtcDay(last.checkInTime, now)) newStreak = last.streakCount;
    else newStreak = last.streakCount + 1;
  }

  const checkIn = await prisma.checkIn.create({
    data: {
      userId,
      checkInTime: now,
      streakCount: newStreak,
    },
    select: { id: true, checkInTime: true, streakCount: true },
  });

  const recent = await prisma.checkIn.findMany({
    where: { userId },
    orderBy: { checkInTime: "desc" },
    take: 3,
    select: { id: true, checkInTime: true, streakCount: true },
  });

  return Response.json({
    checkIn: {
      id: checkIn.id,
      checkInTime: checkIn.checkInTime.toISOString(),
      streakCount: checkIn.streakCount,
    },
    currentStreak: newStreak,
    recent: recent.map((r) => ({
      id: r.id,
      checkInTime: r.checkInTime.toISOString(),
      streakCount: r.streakCount,
    })),
  });
}
