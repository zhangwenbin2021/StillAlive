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
  "I’m Alive!",
  "Not Dead Yet!",
  "Don’t Call 911—I’m Slacking!",
  "Can Keep Grinding for 500 Years!",
  "Didn’t Let Life Beat Me Today～",
  "Being Alive Is Great—Check In Again!",
] as const;

const SUCCESS_TEXTS = [
  (part: string) => `Yay! You’ve survived this ${part}!`,
  () => "Check-in successful! Loved ones’ peace of mind +10!",
  () => "Congrats! No funeral planning needed (yet)!",
  () => "Survival KPI completed! Reward yourself with a milk tea!",
] as const;

const BADGES = [
  {
    threshold: 7,
    name: "Tenacious Vitality",
    color: "text-green-600",
    bg: "bg-green-100",
    icon: LeafIcon,
  },
  {
    threshold: 30,
    name: "Survival Master",
    color: "text-yellow-700",
    bg: "bg-yellow-100",
    icon: CrownIcon,
  },
  {
    threshold: 100,
    name: "Human Lifer",
    color: "text-gray-900",
    bg: "bg-gray-200",
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
    // Re-generate particles per burst.
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
  return (await res.json()) as {
    currentStreak: number;
    recent: RecentCheckIn[];
  };
}

function buildShareText(streak: number, badgeName: string) {
  return `I’ve checked in for ${streak} consecutive days on Still Alive? and earned the ${badgeName} title! Join me to prove you’re not MIA～`;
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
    <button
      type="button"
      onClick={onShare}
      className="inline-flex items-center gap-2 rounded-md px-2 py-1 text-sm font-medium text-gray-700 hover:bg-gray-100"
    >
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

  // Avoid SSR/client hydration mismatch by choosing random text after hydration.
  const [buttonText, setButtonText] = useState<(typeof BUTTON_TEXTS)[number]>(
    BUTTON_TEXTS[0],
  );

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
    toastTimer.current = window.setTimeout(() => setToast(null), 3000);

    try {
      const data = await postCheckIn();
      setCurrentStreak(data.currentStreak);
      setRecent(data.recent);
    } catch (e) {
      setToast(e instanceof Error ? e.message : "Check-in failed");
      if (toastTimer.current) window.clearTimeout(toastTimer.current);
      toastTimer.current = window.setTimeout(() => setToast(null), 3000);
    } finally {
      setIsCheckingIn(false);
    }
  }

  const unlockedBadges = BADGES.map((b) => ({
    ...b,
    unlocked: currentStreak >= b.threshold,
  }));

  return (
    <div className="min-h-screen bg-gray-50 px-6 py-10 text-gray-900">
      <WelcomePopup />
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-8">
        <header className="flex items-center justify-between">
          <h1 className="text-lg font-semibold text-gray-800 sm:text-2xl">
            Survival Check-In
          </h1>
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard/emergency-contacts"
              className="text-sm text-gray-600 hover:underline"
            >
              Emergency Contacts
            </Link>
            <Link href="/dashboard/last-words" className="text-sm text-gray-600 hover:underline">
              Silly Last Words
            </Link>
            <Link href="/dashboard/settings" className="text-sm text-gray-600 hover:underline">
              Settings
            </Link>
            <LogoutButton />
          </div>
        </header>

        <main className="flex flex-col items-center gap-8">
          <div className="relative">
            <button
              type="button"
              onClick={onCheckIn}
              disabled={isCheckingIn}
              className="relative aspect-square w-[50vw] min-w-48 max-w-64 rounded-full border-4 border-orange-600 bg-[#f97316] px-6 text-base font-semibold text-white shadow-md transition-transform hover:scale-105 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-80 sm:w-[33vw]"
            >
              <span className="relative z-10">
                {isCheckingIn ? "Checking in..." : buttonText}
              </span>
              {burstKey > 0 ? <ParticleBurst burstKey={burstKey} /> : null}
            </button>
          </div>

          {toast ? (
            <div className="w-full max-w-md rounded-lg bg-white p-6 text-center shadow-md ring-1 ring-black/5">
              <div className="text-sm font-medium text-gray-900">{toast}</div>
            </div>
          ) : null}

          <section className="w-full">
            <h2 className="text-base font-medium text-gray-700 sm:text-lg">
              Recent Check-Ins
            </h2>
            <ul className="mt-3 space-y-2 text-gray-600">
              {recent.length === 0 ? (
                <li className="text-sm text-gray-500">No check-ins yet.</li>
              ) : (
                recent.map((r) => (
                  <li key={r.id} className="text-sm">
                    {formatCheckInTime(r.checkInTime)}
                  </li>
                ))
              )}
            </ul>
          </section>

          <section className="w-full">
            <h2 className="text-base font-medium text-gray-700 sm:text-lg">
              Survival Streak
            </h2>
            <div className="mt-2 text-lg font-bold text-orange-500 sm:text-xl">
              Current Streak: {currentStreak} Days
            </div>

            <div className="mt-4 space-y-2">
              {unlockedBadges.map((b) => {
                const Icon = b.icon;
                return (
                  <div
                    key={b.name}
                    className={`flex items-center justify-between rounded-md px-2 py-1 ${
                      b.unlocked ? "" : "opacity-40"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`flex h-8 w-8 items-center justify-center rounded-full ${
                          b.unlocked ? b.bg : "bg-gray-100"
                        }`}
                      >
                        <Icon
                          className={`h-4 w-4 ${
                            b.unlocked ? b.color : "text-gray-400"
                          }`}
                        />
                      </div>
                      <div className="text-sm font-medium text-gray-700">
                        {b.name}
                      </div>
                    </div>

                    {b.unlocked ? (
                      <ShareStreakButton
                        streak={currentStreak}
                        badgeName={b.name}
                      />
                    ) : (
                      <div className="text-xs text-gray-500">
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
