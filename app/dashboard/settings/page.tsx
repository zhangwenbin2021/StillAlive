import SettingsClient from "@/components/settings-client";
import { getPrisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function SettingsPage() {
  const supabase = await createClient();
  if (!supabase) redirect("/?reason=auth_not_configured");
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/?reason=session_expired");

  const userId = user.id;
  const prisma = getPrisma();
  const settings = await prisma.userSettings.findUnique({
    where: { userId },
    select: {
      miaThresholdHrs: true,
      emergencyModeEnabled: true,
      emergencyModeEndTime: true,
      emergencyModeMultiplier: true,
    },
  });

  return (
    <SettingsClient
      miaThresholdHrs={settings?.miaThresholdHrs ?? 24}
      emergencyModeEnabled={settings?.emergencyModeEnabled ?? false}
      emergencyModeEndTime={settings?.emergencyModeEndTime?.toISOString() ?? null}
      emergencyModeMultiplier={settings?.emergencyModeMultiplier ?? 2}
    />
  );
}
