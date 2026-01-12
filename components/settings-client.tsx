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
      <div className="w-full max-w-md rounded-lg bg-white p-4 text-sm text-gray-900 shadow-md ring-1 ring-black/5">
        {props.message}
      </div>
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

  const extendedHours = useMemo(() => props.miaThresholdHrs * multiplier, [props.miaThresholdHrs, multiplier]);

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
          `Emergency Mode Enabled! You won’t trigger alerts for ${formatHours(hrs)}. Relax and focus on your busy schedule～`,
          4000,
        );
      } else {
        showToast("Emergency Mode Disabled! Alerts reset to your original threshold.", 4000);
      }
    } catch {
      showToast("Failed to update Emergency Mode. Please try again later.", 4000);
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
        `Emergency Mode Enabled! You won’t trigger alerts for ${formatHours(hrs)}. Relax and focus on your busy schedule～`,
        4000,
      );
    } catch {
      showToast("Failed to update Emergency Mode. Please try again later.", 4000);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 px-6 py-10 text-gray-900">
      {toast ? <Toast message={toast} /> : null}
      <div className="mx-auto w-full max-w-[800px]">
        <header className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-gray-800 sm:text-3xl">
              Settings
            </h1>
            <p className="mt-1 text-base text-gray-500">
              Emergency mode and preferences
            </p>
          </div>
          <Link href="/dashboard" className="text-sm text-orange-500 hover:underline">
            Back
          </Link>
        </header>

        <div className="mt-8 rounded-xl border border-gray-200 bg-white p-6 shadow-md">
          <h2 className="text-lg font-medium text-gray-700">I Might Be MIA</h2>
          <p className="mt-1 text-sm text-gray-600">
            Vacation/busy mode. Pause alerts by extending your MIA threshold.
          </p>

          <div className="mt-6 flex items-center justify-between gap-6">
            <div className="text-sm font-medium text-gray-800">
              Enable Emergency Mode
            </div>

            <button
              type="button"
              onClick={onToggle}
              disabled={isSaving}
              className={`relative h-10 w-20 rounded-full transition-colors ${
                enabled ? "bg-orange-500" : "bg-gray-200"
              } disabled:opacity-70`}
              aria-pressed={enabled}
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
              <div className="text-sm font-medium text-gray-700">
                Extend MIA Threshold
              </div>
              <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-center">
                <select
                  value={multiplier}
                  onChange={(e) => onChangeMultiplier(Number(e.target.value))}
                  className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-orange-300 sm:w-48"
                >
                  <option value={2}>2x</option>
                  <option value={3}>3x</option>
                  <option value={4}>4x</option>
                </select>
                <div className="text-sm text-gray-600">
                  Alerts paused for{" "}
                  <span className="font-semibold text-gray-800">
                    {formatHours(extendedHours)}
                  </span>
                  {endTimeIso ? (
                    <span className="text-gray-500">
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

