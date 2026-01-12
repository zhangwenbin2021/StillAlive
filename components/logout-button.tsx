"use client";

import { createClient } from "@/lib/supabase/client";
import { useState } from "react";

export default function LogoutButton() {
  const [isLoading, setIsLoading] = useState(false);

  async function onClick() {
    if (isLoading) return;
    setIsLoading(true);
    try {
      const supabase = createClient();
      if (!supabase) {
        window.location.href = "/?logged_out=1";
        return;
      }
      await supabase.auth.signOut();
      window.location.href = "/?logged_out=1";
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={isLoading}
      className="text-sm font-medium text-orange-500 hover:underline disabled:opacity-60"
    >
      {isLoading ? "Logging out..." : "Logout"}
    </button>
  );
}
