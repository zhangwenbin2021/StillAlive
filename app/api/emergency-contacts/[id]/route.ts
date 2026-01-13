import { getPrisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { userToProfile } from "@/lib/supabase/user";
import { upsertUserProfile } from "@/lib/user-profile";

function isValidEmail(email: string) {
  if (email.length > 320) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

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

  const prisma = getPrisma();
  const id = ctx.params.id;
  const body = (await req.json().catch(() => null)) as
    | { name?: unknown; email?: unknown }
    | null;

  const name = typeof body?.name === "string" ? body.name.trim() : "";
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";

  if (!name || !email || !isValidEmail(email)) {
    return Response.json(
      { error: "Please enter a valid email address." },
      { status: 400 },
    );
  }

  const current = await prisma.emergencyContact.findFirst({
    where: { id, userId },
    select: { id: true, email: true },
  });
  if (!current) return Response.json({ error: "Not found" }, { status: 404 });

  const emailChanged = current.email !== email;
  if (emailChanged) {
    const dup = await prisma.emergencyContact.findUnique({
      where: { userId_email: { userId, email } },
      select: { id: true },
    });
    if (dup) {
      return Response.json(
        { error: "This email address is already added." },
        { status: 409 },
      );
    }
  }

  const updated = await prisma.emergencyContact.update({
    where: { id },
    data: {
      name,
      email,
    },
    select: { id: true, name: true, email: true },
  });

  return Response.json({ contact: updated });
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

  const prisma = getPrisma();
  const id = ctx.params.id;
  const existing = await prisma.emergencyContact.findFirst({
    where: { id, userId },
    select: { id: true },
  });
  if (!existing) return Response.json({ error: "Not found" }, { status: 404 });

  await prisma.emergencyContact.delete({ where: { id } });
  return Response.json({ ok: true });
}
