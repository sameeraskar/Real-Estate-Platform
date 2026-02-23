"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function ListingRowActions({
  id,
  isHidden,
  featured,
}: {
  id: string;
  isHidden: boolean;
  featured: boolean;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState<"hide" | "feat" | null>(null);

  async function post(action: "toggleHidden" | "toggleFeatured") {
    setLoading(action === "toggleHidden" ? "hide" : "feat");
    try {
      const res = await fetch(`/api/listings/${id}/flags`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (!res.ok) throw new Error("Failed");
      router.refresh();
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="flex gap-2 justify-end">
      <button
        onClick={() => post("toggleFeatured")}
        disabled={loading !== null}
        className={`rounded-md border px-3 py-1 text-xs ${
          featured ? "bg-yellow-100" : ""
        }`}
        title="Feature listing (shows first)"
      >
        {loading === "feat" ? "..." : featured ? "Featured" : "Feature"}
      </button>

      <button
        onClick={() => post("toggleHidden")}
        disabled={loading !== null}
        className={`rounded-md border px-3 py-1 text-xs ${
          isHidden ? "bg-gray-100" : ""
        }`}
        title="Hide listing from public site"
      >
        {loading === "hide" ? "..." : isHidden ? "Hidden" : "Hide"}
      </button>
    </div>
  );
}
