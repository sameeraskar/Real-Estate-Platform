"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function RecomputeButton({ savedSearchId }: { savedSearchId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function run() {
    setLoading(true);
    setMsg(null);
    try {
      const res = await fetch(`/api/saved-searches/${savedSearchId}/recompute`, {
        method: "POST",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Recompute failed");

      setMsg(`Matches: ${data.totalMatches ?? "?"}`);
      router.refresh();
    } catch (e: any) {
      setMsg(e?.message || "Error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={run}
      disabled={loading}
      className="rounded-md bg-black text-white px-3 py-2 text-sm disabled:opacity-60"
      title="Recompute matches for this saved search"
    >
      {loading ? "Recomputing..." : msg ? msg : "Recompute"}
    </button>
  );
}