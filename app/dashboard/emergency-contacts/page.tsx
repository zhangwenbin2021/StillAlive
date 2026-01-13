import EmergencyContactsClient from "@/components/emergency-contacts-client";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function EmergencyContactsPage() {
  const supabase = await createClient();
  if (!supabase) redirect("/?reason=auth_not_configured");
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/?reason=session_expired");

  const userId = user.id;

  const contacts = await prisma.emergencyContact.findMany({
    where: { userId },
    orderBy: { createdAt: "asc" },
    take: 3,
    select: {
      id: true,
      name: true,
      email: true,
    },
  });

  const settings = await prisma.userSettings.findUnique({
    where: { userId },
    select: { miaThresholdHrs: true },
  });

  return (
    <EmergencyContactsClient
      initialContacts={contacts}
      initialThreshold={settings?.miaThresholdHrs ?? 24}
    />
  );
}
