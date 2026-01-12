"use client";

import { maskPhone } from "@/lib/phone";
import Link from "next/link";
import { useMemo, useState } from "react";

type Contact = {
  id: string;
  name: string;
  phone: string;
  isConfirmed: boolean;
};

const E164_HELP = "Please enter a valid phone number (E.164 format)";

function CheckIcon(props: { className?: string }) {
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
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

function isE164(phone: string) {
  return /^\+[1-9]\d{1,14}$/.test(phone);
}

async function addContact(name: string, phone: string) {
  const res = await fetch("/api/emergency-contacts", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ name, phone }),
  });
  const data = (await res.json().catch(() => null)) as
    | { error?: string; contact?: Contact; smsSent?: boolean }
    | null;
  if (!res.ok) throw new Error(data?.error || "Failed to add contact");
  return data as { contact: Contact; smsSent: boolean };
}

async function updateContact(id: string, name: string, phone: string) {
  const res = await fetch(`/api/emergency-contacts/${id}`, {
    method: "PATCH",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ name, phone }),
  });
  const data = (await res.json().catch(() => null)) as
    | { error?: string; contact?: Contact; smsSent?: boolean | null }
    | null;
  if (!res.ok) throw new Error(data?.error || "Failed to update contact");
  return data as { contact: Contact; smsSent: boolean | null };
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

export default function EmergencyContactsClient(props: {
  initialContacts: Contact[];
  initialThreshold: number;
}) {
  const [contacts, setContacts] = useState<Contact[]>(props.initialContacts);
  const [threshold, setThreshold] = useState<number>(props.initialThreshold);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const editing = useMemo(
    () => contacts.find((c) => c.id === editingId) ?? null,
    [contacts, editingId],
  );
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  const [isSavingThreshold, setIsSavingThreshold] = useState(false);

  function startEdit(c: Contact) {
    setInfo(null);
    setError(null);
    setEditingId(c.id);
    setEditName(c.name);
    setEditPhone(c.phone);
  }

  function cancelEdit() {
    setEditingId(null);
    setEditName("");
    setEditPhone("");
  }

  async function onAdd() {
    setError(null);
    setInfo(null);
    const trimmedName = name.trim();
    const trimmedPhone = phone.trim();
    if (!trimmedName || !trimmedPhone || !isE164(trimmedPhone)) {
      setError(E164_HELP);
      return;
    }
    if (contacts.length >= 3) {
      setError("You can only add up to 3 emergency contacts.");
      return;
    }

    setIsSubmitting(true);
    try {
      const { contact, smsSent } = await addContact(trimmedName, trimmedPhone);
      setContacts((prev) => [...prev, contact].slice(0, 3));
      setName("");
      setPhone("");
      setInfo(
        smsSent
          ? "Confirmation SMS sent."
          : "Contact added, but SMS failed to send. Check Twilio config.",
      );
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
    const trimmedPhone = editPhone.trim();
    if (!trimmedName || !trimmedPhone || !isE164(trimmedPhone)) {
      setError(E164_HELP);
      return;
    }

    setIsSavingEdit(true);
    try {
      const { contact, smsSent } = await updateContact(
        editing.id,
        trimmedName,
        trimmedPhone,
      );
      setContacts((prev) => prev.map((c) => (c.id === contact.id ? contact : c)));
      setEditingId(null);
      if (smsSent === true) setInfo("Updated. Confirmation SMS sent.");
      else if (smsSent === false) setInfo("Updated, but SMS failed to send.");
      else setInfo("Updated.");
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

  return (
    <div className="min-h-screen bg-gray-50 px-6 py-10 text-gray-900">
      <div className="mx-auto flex w-full max-w-[800px] flex-col gap-8">
        <header className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-gray-800 sm:text-3xl">
              Emergency Contacts
            </h1>
            <p className="mt-1 text-base text-gray-500">
              Who gets notified if you go MIA?
            </p>
          </div>
          <Link href="/dashboard" className="text-sm text-orange-500 hover:underline">
            Back
          </Link>
        </header>

        <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-md">
          <div className="text-sm font-medium text-gray-700">Add Contact</div>

          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="sm:col-span-1">
              <label className="text-xs text-gray-600">Name</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Jane Doe"
                className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-orange-300"
              />
            </div>
            <div className="sm:col-span-1">
              <label className="text-xs text-gray-600">Phone Number (E.164)</label>
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+1234567890"
                className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-orange-300"
              />
            </div>
            <div className="sm:col-span-1 sm:flex sm:items-end">
              <button
                type="button"
                onClick={onAdd}
                disabled={isSubmitting}
                className="w-full rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white hover:bg-orange-600 disabled:opacity-70"
              >
                {isSubmitting ? "Adding..." : "Add Contact"}
              </button>
            </div>
          </div>

          {error ? <div className="mt-3 text-sm text-red-600">{error}</div> : null}
          {info ? <div className="mt-3 text-sm text-gray-600">{info}</div> : null}
          <div className="mt-3 text-xs text-gray-400">MVP limit: 3 contacts</div>
        </section>

        <section className="flex flex-col gap-3">
          <div className="text-sm font-medium text-gray-700">Contact List</div>
          {contacts.length === 0 ? (
            <div className="text-sm text-gray-500">No contacts yet.</div>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {contacts.map((c) => (
                <div
                  key={c.id}
                  className="rounded-xl border border-gray-200 bg-white p-5 shadow-md"
                >
                  {editingId === c.id ? (
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                      <div>
                        <label className="text-xs text-gray-600">Name</label>
                        <input
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-orange-300"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-600">Phone (E.164)</label>
                        <input
                          value={editPhone}
                          onChange={(e) => setEditPhone(e.target.value)}
                          className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-orange-300"
                        />
                      </div>
                      <div className="flex items-end gap-3">
                        <button
                          type="button"
                          onClick={onSaveEdit}
                          disabled={isSavingEdit}
                          className="rounded-lg bg-gray-100 px-3 py-2 text-sm hover:bg-gray-200 disabled:opacity-70"
                        >
                          {isSavingEdit ? "Saving..." : "Save"}
                        </button>
                        <button
                          type="button"
                          onClick={cancelEdit}
                          className="text-sm text-gray-500 hover:underline"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="text-sm font-semibold text-gray-900">
                          {c.name}
                        </div>
                        <div className="mt-1 text-sm text-gray-600">
                          {maskPhone(c.phone)}
                        </div>
                        <div className="mt-2 text-sm">
                          {c.isConfirmed ? (
                            <div className="flex items-center gap-2 text-green-600">
                              <CheckIcon className="h-4 w-4" />
                              <span className="font-medium">Confirmed</span>
                            </div>
                          ) : (
                            <div>
                              <div className="font-medium text-yellow-600">
                                Pending
                              </div>
                              <div className="mt-1 text-sm text-yellow-500">
                                A confirmation SMS has been sent to this number
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-4">
                        <button
                          type="button"
                          onClick={() => startEdit(c)}
                          className="text-sm font-medium text-blue-500 hover:underline"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => onDelete(c.id)}
                          className="text-sm font-medium text-red-500 hover:underline"
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

        <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-md">
          <h2 className="text-base font-medium text-gray-700 sm:text-lg">MIA Threshold</h2>
          <p className="mt-1 text-sm text-gray-600">
            How long until we alert your contacts if you don’t check in?
          </p>

          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[12, 24, 36, 48].map((h) => (
              <label
                key={h}
                className="flex cursor-pointer items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm"
              >
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
