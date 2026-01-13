import { getPrisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { userToProfile } from "@/lib/supabase/user";
import { upsertUserProfile } from "@/lib/user-profile";

function isValidEmail(email: string) {
  if (email.length > 320) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

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

  const prisma = getPrisma();
  const contacts = await prisma.emergencyContact.findMany({
    where: { userId },
    orderBy: { createdAt: "asc" },
    take: 3,
    select: { id: true, name: true, email: true },
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

  const prisma = getPrisma();
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

  const count = await prisma.emergencyContact.count({ where: { userId } });
  if (count >= 3) {
    return Response.json(
      { error: "You can only add up to 3 emergency contacts." },
      { status: 400 },
    );
  }

  const existing = await prisma.emergencyContact.findUnique({
    where: { userId_email: { userId, email } },
    select: { id: true },
  });
  if (existing) {
    return Response.json(
      { error: "This email address is already added." },
      { status: 409 },
    );
  }

  const contact = await prisma.emergencyContact.create({
    data: {
      userId,
      name,
      email,
    },
    select: { id: true, name: true, email: true },
  });

  return Response.json({ contact });
}
