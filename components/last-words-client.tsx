"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

const PLACEHOLDER =
  "Write your silly last words (e.g., 'Tell my cat I loved them', 'My Netflix password is...')";

const THRESHOLDS = [36, 48, 72] as const;

async function saveLastWords(message: string, deliveryThreshold: number) {
  const res = await fetch("/api/last-words", {
    method: "PUT",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ message, deliveryThreshold }),
  });
  const text = await res.text();
  const data = (JSON.parse(text || "null") as { error?: string } | null) ?? null;
  if (!res.ok) throw new Error(data?.error || "Failed to save");
}

async function saveThreshold(deliveryThreshold: number) {
  const res = await fetch("/api/last-words", {
    method: "PUT",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ deliveryThreshold }),
  });
  const text = await res.text();
  const data = (JSON.parse(text || "null") as { error?: string } | null) ?? null;
  if (!res.ok) throw new Error(data?.error || "Failed to save threshold");
}

async function deleteLastWords() {
  const res = await fetch("/api/last-words", { method: "DELETE" });
  const text = await res.text();
  const data = (JSON.parse(text || "null") as { error?: string } | null) ?? null;
  if (!res.ok) throw new Error(data?.error || "Failed to delete");
}

function clamp500(text: string) {
  return text.length > 500 ? text.slice(0, 500) : text;
}

function wrapBold(text: string, start: number, end: number) {
  if (start === end) {
    const before = text.slice(0, start);
    const after = text.slice(start);
    return { text: `${before}****${after}`, start: start + 2, end: start + 2 };
  }
  const before = text.slice(0, start);
  const mid = text.slice(start, end);
  const after = text.slice(end);
  return {
    text: `${before}**${mid}**${after}`,
    start,
    end: end + 4,
  };
}

export default function LastWordsClient(props: {
  initialMessage: string;
  initialThreshold: number;
}) {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const [message, setMessage] = useState<string>(props.initialMessage ?? "");
  const [threshold, setThreshold] = useState<number>(props.initialThreshold ?? 48);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isSavingThreshold, setIsSavingThreshold] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const charCount = message.length;

  const hasSavedMessage = useMemo(() => {
    return Boolean((props.initialMessage ?? "").trim().length);
  }, [props.initialMessage]);

  useEffect(() => {
    const key = "stillalive_last_words_draft";
    const draft = window.localStorage.getItem(key);
    if (!draft) return;
    if (!message.trim() && draft.trim()) {
      setMessage(clamp500(draft));
      setInfo("Draft restored.");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const key = "stillalive_last_words_draft";
    const id = window.setInterval(() => {
      window.localStorage.setItem(key, message);
    }, 30_000);
    return () => window.clearInterval(id);
  }, [message]);

  function onBold() {
    setError(null);
    setInfo(null);

    const el = textareaRef.current;
    if (!el) return;
    const start = el.selectionStart ?? 0;
    const end = el.selectionEnd ?? start;

    const next = wrapBold(message, start, end);
    const nextText = clamp500(next.text);
    setMessage(nextText);

    requestAnimationFrame(() => {
      const nextEl = textareaRef.current;
      if (!nextEl) return;
      const cursor = Math.min(next.start, nextText.length);
      nextEl.focus();
      nextEl.setSelectionRange(cursor, cursor);
    });
  }

  async function onSave() {
    setError(null);
    setInfo(null);

    const trimmed = clamp500(message);
    if (!THRESHOLDS.includes(threshold as (typeof THRESHOLDS)[number])) {
      setError("Invalid threshold");
      return;
    }

    setIsSaving(true);
    try {
      await saveLastWords(trimmed, threshold);
      setMessage(trimmed);
      setInfo("Saved.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setIsSaving(false);
    }
  }

  async function onDelete() {
    setError(null);
    setInfo(null);
    setIsDeleting(true);
    try {
      await deleteLastWords();
      setMessage("");
      window.localStorage.removeItem("stillalive_last_words_draft");
      setInfo("Deleted.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to delete");
    } finally {
      setIsDeleting(false);
    }
  }

  async function onSaveThreshold() {
    setError(null);
    setInfo(null);
    if (!THRESHOLDS.includes(threshold as (typeof THRESHOLDS)[number])) {
      setError("Invalid threshold");
      return;
    }
    setIsSavingThreshold(true);
    try {
      await saveThreshold(threshold);
      setInfo("Threshold saved.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save threshold");
    } finally {
      setIsSavingThreshold(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 px-6 py-10 text-gray-900">
      <div className="mx-auto flex w-full max-w-[800px] flex-col gap-8 p-8">
        <header className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-gray-800 sm:text-3xl">
              Silly Last Words
            </h1>
            <p className="mt-1 text-base text-gray-500">
              A lighthearted message for your contacts (if you forget to check in)
            </p>
          </div>
          <Link href="/dashboard" className="text-sm text-orange-500 hover:underline">
            Back
          </Link>
        </header>

        <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-md">
          <div className="flex items-center justify-between">
            <div className="text-sm font-medium text-gray-700">Your Message</div>
            <div className="text-xs text-gray-500">{charCount}/500</div>
          </div>

          <div className="mt-3 flex items-center gap-3">
            <button
              type="button"
              onClick={onBold}
              className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-gray-200 text-sm font-bold text-gray-700 hover:bg-gray-50"
              aria-label="Bold"
              title="Bold"
            >
              B
            </button>
            <div className="text-xs text-gray-500">
              Bold uses <span className="font-mono">**text**</span>
            </div>
          </div>

          <textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(clamp500(e.target.value))}
            placeholder={PLACEHOLDER}
            className="mt-4 h-32 w-full resize-none rounded-lg border border-gray-300 p-4 text-sm outline-none focus:border-orange-300 sm:h-40"
          />

          <div className="mt-4 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={onSave}
              disabled={isSaving}
              className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white hover:bg-orange-600 disabled:opacity-70"
            >
              {isSaving ? "Saving..." : "Save My Words"}
            </button>

            <button
              type="button"
              onClick={onDelete}
              disabled={isDeleting || (!hasSavedMessage && !message.trim())}
              className="text-sm font-medium text-red-500 hover:underline disabled:opacity-50"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </button>
          </div>

          {error ? <div className="mt-3 text-sm text-red-600">{error}</div> : null}
          {info ? <div className="mt-3 text-sm text-gray-600">{info}</div> : null}
        </section>

        <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-md">
          <h2 className="text-base font-medium text-gray-700 sm:text-lg">
            When to Send This Message
          </h2>
          <p className="mt-1 text-sm text-gray-600">
            Only send if you miss check-ins past this deadline (after emergency SMS).
          </p>

          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
            {THRESHOLDS.map((h) => (
              <label
                key={h}
                className="flex cursor-pointer items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm"
              >
                <input
                  type="radio"
                  name="lw-threshold"
                  checked={threshold === h}
                  onChange={() => setThreshold(h)}
                />
                <span>{h}h</span>
              </label>
            ))}
          </div>

          <div className="mt-4">
            <button
              type="button"
              onClick={onSaveThreshold}
              disabled={isSavingThreshold}
              className="rounded-md bg-gray-100 px-3 py-2 text-sm hover:bg-gray-200 disabled:opacity-70"
            >
              {isSavingThreshold ? "Saving..." : "Save Threshold"}
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
