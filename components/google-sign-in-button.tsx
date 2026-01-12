"use client";

import { createClient } from "@/lib/supabase/client";
import { useState } from "react";

function Spinner() {
  return (
    <svg
      aria-hidden="true"
      className="h-5 w-5 animate-spin text-gray-700"
      viewBox="0 0 24 24"
      fill="none"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
      />
    </svg>
  );
}

function GoogleIcon() {
  return (
    <svg aria-hidden="true" className="h-5 w-5" viewBox="0 0 48 48">
      <path
        fill="#FFC107"
        d="M43.611 20.083H42V20H24v8h11.303C33.657 32.657 29.2 36 24 36c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.047 6.053 29.239 4 24 4 12.954 4 4 12.954 4 24s8.954 20 20 20 20-8.954 20-20c0-1.341-.138-2.65-.389-3.917z"
      />
      <path
        fill="#FF3D00"
        d="M6.306 14.691l6.571 4.819C14.655 16.108 19.005 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.047 6.053 29.239 4 24 4 16.318 4 9.656 8.338 6.306 14.691z"
      />
      <path
        fill="#4CAF50"
        d="M24 44c5.097 0 9.825-1.949 13.363-5.121l-6.174-5.226C29.143 35.5 26.72 36 24 36c-5.179 0-9.625-3.318-11.283-7.946l-6.522 5.026C9.505 39.556 16.227 44 24 44z"
      />
      <path
        fill="#1976D2"
        d="M43.611 20.083H42V20H24v8h11.303a11.98 11.98 0 01-4.114 5.653l.003-.002 6.174 5.226C36.93 39.29 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"
      />
    </svg>
  );
}

export default function GoogleSignInButton() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onClick() {
    if (isLoading) return;
    setIsLoading(true);
    setError(null);
    try {
      const supabase = createClient();
      if (!supabase) {
        setError(
          "Supabase auth is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY, then restart the dev server.",
        );
        return;
      }
      const redirectTo = `${window.location.origin}/auth/callback?next=/dashboard`;
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo },
      });
      if (error) throw error;
    } catch {
      setError("Login failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <button
        type="button"
        onClick={onClick}
        disabled={isLoading}
        className="group relative flex h-12 w-64 items-center justify-center rounded-md border border-gray-200 bg-white px-4 text-sm font-medium text-black shadow-sm transition-shadow hover:shadow-md disabled:cursor-not-allowed disabled:opacity-70"
      >
        <span className="absolute left-4 flex items-center">
          {isLoading ? <Spinner /> : <GoogleIcon />}
        </span>
        <span>{isLoading ? "Signing in..." : "Continue with Google"}</span>
      </button>
      {error ? <div className="max-w-sm text-center text-sm text-red-600">{error}</div> : null}
    </div>
  );
}
