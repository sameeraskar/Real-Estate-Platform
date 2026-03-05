"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function MessageComposer({
  conversationId,
  channel,
}: {
  conversationId: string;
  channel: "SMS" | "EMAIL";
}) {
  const router = useRouter();
  const [subject, setSubject] = useState("");
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const send = async () => {
    const trimmed = text.trim();
    if (!trimmed) return;

    // For EMAIL, subject is strongly recommended (enforce for MVP)
    if (channel === "EMAIL" && !subject.trim()) {
      setError("Subject is required for email");
      return;
    }

    setSending(true);
    setError(null);

    try {
      const res = await fetch(`/api/conversations/${conversationId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          channel,
          text: trimmed,
          subject: channel === "EMAIL" ? subject.trim() : undefined,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Failed to send message");

      setText("");
      if (channel === "EMAIL") setSubject("");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to send");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="rounded-lg border bg-white p-4 space-y-3">
      <div className="text-sm font-medium">
        Send {channel === "SMS" ? "SMS" : "Email"}
      </div>

      {error ? <div className="text-sm text-red-600">{error}</div> : null}

      {channel === "EMAIL" ? (
        <div>
          <label className="block text-sm text-gray-700 mb-1">Subject</label>
          <input
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="w-full border rounded-md p-2 text-sm"
            placeholder="Subject..."
            disabled={sending}
          />
        </div>
      ) : null}

      <div>
        <label className="block text-sm text-gray-700 mb-1">
          {channel === "SMS" ? "Message" : "Body"}
        </label>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={4}
          className="w-full border rounded-md p-2 text-sm"
          placeholder="Type your message..."
          disabled={sending}
        />
      </div>

      <div className="flex justify-end">
        <button
          type="button"
          onClick={send}
          disabled={sending || !text.trim()}
          className="px-4 py-2 rounded-md bg-blue-600 text-white text-sm disabled:opacity-50"
        >
          {sending ? "Sending..." : "Send"}
        </button>
      </div>
    </div>
  );
}