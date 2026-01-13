"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

function formatHours(hours: number) {
  if (hours % 24 === 0) return `${hours / 24} day${hours / 24 === 1 ? "" : "s"}`;
  return `${hours} hours`;
}

function Toast(props: { message: string }) {
  return (
    <div className="fixed inset-x-0 top-4 z-50 flex justify-center px-4">
      <div className="sa-toast w-full max-w-md p-4 text-sm">{props.message}</div>
    </div>
  );
}

export default function SettingsClient(props: {
  miaThresholdHrs: number;
  emergencyModeEnabled: boolean;
  emergencyModeEndTime: string | null;
  emergencyModeMultiplier: number;
}) {
  const [enabled, setEnabled] = useState(props.emergencyModeEnabled);
  const [multiplier, setMultiplier] = useState<number>(props.emergencyModeMultiplier ?? 2);
  const [endTimeIso, setEndTimeIso] = useState<string | null>(props.emergencyModeEndTime);
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (toastTimer.current) window.clearTimeout(toastTimer.current);
    };
  }, []);

  const extendedHours = useMemo(
    () => props.miaThresholdHrs * multiplier,
    [props.miaThresholdHrs, multiplier],
  );

  function showToast(msg: string, ms: number) {
    setToast(msg);
    if (toastTimer.current) window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(null), ms);
  }

  async function save(nextEnabled: boolean, nextMultiplier: number) {
    setIsSaving(true);
    try {
      const res = await fetch("/api/emergency-mode", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ enabled: nextEnabled, multiplier: nextMultiplier }),
      });
      const data = (await res.json().catch(() => null)) as
        | {
            error?: string;
            emergencyModeEnabled?: boolean;
            emergencyModeEndTime?: string | null;
            emergencyModeMultiplier?: number;
          }
        | null;
      if (!res.ok) throw new Error(data?.error || "Failed to save");

      setEnabled(Boolean(data?.emergencyModeEnabled));
      setMultiplier(Number(data?.emergencyModeMultiplier ?? nextMultiplier));
      setEndTimeIso(data?.emergencyModeEndTime ?? null);
      return data;
    } finally {
      setIsSaving(false);
    }
  }

  async function onToggle() {
    const nextEnabled = !enabled;
    try {
      const data = await save(nextEnabled, multiplier);
      if (nextEnabled) {
        const hrs = props.miaThresholdHrs * (data?.emergencyModeMultiplier ?? multiplier);
        showToast(
          `Panic Pause ON. You won't trigger alerts for ${formatHours(hrs)}. Go live your life (safely).`,
          4500,
        );
      } else {
        showToast("Panic Pause OFF. Alerts are back. Try not to vanish.", 4500);
      }
    } catch {
      showToast("Failed to update Panic Pause. Please try again later.", 4500);
      setEnabled(enabled);
    }
  }

  async function onChangeMultiplier(next: number) {
    setMultiplier(next);
    if (!enabled) return;
    try {
      const data = await save(true, next);
      const hrs = props.miaThresholdHrs * (data?.emergencyModeMultiplier ?? next);
      showToast(
        `Panic Pause updated. You won't trigger alerts for ${formatHours(hrs)}. Enjoy your temporary freedom.`,
        4500,
      );
    } catch {
      showToast("Failed to update Panic Pause. Please try again later.", 4500);
    }
  }

  return (
    <div className="sa-page">
      {toast ? <Toast message={toast} /> : null}
      <div className="sa-shell">
        <header className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-[color:var(--sa-fg)] sm:text-3xl">
              Settings
            </h1>
            <p className="mt-1 text-base text-[color:var(--sa-muted)]">
              Adjust your &quot;don&apos;t scare my friends&quot; settings.
            </p>
          </div>
          <Link href="/dashboard" className="sa-link text-sm">
            Back
          </Link>
        </header>

        <div className="sa-card sa-card-pad">
          <h2 className="text-lg font-medium text-[color:var(--sa-fg)]">I Might Be MIA</h2>
          <p className="mt-1 text-sm text-[color:var(--sa-muted)]">
            Vacation / busy mode. Extend your deadline so your contacts don&apos;t go full detective.
          </p>

          <div className="mt-6 flex items-center justify-between gap-6">
            <div className="text-sm font-medium text-[color:var(--sa-fg)]">Enable Panic Pause</div>

            <button
              type="button"
              onClick={onToggle}
              disabled={isSaving}
              className={`relative h-10 w-20 rounded-full transition-colors ${
                enabled ? "bg-orange-500" : "bg-gray-200"
              } disabled:opacity-70`}
              aria-pressed={enabled}
              aria-label="Toggle Panic Pause"
            >
              <span
                className={`absolute top-1 h-8 w-8 rounded-full bg-white shadow-md transition-transform ${
                  enabled ? "translate-x-11" : "translate-x-1"
                }`}
              />
            </button>
          </div>

          {enabled ? (
            <div className="mt-6">
              <div className="text-sm font-medium text-[color:var(--sa-muted)]">
                Extend MIA Threshold
              </div>
              <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-center">
                <select
                  value={multiplier}
                  onChange={(e) => onChangeMultiplier(Number(e.target.value))}
                  className="sa-input sm:w-48"
                >
                  <option value={2}>2x</option>
                  <option value={3}>3x</option>
                  <option value={4}>4x</option>
                </select>
                <div className="text-sm text-[color:var(--sa-muted)]">
                  Alerts paused for{" "}
                  <span className="font-semibold text-[color:var(--sa-fg)]">
                    {formatHours(extendedHours)}
                  </span>
                  {endTimeIso ? (
                    <span className="text-[color:var(--sa-muted-2)]">
                      {" "}
                      (until {new Date(endTimeIso).toLocaleString()})
                    </span>
                  ) : null}
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
