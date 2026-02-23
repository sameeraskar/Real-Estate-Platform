"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const ORDER = ["NEW", "CONTACTED", "APPOINTMENT", "WON", "LOST"] as const;
type Status = (typeof ORDER)[number];

export default function LeadStatusControls({
  leadId,
  current,
}: {
  leadId: string;
  current: Status;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState<Status | null>(null);

  async function setStatus(next: Status) {
    setLoading(next);
    try {
      const res = await fetch(`/api/leads/${leadId}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      });

      if (!res.ok) throw new Error("Failed");
      router.refresh();
    } finally {
      setLoading(null);
    }
  }

  // Small “smart” moves: show only likely next steps
  const quick: Status[] =
    current === "NEW"
      ? ["CONTACTED", "LOST"]
      : current === "CONTACTED"
      ? ["APPOINTMENT", "LOST"]
      : current === "APPOINTMENT"
      ? ["WON", "LOST"]
      : [];

  if (quick.length === 0) return <div className="text-gray-400">—</div>;

  return (
    <div className="flex gap-2 justify-end">
      {quick.map((s) => (
        <button
          key={s}
          onClick={() => setStatus(s)}
          disabled={loading !== null}
          className="rounded-md border px-2 py-1 text-xs hover:bg-gray-50 disabled:opacity-50"
        >
          {loading === s ? "…" : s}
        </button>
      ))}
    </div>
  );
}
