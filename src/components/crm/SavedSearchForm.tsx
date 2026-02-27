"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  contactId: string;
};

function asInt(v: string): number | null {
  const t = v.trim();
  if (!t) return null;
  const n = parseInt(t, 10);
  return Number.isFinite(n) ? n : null;
}

export default function SavedSearchForm({ contactId }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const [name, setName] = useState("Buyer Search");
  const [cities, setCities] = useState(""); // comma-separated
  const [provinces, setProvinces] = useState("AB"); // comma-separated
  const [keywords, setKeywords] = useState("");
  const [propertyTypes, setPropertyTypes] = useState("");

  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [minBeds, setMinBeds] = useState("");
  const [maxBeds, setMaxBeds] = useState("");
  const [minBaths, setMinBaths] = useState("");
  const [maxBaths, setMaxBaths] = useState("");
  const [minSqft, setMinSqft] = useState("");
  const [maxSqft, setMaxSqft] = useState("");

  const payload = useMemo(() => {
    return {
      name: name.trim(),
      cities: cities.trim() || null,
      provinces: provinces.trim() || null,
      keywords: keywords.trim() || null,
      propertyTypes: propertyTypes.trim() || null,
      minPrice: asInt(minPrice),
      maxPrice: asInt(maxPrice),
      minBeds: asInt(minBeds),
      maxBeds: asInt(maxBeds),
      minBaths: asInt(minBaths),
      maxBaths: asInt(maxBaths),
      minSqft: asInt(minSqft),
      maxSqft: asInt(maxSqft),
      isActive: true,
    };
  }, [
    name,
    cities,
    provinces,
    keywords,
    propertyTypes,
    minPrice,
    maxPrice,
    minBeds,
    maxBeds,
    minBaths,
    maxBaths,
    minSqft,
    maxSqft,
  ]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);

    if (!payload.name) {
      setErr("Name is required.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/contacts/${contactId}/saved-searches`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data?.error || "Failed to create saved search");
      }

      // redirect back to contact detail
      router.push(`/app/contacts/${contactId}?createdSearch=1`);
      router.refresh();
    } catch (e: any) {
      setErr(e?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      {err && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-red-800">
          {err}
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="text-sm font-medium">Search name</label>
          <input
            className="w-full border rounded-md px-3 py-2"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. NW Calgary buyers"
            required
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium">Keywords</label>
          <input
            className="w-full border rounded-md px-3 py-2"
            value={keywords}
            onChange={(e) => setKeywords(e.target.value)}
            placeholder="e.g. river view, garage, renovated"
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium">Cities (comma-separated)</label>
          <input
            className="w-full border rounded-md px-3 py-2"
            value={cities}
            onChange={(e) => setCities(e.target.value)}
            placeholder="Calgary, Airdrie, Cochrane"
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium">Provinces (comma-separated)</label>
          <input
            className="w-full border rounded-md px-3 py-2"
            value={provinces}
            onChange={(e) => setProvinces(e.target.value)}
            placeholder="AB"
          />
        </div>

        <div className="space-y-1 md:col-span-2">
          <label className="text-sm font-medium">Property types (comma-separated)</label>
          <input
            className="w-full border rounded-md px-3 py-2"
            value={propertyTypes}
            onChange={(e) => setPropertyTypes(e.target.value)}
            placeholder="Detached, Condo, Townhouse"
          />
        </div>
      </div>

      <div className="rounded-xl border p-4 space-y-3">
        <div className="font-medium">Numeric filters</div>

        <div className="grid md:grid-cols-4 gap-3">
          <input
            className="border rounded-md px-3 py-2"
            value={minPrice}
            onChange={(e) => setMinPrice(e.target.value)}
            placeholder="Min price"
            inputMode="numeric"
          />
          <input
            className="border rounded-md px-3 py-2"
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
            placeholder="Max price"
            inputMode="numeric"
          />
          <input
            className="border rounded-md px-3 py-2"
            value={minBeds}
            onChange={(e) => setMinBeds(e.target.value)}
            placeholder="Min beds"
            inputMode="numeric"
          />
          <input
            className="border rounded-md px-3 py-2"
            value={maxBeds}
            onChange={(e) => setMaxBeds(e.target.value)}
            placeholder="Max beds"
            inputMode="numeric"
          />

          <input
            className="border rounded-md px-3 py-2"
            value={minBaths}
            onChange={(e) => setMinBaths(e.target.value)}
            placeholder="Min baths"
            inputMode="numeric"
          />
          <input
            className="border rounded-md px-3 py-2"
            value={maxBaths}
            onChange={(e) => setMaxBaths(e.target.value)}
            placeholder="Max baths"
            inputMode="numeric"
          />
          <input
            className="border rounded-md px-3 py-2"
            value={minSqft}
            onChange={(e) => setMinSqft(e.target.value)}
            placeholder="Min sqft"
            inputMode="numeric"
          />
          <input
            className="border rounded-md px-3 py-2"
            value={maxSqft}
            onChange={(e) => setMaxSqft(e.target.value)}
            placeholder="Max sqft"
            inputMode="numeric"
          />
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <button
          type="submit"
          disabled={loading}
          className="rounded-md bg-black text-white px-4 py-2 text-sm disabled:opacity-60"
        >
          {loading ? "Saving..." : "Create saved search"}
        </button>
      </div>
    </form>
  );
}
