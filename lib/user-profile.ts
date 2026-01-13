import { getPrisma } from "@/lib/prisma";

export async function upsertUserProfile(user: {
  id: string;
  email: string;
  name: string | null;
}) {
  if (!user.id || !user.email) return;

  const prisma = getPrisma();
  await prisma.userProfile.upsert({
    where: { userId: user.id },
    create: {
      userId: user.id,
      email: user.email,
      name: user.name ?? null,
    },
    update: {
      email: user.email,
      name: user.name ?? null,
    },
  });
}
