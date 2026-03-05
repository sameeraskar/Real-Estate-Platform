"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

interface Contact {
  id: string;
  fullName: string | null;
  email: string | null;
  phone: string | null;
}

interface NewConversationFormProps {
  contacts?: Contact[];
}

type Channel = "SMS" | "EMAIL";

export default function NewConversationForm({ contacts = [] }: NewConversationFormProps) {
  const router = useRouter();

  const [contactId, setContactId] = useState("");
  const [channel, setChannel] = useState<Channel>("SMS");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedContact = useMemo(
    () => contacts.find((c) => c.id === contactId) || null,
    [contacts, contactId]
  );

  const canSms = !!selectedContact?.phone;
  const canEmail = !!selectedContact?.email;

  const effectiveChannel: Channel = useMemo(() => {
    // If user selected SMS but contact has no phone, fall back to EMAIL if possible
    if (channel === "SMS" && !canSms && canEmail) return "EMAIL";
    // If user selected EMAIL but contact has no email, fall back to SMS if possible
    if (channel === "EMAIL" && !canEmail && canSms) return "SMS";
    return channel;
  }, [channel, canSms, canEmail]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!contactId) {
      setError("Please select a contact");
      return;
    }

    if (effectiveChannel === "SMS" && !canSms) {
      setError("This contact has no phone number for SMS");
      return;
    }

    if (effectiveChannel === "EMAIL" && !canEmail) {
      setError("This contact has no email address");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contactId,
          channel: effectiveChannel,
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data?.error || "Failed to create conversation");
      }

      router.push(`/app/conversations/${data.conversation.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm">
          {error}
        </div>
      )}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
        {/* Contact picker */}
        <div className="flex-1">
          <label htmlFor="contact" className="block text-sm font-medium text-gray-700 mb-2">
            Select Contact
          </label>

          <select
            id="contact"
            value={contactId}
            onChange={(e) => setContactId(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isLoading}
          >
            <option value="">-- Choose a contact --</option>
            {contacts.map((contact) => {
              const name = contact.fullName?.trim() || "Unknown";
              const info = contact.phone || contact.email || "";
              return (
                <option key={contact.id} value={contact.id}>
                  {name} {info ? `(${info})` : ""}
                </option>
              );
            })}
          </select>
        </div>

        {/* Channel picker */}
        <div className="w-full sm:w-48">
          <label htmlFor="channel" className="block text-sm font-medium text-gray-700 mb-2">
            Channel
          </label>

          <select
            id="channel"
            value={effectiveChannel}
            onChange={(e) => setChannel(e.target.value as Channel)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isLoading || !contactId}
          >
            <option value="SMS" disabled={!!contactId && !canSms}>
              SMS {contactId && !canSms ? "(no phone)" : ""}
            </option>
            <option value="EMAIL" disabled={!!contactId && !canEmail}>
              Email {contactId && !canEmail ? "(no email)" : ""}
            </option>
          </select>
        </div>

        {/* Submit */}
        <div className="flex">
          <button
            type="submit"
            disabled={isLoading || !contactId}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? "Creating..." : `Start ${effectiveChannel === "SMS" ? "SMS" : "Email"} Conversation`}
          </button>
        </div>
      </div>
    </form>
  );
}