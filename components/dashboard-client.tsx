"use client";

import LogoutButton from "@/components/logout-button";
import dynamic from "next/dynamic";
import { formatCheckInTime } from "@/lib/format";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

type RecentCheckIn = {
  id: string;
  checkInTime: string;
  streakCount: number;
};

const BUTTON_TEXTS = [
  "I'm Alive!",
  "Not Dead Yet!",
  "Don't call 911 - I'm just lazy.",
  "Still breathing. Allegedly.",
  "Survived another day of nonsense.",
  "Alive-ish. Good enough.",
] as const;

const SUCCESS_TEXTS = [
  (part: string) => `Nice. You survived this ${part}.`,
  () => "Check-in successful. Funeral plans: canceled (for now).",
  () => "Status: alive. Drama level: reduced.",
  () => "Survival KPI completed. Reward: dopamine.",
] as const;

const BADGES = [
  {
    threshold: 7,
    name: "Tenacious Vitality",
    color: "text-green-700",
    bg: "bg-green-100",
    icon: LeafIcon,
  },
  {
    threshold: 30,
    name: "Survival Master",
    color: "text-yellow-800",
    bg: "bg-yellow-100",
    icon: CrownIcon,
  },
  {
    threshold: 100,
    name: "Human Lifer",
    color: "text-slate-900",
    bg: "bg-slate-200",
    icon: NailIcon,
  },
] as const;

function dayPart() {
  const h = new Date().getHours();
  if (h < 12) return "morning";
  if (h < 18) return "afternoon";
  return "evening";
}

function randomFrom<T>(arr: readonly T[]) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function ShareIcon(props: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={props.className}
    >
      <path d="M4 12v7a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-7" />
      <path d="M12 3v13" />
      <path d="M7 8l5-5 5 5" />
    </svg>
  );
}

function LeafIcon(props: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={props.className}
    >
      <path d="M11 20A7 7 0 0 1 4 13C4 7 12 3 20 4c-1 8-5 16-9 16Z" />
      <path d="M12 20c0-6 4-10 8-12" />
    </svg>
  );
}

function CrownIcon(props: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={props.className}
    >
      <path d="M3 7l4 5 5-6 5 6 4-5v11H3V7Z" />
      <path d="M3 18h18" />
    </svg>
  );
}

function NailIcon(props: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={props.className}
    >
      <path d="M9 3h6" />
      <path d="M10 3v7a2 2 0 0 0 4 0V3" />
      <path d="M12 10v11" />
      <path d="M9 21h6" />
    </svg>
  );
}

function ParticleBurst(props: { burstKey: number }) {
  const particles = useMemo(() => {
    void props.burstKey;
    const colors = ["#f97316", "#fb7185", "#22c55e", "#3b82f6", "#eab308"];
    return Array.from({ length: 18 }).map((_, i) => {
      const angle = Math.random() * Math.PI * 2;
      const distance = 48 + Math.random() * 52;
      const x = Math.cos(angle) * distance;
      const y = Math.sin(angle) * distance;
      const color = colors[i % colors.length];
      const size = 4 + Math.random() * 4;
      return { x, y, color, size };
    });
  }, [props.burstKey]);

  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0">
      {particles.map((p, idx) => (
        <span
          // eslint-disable-next-line react/no-array-index-key
          key={idx}
          className="sa-particle"
          style={
            {
              "--sa-x": `${p.x}px`,
              "--sa-y": `${p.y}px`,
              "--sa-color": p.color,
              width: `${p.size}px`,
              height: `${p.size}px`,
            } as React.CSSProperties
          }
        />
      ))}
    </div>
  );
}

async function postCheckIn() {
  const res = await fetch("/api/checkin", { method: "POST" });
  if (!res.ok) {
    const data = (await res.json().catch(() => null)) as { error?: string } | null;
    throw new Error(data?.error || "Check-in failed");
  }
  return (await res.json()) as { currentStreak: number; recent: RecentCheckIn[] };
}

function buildShareText(streak: number, badgeName: string) {
  return `I've checked in for ${streak} consecutive days on Still Alive? and earned the ${badgeName} title. Join me so your friends don't file a missing-person report.`;
}

function ShareStreakButton(props: { streak: number; badgeName: string }) {
  const [isSharing, setIsSharing] = useState(false);

  async function onShare() {
    if (isSharing) return;
    setIsSharing(true);
    try {
      const text = buildShareText(props.streak, props.badgeName);
      const url = window.location.origin;

      if (navigator.share) {
        await navigator.share({ text, url, title: "Still Alive?" });
        return;
      }

      const intent = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
        text,
      )}&url=${encodeURIComponent(url)}`;
      window.open(intent, "_blank", "noopener,noreferrer");
    } finally {
      setIsSharing(false);
    }
  }

  return (
    <button type="button" onClick={onShare} className="sa-btn sa-btn-soft inline-flex items-center gap-2">
      <ShareIcon className="h-4 w-4" />
      <span>{isSharing ? "Sharing..." : "Share Streak"}</span>
    </button>
  );
}

export default function DashboardClient(props: {
  initialStreak: number;
  initialRecent: RecentCheckIn[];
}) {
  const [currentStreak, setCurrentStreak] = useState(props.initialStreak);
  const [recent, setRecent] = useState<RecentCheckIn[]>(props.initialRecent);
  const [isCheckingIn, setIsCheckingIn] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [burstKey, setBurstKey] = useState<number>(0);
  const toastTimer = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (toastTimer.current) window.clearTimeout(toastTimer.current);
    };
  }, []);

  const [buttonText, setButtonText] = useState<(typeof BUTTON_TEXTS)[number]>(BUTTON_TEXTS[0]);
  useEffect(() => {
    setButtonText(randomFrom(BUTTON_TEXTS));
  }, []);

  async function onCheckIn() {
    if (isCheckingIn) return;
    setIsCheckingIn(true);

    if (navigator.vibrate) navigator.vibrate(200);
    setBurstKey((k) => k + 1);

    const successMessage = randomFrom(SUCCESS_TEXTS)(dayPart());
    setToast(successMessage);
    if (toastTimer.current) window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(null), 3200);

    try {
      const data = await postCheckIn();
      setCurrentStreak(data.currentStreak);
      setRecent(data.recent);
      setButtonText(randomFrom(BUTTON_TEXTS));
    } catch (e) {
      setToast(e instanceof Error ? e.message : "Check-in failed");
      if (toastTimer.current) window.clearTimeout(toastTimer.current);
      toastTimer.current = window.setTimeout(() => setToast(null), 3500);
    } finally {
      setIsCheckingIn(false);
    }
  }

  const unlockedBadges = BADGES.map((b) => ({ ...b, unlocked: currentStreak >= b.threshold }));

  return (
    <div className="sa-page">
      <WelcomePopup />

      {toast ? (
        <div className="fixed inset-x-0 top-4 z-40 flex justify-center px-4">
          <div className="sa-toast w-full max-w-md p-4 text-sm">{toast}</div>
        </div>
      ) : null}

      <div className="mx-auto flex w-full max-w-4xl flex-col gap-8">
        <header className="sa-card px-5 py-4 sm:px-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-lg font-semibold text-[color:var(--sa-fg)] sm:text-2xl">
                Survival Check-In
              </h1>
              <p className="mt-1 text-sm text-[color:var(--sa-muted)]">
                Press the button. Reduce chaos. Continue being alive.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Link href="/dashboard/emergency-contacts" className="sa-btn sa-btn-soft">
                Emergency Contacts
              </Link>
              <Link href="/dashboard/last-words" className="sa-btn sa-btn-soft">
                Silly Last Words
              </Link>
              <Link href="/dashboard/settings" className="sa-btn sa-btn-soft">
                Settings
              </Link>
              <LogoutButton />
            </div>
          </div>
        </header>

        <main className="flex flex-col items-center gap-8">
          <div className="relative">
            <button
              type="button"
              onClick={onCheckIn}
              disabled={isCheckingIn}
              className="relative aspect-square w-[56vw] min-w-52 max-w-72 rounded-full border-[6px] border-orange-500/70 bg-gradient-to-b from-orange-400 to-orange-600 px-6 text-base font-extrabold text-white shadow-[0_18px_45px_rgba(15,23,42,0.16)] transition-transform hover:scale-[1.03] disabled:cursor-not-allowed disabled:opacity-80 sm:w-[320px]"
            >
              <span className="relative z-10">{isCheckingIn ? "Checking in..." : buttonText}</span>
              <span className="relative z-10 mt-2 block text-xs font-semibold text-white/90">
                (tap to calm the group chat)
              </span>
              {burstKey > 0 ? <ParticleBurst burstKey={burstKey} /> : null}
            </button>
          </div>

          <section className="sa-card w-full p-6">
            <h2 className="text-base font-semibold text-[color:var(--sa-fg)] sm:text-lg">
              Recent Check-Ins
            </h2>
            <ul className="mt-3 space-y-2 text-[color:var(--sa-muted)]">
              {recent.length === 0 ? (
                <li className="text-sm text-[color:var(--sa-muted-2)]">No check-ins yet. Bold.</li>
              ) : (
                recent.map((r) => (
                  <li key={r.id} className="text-sm">
                    {formatCheckInTime(r.checkInTime)}
                  </li>
                ))
              )}
            </ul>
          </section>

          <section className="sa-card w-full p-6">
            <h2 className="text-base font-semibold text-[color:var(--sa-fg)] sm:text-lg">
              Survival Streak
            </h2>
            <div className="mt-2 text-lg font-extrabold text-[color:var(--sa-accent)] sm:text-xl">
              Current Streak: {currentStreak} Days
            </div>

            <div className="mt-4 space-y-2">
              {unlockedBadges.map((b) => {
                const Icon = b.icon;
                return (
                  <div
                    key={b.name}
                    className={`flex items-center justify-between rounded-xl px-2 py-2 ${
                      b.unlocked ? "" : "opacity-40"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`flex h-9 w-9 items-center justify-center rounded-full ${
                          b.unlocked ? b.bg : "bg-white/60"
                        }`}
                      >
                        <Icon className={`h-4 w-4 ${b.unlocked ? b.color : "text-slate-400"}`} />
                      </div>
                      <div className="text-sm font-semibold text-[color:var(--sa-fg)]">{b.name}</div>
                    </div>

                    {b.unlocked ? (
                      <ShareStreakButton streak={currentStreak} badgeName={b.name} />
                    ) : (
                      <div className="text-xs text-[color:var(--sa-muted-2)]">
                        Unlock at {b.threshold} days
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}

const WelcomePopup = dynamic(() => import("@/components/welcome-popup"), {
  ssr: false,
});
