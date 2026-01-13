import DashboardClient from "@/components/dashboard-client";
import { getPrisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const supabase = await createClient();
  if (!supabase) redirect("/?reason=auth_not_configured");
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/?reason=session_expired");

  const userId = user.id;

  const prisma = getPrisma();
  const recent = await prisma.checkIn.findMany({
    where: { userId },
    orderBy: { checkInTime: "desc" },
    take: 3,
    select: { id: true, checkInTime: true, streakCount: true },
  });

  const last = recent[0];
  const now = new Date();
  const isInactive =
    last && now.getTime() - last.checkInTime.getTime() > 1000 * 60 * 60 * 24;

  const currentStreak = last ? (isInactive ? 0 : last.streakCount) : 0;

  return (
    <DashboardClient
      initialStreak={currentStreak}
      initialRecent={recent.map((r) => ({
        id: r.id,
        checkInTime: r.checkInTime.toISOString(),
        streakCount: r.streakCount,
      }))}
    />
  );
}
