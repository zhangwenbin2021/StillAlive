"use client";

import { useEffect, useRef, useState } from "react";

function Toast(props: { message: string }) {
  return (
    <div className="fixed inset-x-0 top-4 z-50 flex justify-center px-4">
      <div className="w-full max-w-md rounded-lg bg-white p-4 text-sm text-gray-900 shadow-md ring-1 ring-black/5">
        {props.message}
      </div>
    </div>
  );
}

export default function LoginPageClient(props: {
  reason: string | null;
  loggedOut: boolean;
  children: React.ReactNode;
}) {
  const [toast, setToast] = useState<string | null>(null);
  const timer = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timer.current) window.clearTimeout(timer.current);
    };
  }, []);

  useEffect(() => {
    if (props.loggedOut) {
      setToast("Logged out successfully! Don’t forget to check in tomorrow～");
    } else if (props.reason === "session_expired") {
      setToast("Your session expired! Please log in again to check in.");
    } else if (props.reason === "auth_not_configured") {
      setToast("Auth is not configured. Add Supabase env vars to enable login.");
    } else {
      setToast(null);
      return;
    }

    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setToast(null), 4000);
  }, [props.loggedOut, props.reason]);

  return (
    <div className="min-h-screen bg-gray-50 px-6 py-12 text-gray-900">
      {toast ? <Toast message={toast} /> : null}
      <main className="mx-auto flex w-full max-w-[600px] flex-col items-center text-center">
        <h1 className="text-3xl font-bold tracking-tight text-orange-500 sm:text-4xl">
          Still Alive?
        </h1>
        <p className="mt-3 text-base text-gray-600 sm:text-lg">
          Prove you’re not MIA in 1 second a day
        </p>

        {props.children}

        <footer className="mt-12 text-sm text-gray-400">
          No data stored except Google auth info | Built with Next.js + Tailwind CSS
        </footer>
      </main>
    </div>
  );
}
