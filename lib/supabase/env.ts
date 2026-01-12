export function getSupabaseConfig() {
  // IMPORTANT: Keep access static (process.env.FOO), so Next.js can inline
  // NEXT_PUBLIC_* values into the client bundle. Avoid process.env[name].
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
  const anonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.SUPABASE_ANON_KEY;
  if (!url || !anonKey) return null;
  return { url, anonKey };
}
