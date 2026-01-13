"use client";

import { useEffect, useMemo, useState } from "react";

const MESSAGES = [
  "Congrats! You've proven you're not a robot (or a missing person).",
  "Welcome back to the Human Survival Check-In Squad.",
  "Login successful. Please continue being alive. Thanks.",
  "You're in. Now go press the big orange button like a responsible mammal.",
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
      <div className="sa-toast pointer-events-auto w-full max-w-md p-6">
        <div className="text-sm font-medium text-[color:var(--sa-fg)]">{message}</div>
        <div className="mt-4 flex justify-end">
          <button type="button" onClick={() => setIsOpen(false)} className="sa-btn sa-btn-soft">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
