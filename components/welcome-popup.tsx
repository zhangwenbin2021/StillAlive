"use client";

import { useEffect, useMemo, useState } from "react";

const MESSAGES = [
  "Congrats! You’ve proven you’re not a robot (or a missing person)!",
  "Welcome back to the Human Survival Check-In Squad!",
  "Login successful! Today’s another day to stay alive and thrive～",
] as const;

export default function WelcomePopup() {
  const [isOpen, setIsOpen] = useState(false);

  const message = useMemo(() => {
    return MESSAGES[Math.floor(Math.random() * MESSAGES.length)];
  }, []);

  useEffect(() => {
    const key = "stillalive_welcome_shown";
    const alreadyShown = window.sessionStorage.getItem(key) === "1";
    if (alreadyShown) return;
    window.sessionStorage.setItem(key, "1");
    setIsOpen(true);
  }, []);

  if (!isOpen) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-50 flex items-start justify-center px-4 pt-6 sm:pt-10">
      <div className="pointer-events-auto w-full max-w-md rounded-lg bg-white p-6 shadow-lg ring-1 ring-black/5 dark:bg-gray-900 dark:ring-white/10">
        <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
          {message}
        </div>
        <div className="mt-4 flex justify-end">
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="rounded-md px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

