import { createBrowserClient } from "@supabase/ssr";
import { getSupabaseConfig } from "@/lib/supabase/env";

export function createClient() {
  const cfg = getSupabaseConfig();
  if (!cfg) return null;
  return createBrowserClient(cfg.url, cfg.anonKey);
}
