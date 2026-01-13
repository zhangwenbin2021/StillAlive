import LastWordsClient from "@/components/last-words-client";
import { getPrisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function LastWordsPage() {
  const supabase = await createClient();
  if (!supabase) redirect("/?reason=auth_not_configured");
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/?reason=session_expired");

  const userId = user.id;
  const prisma = getPrisma();
  const row = await prisma.lastWords.findUnique({
    where: { userId },
    select: { message: true, deliveryThreshold: true },
  });

  const message = row?.message ?? "";

  return (
    <LastWordsClient
      initialMessage={message}
      initialThreshold={row?.deliveryThreshold ?? 48}
    />
  );
}
