"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

type Contact = {
  id: string;
  name: string;
  email: string;
};

const EMAIL_HELP = "Please enter a valid email address.";

function isValidEmail(email: string) {
  if (email.length > 320) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

async function addContact(name: string, email: string) {
  const res = await fetch("/api/emergency-contacts", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ name, email }),
  });
  const data = (await res.json().catch(() => null)) as
    | { error?: string; contact?: Contact }
    | null;
  if (!res.ok) throw new Error(data?.error || "Failed to add contact");
  return data as { contact: Contact };
}

async function updateContact(id: string, name: string, email: string) {
  const res = await fetch(`/api/emergency-contacts/${id}`, {
    method: "PATCH",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ name, email }),
  });
  const data = (await res.json().catch(() => null)) as
    | { error?: string; contact?: Contact }
    | null;
  if (!res.ok) throw new Error(data?.error || "Failed to update contact");
  return data as { contact: Contact };
}

async function deleteContact(id: string) {
  const res = await fetch(`/api/emergency-contacts/${id}`, { method: "DELETE" });
  const data = (await res.json().catch(() => null)) as { error?: string } | null;
  if (!res.ok) throw new Error(data?.error || "Failed to delete contact");
}

async function saveThreshold(miaThresholdHrs: number) {
  const res = await fetch("/api/mia-threshold", {
    method: "PUT",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ miaThresholdHrs }),
  });
  const data = (await res.json().catch(() => null)) as
    | { error?: string; miaThresholdHrs?: number }
    | null;
  if (!res.ok) throw new Error(data?.error || "Failed to save threshold");
  return data as { miaThresholdHrs: number };
}

async function sendTestAlert() {
  const res = await fetch("/api/emergency-contacts/test-alert", { method: "POST" });
  const data = (await res.json().catch(() => null)) as
    | { error?: string; sent?: number; failed?: number; results?: Array<{ email: string; ok: boolean; error: string | null }> }
    | null;
  if (!res.ok) throw new Error(data?.error || "Failed to send test alert");
  return data as {
    sent: number;
    failed: number;
    results?: Array<{ email: string; ok: boolean; error: string | null }>;
  };
}

export default function EmergencyContactsClient(props: {
  initialContacts: Contact[];
  initialThreshold: number;
}) {
  const [contacts, setContacts] = useState<Contact[]>(props.initialContacts);
  const [threshold, setThreshold] = useState<number>(props.initialThreshold);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const editing = useMemo(
    () => contacts.find((c) => c.id === editingId) ?? null,
    [contacts, editingId],
  );
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  const [isSavingThreshold, setIsSavingThreshold] = useState(false);
  const [isSendingTest, setIsSendingTest] = useState(false);

  function startEdit(c: Contact) {
    setInfo(null);
    setError(null);
    setEditingId(c.id);
    setEditName(c.name);
    setEditEmail(c.email);
  }

  function cancelEdit() {
    setEditingId(null);
    setEditName("");
    setEditEmail("");
  }

  async function onAdd() {
    setError(null);
    setInfo(null);
    const trimmedName = name.trim();
    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedName || !trimmedEmail || !isValidEmail(trimmedEmail)) {
      setError(EMAIL_HELP);
      return;
    }
    if (contacts.length >= 3) {
      setError("You can only add up to 3 emergency contacts.");
      return;
    }

    setIsSubmitting(true);
    try {
      const { contact } = await addContact(trimmedName, trimmedEmail);
      setContacts((prev) => [...prev, contact].slice(0, 3));
      setName("");
      setEmail("");
      setInfo("Contact added.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to add contact");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function onSaveEdit() {
    if (!editing) return;
    setError(null);
    setInfo(null);

    const trimmedName = editName.trim();
    const trimmedEmail = editEmail.trim().toLowerCase();
    if (!trimmedName || !trimmedEmail || !isValidEmail(trimmedEmail)) {
      setError(EMAIL_HELP);
      return;
    }

    setIsSavingEdit(true);
    try {
      const { contact } = await updateContact(
        editing.id,
        trimmedName,
        trimmedEmail,
      );
      setContacts((prev) => prev.map((c) => (c.id === contact.id ? contact : c)));
      setEditingId(null);
      setInfo("Updated.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to update contact");
    } finally {
      setIsSavingEdit(false);
    }
  }

  async function onDelete(id: string) {
    setError(null);
    setInfo(null);
    try {
      await deleteContact(id);
      setContacts((prev) => prev.filter((c) => c.id !== id));
      if (editingId === id) cancelEdit();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to delete contact");
    }
  }

  async function onSaveThreshold() {
    setError(null);
    setInfo(null);
    setIsSavingThreshold(true);
    try {
      const data = await saveThreshold(threshold);
      setThreshold(data.miaThresholdHrs);
      setInfo("Threshold saved.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save threshold");
    } finally {
      setIsSavingThreshold(false);
    }
  }

  async function onSendTest() {
    setError(null);
    setInfo(null);
    setIsSendingTest(true);
    try {
      const { sent, failed, results } = await sendTestAlert();
      if (failed > 0 && results?.length) {
        const failedItems = results.filter((r) => !r.ok);
        const first = failedItems[0];
        setError(first?.error ? `${first.email}: ${first.error}` : "Some emails failed to send.");
      }
      setInfo(`Test alert sent. Success: ${sent}, Failed: ${failed}.`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to send test alert");
    } finally {
      setIsSendingTest(false);
    }
  }

  return (
    <div className="sa-page">
      <div className="sa-shell">
        <header className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-[color:var(--sa-fg)] sm:text-3xl">
              Emergency Contacts
            </h1>
            <p className="mt-1 text-base text-[color:var(--sa-muted)]">
              Who do we email if you disappear like a magician?
            </p>
          </div>
          <Link href="/dashboard" className="sa-link text-sm">
            Back
          </Link>
        </header>

        <section className="sa-card sa-card-pad">
          <div className="text-sm font-medium text-[color:var(--sa-fg)]">Add Contact</div>

          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="sm:col-span-1">
              <label className="text-xs text-[color:var(--sa-muted)]">Name</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Jane Doe"
                className="sa-input mt-1"
              />
            </div>
            <div className="sm:col-span-1">
              <label className="text-xs text-[color:var(--sa-muted)]">Email</label>
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="friend@example.com"
                className="sa-input mt-1"
              />
            </div>
            <div className="sm:col-span-1 sm:flex sm:items-end">
              <button
                type="button"
                onClick={onAdd}
                disabled={isSubmitting}
                className="sa-btn sa-btn-primary w-full"
              >
                {isSubmitting ? "Adding..." : "Add Contact"}
              </button>
            </div>
          </div>

          {error ? <div className="mt-3 text-sm text-red-600">{error}</div> : null}
          {info ? <div className="mt-3 text-sm text-[color:var(--sa-muted)]">{info}</div> : null}
          <div className="mt-3 text-xs text-[color:var(--sa-muted-2)]">
            MVP limit: 3 contacts (because chaos is expensive).
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={onSendTest}
              disabled={isSendingTest || contacts.length === 0}
              className="sa-btn sa-btn-ink"
            >
              {isSendingTest ? "Sending..." : "Send Test Email"}
            </button>
            <div className="text-xs text-[color:var(--sa-muted-2)]">
              Sends a one-time test email (no panic, just vibes).
            </div>
          </div>
        </section>

        <section className="flex flex-col gap-3">
          <div className="text-sm font-medium text-[color:var(--sa-fg)]">Contact List</div>
          {contacts.length === 0 ? (
            <div className="text-sm text-[color:var(--sa-muted)]">No contacts yet.</div>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {contacts.map((c) => (
                <div
                  key={c.id}
                  className="sa-card p-5"
                >
                  {editingId === c.id ? (
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                      <div>
                        <label className="text-xs text-[color:var(--sa-muted)]">Name</label>
                        <input
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="sa-input mt-1"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-[color:var(--sa-muted)]">Email</label>
                        <input
                          value={editEmail}
                          onChange={(e) => setEditEmail(e.target.value)}
                          className="sa-input mt-1"
                        />
                      </div>
                      <div className="flex items-end gap-3">
                        <button
                          type="button"
                          onClick={onSaveEdit}
                          disabled={isSavingEdit}
                          className="sa-btn sa-btn-soft"
                        >
                          {isSavingEdit ? "Saving..." : "Save"}
                        </button>
                        <button
                          type="button"
                          onClick={cancelEdit}
                          className="text-sm text-[color:var(--sa-muted)] hover:underline"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="text-sm font-semibold text-[color:var(--sa-fg)]">
                          {c.name}
                        </div>
                        <div className="mt-1 text-sm text-[color:var(--sa-muted)]">
                          {c.email}
                        </div>
                      </div>
                      <div className="flex gap-4">
                        <button
                          type="button"
                          onClick={() => startEdit(c)}
                          className="text-sm font-medium text-[color:var(--sa-fg)] hover:underline"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => onDelete(c.id)}
                          className="text-sm font-medium text-red-600 hover:underline"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="sa-card sa-card-pad">
          <h2 className="text-base font-medium text-[color:var(--sa-fg)] sm:text-lg">
            MIA Threshold
          </h2>
          <p className="mt-1 text-sm text-[color:var(--sa-muted)]">
            How long until we notify your contacts if you don&apos;t check in?
          </p>

          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[12, 24, 36, 48].map((h) => (
              <label key={h} className="flex cursor-pointer items-center gap-2 rounded-lg border border-black/10 bg-white/70 px-3 py-2 text-sm">
                <input
                  type="radio"
                  name="threshold"
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
              className="sa-btn sa-btn-soft"
            >
              {isSavingThreshold ? "Saving..." : "Save Threshold"}
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
