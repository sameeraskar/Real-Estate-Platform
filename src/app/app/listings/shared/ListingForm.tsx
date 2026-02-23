"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type ListingFormValues = {
  title: string;
  status: "ACTIVE" | "DRAFT" | "SOLD";
  address: string;
  city: string;
  province: string;
  postal: string;
  price: string;
  beds: string;
  baths: string;
  sqft: string;
  imageUrl: string;
  description: string;
};

const empty: ListingFormValues = {
  title: "",
  status: "DRAFT",
  address: "",
  city: "",
  province: "AB",
  postal: "",
  price: "",
  beds: "",
  baths: "",
  sqft: "",
  imageUrl: "",
  description: "",
};

export default function ListingForm({
  mode,
  initial,
  listingId,
}: {
  mode: "create" | "edit";
  initial?: Partial<ListingFormValues>;
  listingId?: string;
}) {
  const router = useRouter();
  const [form, setForm] = useState<ListingFormValues>({ ...empty, ...initial });
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [savedMsg, setSavedMsg] = useState("");

  function set<K extends keyof ListingFormValues>(k: K, v: ListingFormValues[K]) {
    setForm((p) => ({ ...p, [k]: v }));
    setErrorMsg("");
    setSavedMsg("");
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    setErrorMsg("");
    setSavedMsg("");

    try {
      const url = mode === "create" ? "/api/listings" : `/api/listings/${listingId}`;
      const method = mode === "create" ? "POST" : "PUT";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data?.error || `Failed (${res.status})`);

      if (mode === "create") {
        router.push(`/app/listings/${data.id}/edit`);
      } else {
        setSavedMsg("Saved ✅");
        router.refresh();
      }
    } catch (err: any) {
      setErrorMsg(err?.message || "Error");
    } finally {
      setLoading(false);
    }
  }

  async function del() {
    if (mode !== "edit") return;
    if (!confirm("Delete this listing?")) return;

    setLoading(true);
    setErrorMsg("");
    setSavedMsg("");

    try {
      const res = await fetch(`/api/listings/${listingId}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data?.error || `Failed (${res.status})`);

      router.push("/app/listings");
    } catch (err: any) {
      setErrorMsg(err?.message || "Error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      {errorMsg && <p className="text-sm text-red-700">Error: {errorMsg}</p>}
      {savedMsg && <p className="text-sm text-green-700">{savedMsg}</p>}

      <div>
        <label className="block text-sm font-medium mb-1">Title</label>
        <input className="w-full border rounded-md px-3 py-2" value={form.title} onChange={(e) => set("title", e.target.value)} required />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium mb-1">Status</label>
          <select className="w-full border rounded-md px-3 py-2" value={form.status} onChange={(e) => set("status", e.target.value as any)}>
            <option value="DRAFT">Draft</option>
            <option value="ACTIVE">Active</option>
            <option value="SOLD">Sold</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Price</label>
          <input className="w-full border rounded-md px-3 py-2" value={form.price} onChange={(e) => set("price", e.target.value)} placeholder="589000" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium mb-1">Beds</label>
          <input className="w-full border rounded-md px-3 py-2" value={form.beds} onChange={(e) => set("beds", e.target.value)} />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Baths</label>
          <input className="w-full border rounded-md px-3 py-2" value={form.baths} onChange={(e) => set("baths", e.target.value)} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium mb-1">City</label>
          <input className="w-full border rounded-md px-3 py-2" value={form.city} onChange={(e) => set("city", e.target.value)} />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Province</label>
          <input className="w-full border rounded-md px-3 py-2" value={form.province} onChange={(e) => set("province", e.target.value)} />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Address</label>
        <input className="w-full border rounded-md px-3 py-2" value={form.address} onChange={(e) => set("address", e.target.value)} />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Image URL</label>
        <input className="w-full border rounded-md px-3 py-2" value={form.imageUrl} onChange={(e) => set("imageUrl", e.target.value)} />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Description</label>
        <textarea className="w-full border rounded-md px-3 py-2" rows={4} value={form.description} onChange={(e) => set("description", e.target.value)} />
      </div>

      <div className="flex gap-2">
        <button className="rounded-md bg-black text-white px-4 py-2 text-sm" disabled={loading}>
          {loading ? "Saving..." : mode === "create" ? "Create" : "Save"}
        </button>

        {mode === "edit" && (
          <button
            type="button"
            className="rounded-md border px-4 py-2 text-sm"
            onClick={del}
            disabled={loading}
          >
            Delete
          </button>
        )}
      </div>
    </form>
  );
}
