"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

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
            给 StillALIVE 玩家：每天 1 秒签到，记录连击、冲榜、生成可分享的“仍存活”证明。
          </p>
          <p className="mt-2 text-sm text-[color:var(--sa-muted-2)]">
            不想登录也没关系：先看看{" "}
            <Link href="/leaderboard" className="sa-link">
              排行榜
            </Link>
            {" / "}
            <Link href="/demo" className="sa-link">
              示例个人页
            </Link>
            。
          </p>

          <div className="mt-5 flex w-full flex-col items-stretch gap-2 sm:flex-row sm:justify-center">
            <Link href="/leaderboard" className="sa-btn sa-btn-soft sm:min-w-40">
              查看排行榜
            </Link>
            <Link href="/demo" className="sa-btn sa-btn-soft sm:min-w-40">
              查看示例个人页
            </Link>
          </div>

          {props.children}

          <footer className="mt-10 text-xs text-[color:var(--sa-muted-2)]">
            只保存最少数据：Google 登录 + 你的设置。Minimal data, maximum drama.
          </footer>
        </div>
      </main>
    </div>
  );
}
