import type { User } from "@supabase/supabase-js";

export function userToProfile(user: User) {
  const name =
    (user.user_metadata &&
      typeof user.user_metadata === "object" &&
      typeof (user.user_metadata as { full_name?: unknown }).full_name === "string" &&
      (user.user_metadata as { full_name?: string }).full_name) ||
    null;

  return {
    id: user.id,
    email: user.email ?? "",
    name,
  };
}

