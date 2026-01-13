"use client";

import { useEffect, useRef, useState } from "react";

function Toast(props: { message: string }) {
  return (
    <div className="fixed inset-x-0 top-4 z-50 flex justify-center px-4">
      <div className="sa-toast w-full max-w-md p-4 text-sm">{props.message}</div>
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
      setToast(
        "Logged out successfully. Come back tomorrow and press the big orange button, human.",
      );
    } else if (props.reason === "session_expired") {
      setToast("Your session expired. Log in again so we can keep you on the living roster.");
    } else if (props.reason === "auth_not_configured") {
      setToast("Auth is not configured. Add Supabase env vars to enable login.");
    } else {
      setToast(null);
      return;
    }

    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setToast(null), 4500);
  }, [props.loggedOut, props.reason]);

  return (
    <div className="sa-page">
      {toast ? <Toast message={toast} /> : null}
      <main className="mx-auto flex w-full max-w-[720px] flex-col items-center text-center">
        <div className="sa-card w-full p-10 sm:p-12">
          <h1 className="text-3xl font-extrabold tracking-tight text-[color:var(--sa-accent)] sm:text-5xl">
            Still Alive?
          </h1>
          <p className="mt-3 text-base text-[color:var(--sa-muted)] sm:text-lg">
            Prove you&apos;re not MIA in 1 second a day.
          </p>
          <p className="mt-2 text-sm text-[color:var(--sa-muted-2)]">
            Daily ritual: press button &rarr; remain officially &quot;alive&quot; &rarr; return to your nonsense.
          </p>

          {props.children}

          <footer className="mt-10 text-xs text-[color:var(--sa-muted-2)]">
            Minimal data, maximum drama. (Google auth + your settings.)
          </footer>
        </div>
      </main>
    </div>
  );
}
