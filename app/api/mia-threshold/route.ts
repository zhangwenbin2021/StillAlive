import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { userToProfile } from "@/lib/supabase/user";
import { upsertUserProfile } from "@/lib/user-profile";

const ALLOWED = new Set([12, 24, 36, 48]);

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
    select: { miaThresholdHrs: true },
  });

  return Response.json({ miaThresholdHrs: settings?.miaThresholdHrs ?? 24 });
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
    | { miaThresholdHrs?: unknown }
    | null;

  const value = typeof body?.miaThresholdHrs === "number" ? body.miaThresholdHrs : 24;
  if (!ALLOWED.has(value)) {
    return Response.json({ error: "Invalid threshold" }, { status: 400 });
  }

  const settings = await prisma.userSettings.upsert({
    where: { userId },
    create: { userId, miaThresholdHrs: value },
    update: { miaThresholdHrs: value },
    select: { miaThresholdHrs: true },
  });

  return Response.json({ miaThresholdHrs: settings.miaThresholdHrs });
}
