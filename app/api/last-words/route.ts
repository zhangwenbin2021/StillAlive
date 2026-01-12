import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { userToProfile } from "@/lib/supabase/user";
import { upsertUserProfile } from "@/lib/user-profile";

const THRESHOLDS = new Set([36, 48, 72]);

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

  const row = await prisma.lastWords.findUnique({
    where: { userId },
    select: { message: true, deliveryThreshold: true },
  });

  const message: string | null = row?.message ?? null;

  return Response.json({
    message,
    deliveryThreshold: row?.deliveryThreshold ?? 48,
  });
}

export async function PUT(req: Request) {
  try {
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
      | { message?: unknown; deliveryThreshold?: unknown }
      | null;

    const message = typeof body?.message === "string" ? body.message : null;
    const deliveryThreshold =
      typeof body?.deliveryThreshold === "number" ? body.deliveryThreshold : null;

    if (message !== null && message.length > 500) {
      return Response.json(
        { error: "Max length is 500 characters" },
        { status: 400 },
      );
    }
    if (deliveryThreshold !== null && !THRESHOLDS.has(deliveryThreshold)) {
      return Response.json({ error: "Invalid threshold" }, { status: 400 });
    }

    const updated = await prisma.lastWords.upsert({
      where: { userId },
      create: {
        userId,
        message,
        deliveryThreshold: deliveryThreshold ?? 48,
      },
      update: {
        ...(message === null ? {} : { message }),
        ...(deliveryThreshold === null ? {} : { deliveryThreshold }),
      },
      select: { deliveryThreshold: true },
    });

    return Response.json({
      ok: true,
      deliveryThreshold: updated.deliveryThreshold,
    });
  } catch (err) {
    const msg =
      err instanceof Error
        ? err.message
        : "Failed to save last words. Please try again later.";
    return Response.json({ error: msg }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    const supabase = await createClient();
    if (!supabase) {
      return Response.json({ error: "Auth is not configured." }, { status: 500 });
    }
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const userId = user?.id;
    if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

    await prisma.lastWords.upsert({
      where: { userId },
      create: { userId, message: null, deliveryThreshold: 48 },
      update: { message: null },
    });

    return Response.json({ ok: true });
  } catch (err) {
    const msg =
      err instanceof Error
        ? err.message
        : "Failed to delete last words. Please try again later.";
    return Response.json({ error: msg }, { status: 500 });
  }
}
