import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { userToProfile } from "@/lib/supabase/user";
import { upsertUserProfile } from "@/lib/user-profile";

const MULTIPLIERS = new Set([2, 3, 4]);

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

  const settings = await prisma.userSettings.findUnique({
    where: { userId },
    select: {
      miaThresholdHrs: true,
      emergencyModeEnabled: true,
      emergencyModeEndTime: true,
      emergencyModeMultiplier: true,
    },
  });

  return Response.json({
    miaThresholdHrs: settings?.miaThresholdHrs ?? 24,
    emergencyModeEnabled: settings?.emergencyModeEnabled ?? false,
    emergencyModeEndTime: settings?.emergencyModeEndTime?.toISOString() ?? null,
    emergencyModeMultiplier: settings?.emergencyModeMultiplier ?? 2,
  });
}

export async function PUT(req: Request) {
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
    | { enabled?: unknown; multiplier?: unknown }
    | null;

  const enabled = typeof body?.enabled === "boolean" ? body.enabled : false;
  const multiplier = typeof body?.multiplier === "number" ? body.multiplier : 2;

  if (enabled && !MULTIPLIERS.has(multiplier)) {
    return Response.json({ error: "Invalid multiplier" }, { status: 400 });
  }

  const base = await prisma.userSettings.upsert({
    where: { userId },
    create: { userId },
    update: {},
    select: { miaThresholdHrs: true },
  });

  const miaThresholdHrs = base.miaThresholdHrs ?? 24;
  const endTime = enabled
    ? new Date(Date.now() + miaThresholdHrs * multiplier * 60 * 60 * 1000)
    : null;

  const settings = await prisma.userSettings.update({
    where: { userId },
    data: {
      emergencyModeEnabled: enabled,
      emergencyModeEndTime: endTime,
      emergencyModeMultiplier: enabled ? multiplier : 2,
    },
    select: {
      miaThresholdHrs: true,
      emergencyModeEnabled: true,
      emergencyModeEndTime: true,
      emergencyModeMultiplier: true,
    },
  });

  return Response.json({
    miaThresholdHrs: settings.miaThresholdHrs,
    emergencyModeEnabled: settings.emergencyModeEnabled,
    emergencyModeEndTime: settings.emergencyModeEndTime?.toISOString() ?? null,
    emergencyModeMultiplier: settings.emergencyModeMultiplier,
  });
}
