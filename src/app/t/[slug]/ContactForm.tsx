"use client";

import { useState } from "react";

export default function ContactForm({ slug }: { slug: string }) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState<string>("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");
    setErrorMsg("");

    try {
      const res = await fetch("/api/public/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, fullName, email, phone, message }),
      });

      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data?.error || `Request failed (${res.status})`);
      }

      setStatus("sent");
      setFullName("");
      setEmail("");
      setPhone("");
      setMessage("");
    } catch (err: any) {
      setStatus("error");
      setErrorMsg(err?.message || "Unknown error");
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <input
        className="w-full border rounded-md px-3 py-2"
        placeholder="Full name"
        value={fullName}
        onChange={(e) => setFullName(e.target.value)}
      />
      <input
        className="w-full border rounded-md px-3 py-2"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <input
        className="w-full border rounded-md px-3 py-2"
        placeholder="Phone"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
      />
      <textarea
        className="w-full border rounded-md px-3 py-2"
        placeholder="Message"
        rows={4}
        value={message}
        onChange={(e) => setMessage(e.target.value)}
      />

      <button
        className="rounded-md bg-black text-white px-4 py-2 text-sm"
        disabled={status === "sending"}
      >
        {status === "sending" ? "Sending..." : "Send"}
      </button>

      {status === "sent" && <p className="text-sm text-green-700">Sent! ✅</p>}
      {status === "error" && (
        <p className="text-sm text-red-700">Error: {errorMsg}</p>
      )}
    </form>
  );
}
