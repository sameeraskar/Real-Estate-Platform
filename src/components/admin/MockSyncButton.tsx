"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function MockSyncButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function run() {
    setLoading(true);
    setMsg(null);

    try {
      const res = await fetch("/api/sync/mock-pillar9", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          listings: [
            {
              key: "p9-123",
              title: "Modern Townhome in NW Calgary",
              address: "123 Rocky Ridge Ave NW",
              city: "Calgary",
              province: "AB",
              price: 589000,
              beds: 3,
              baths: 2,
              sqft: 1650,
              imageUrl:
                "https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=1200&q=80",
              description:
                "Bright end-unit townhome with open concept living and double garage.",
              status: "ACTIVE",
            },
            {
              key: "p9-456",
              title: "Downtown Condo with River Views",
              address: "909 5 St SW #1204",
              city: "Calgary",
              province: "AB",
              price: 399000,
              beds: 2,
              baths: 2,
              sqft: 980,
              imageUrl:
                "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=1200&q=80",
              description:
                "Walkable lifestyle, floor-to-ceiling windows, and modern finishes.",
              status: "ACTIVE",
            },
          ],
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "Sync failed");

      setMsg(`Synced ${data.count} listings ✅`);
      router.refresh();
    } catch (e: any) {
      setMsg(e?.message ?? "Sync failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-2">
      <button
        onClick={run}
        disabled={loading}
        className="rounded-md bg-black text-white px-4 py-2 text-sm disabled:opacity-50"
      >
        {loading ? "Syncing..." : "Run mock sync"}
      </button>

      {msg && <div className="text-sm text-gray-700">{msg}</div>}
    </div>
  );
}
