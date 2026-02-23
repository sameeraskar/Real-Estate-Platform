"use client";

import { useState } from "react";

export default function InquireForm({
  slug,
  listingId,
  listingTitle,
}: {
  slug: string;
  listingId: string;
  listingTitle: string;
}) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");
    setErrorMsg("");

    try {
      const res = await fetch("/api/public/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug,
          fullName,
          email,
          phone,
          message: `Inquiry about listing: ${listingTitle} (ID: ${listingId})`,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data?.error || `Failed (${res.status})`);

      setStatus("sent");
      setFullName("");
      setEmail("");
      setPhone("");
    } catch (err: any) {
      setStatus("error");
      setErrorMsg(err?.message || "Error");
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-2">
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
      <button className="rounded-md bg-black text-white px-4 py-2 text-sm" disabled={status === "sending"}>
        {status === "sending" ? "Sending..." : "Send inquiry"}
      </button>

      {status === "sent" && <p className="text-sm text-green-700">Sent ✅</p>}
      {status === "error" && <p className="text-sm text-red-700">Error: {errorMsg}</p>}
    </form>
  );
}
