"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type ContactOption = { id: string; fullName: string | null; email: string | null };

export default function SavedSearchForm(props: {
  mode: "create" | "edit";
  initial?: {
    id: string;
    name: string;
    isActive: boolean;
    criteria: any;
    contactId: string;
  };
  contacts: ContactOption[];
}) {
  const router = useRouter();

  const [contactId, setContactId] = useState(props.initial?.contactId ?? (props.contacts[0]?.id ?? ""));
  const [name, setName] = useState(props.initial?.name ?? "New Search");
  const [isActive, setIsActive] = useState(props.initial?.isActive ?? true);

  // Criteria fields (extensible)
  const [keywords, setKeywords] = useState<string>(props.initial?.criteria?.keywords ?? "");
  const [city, setCity] = useState<string>(props.initial?.criteria?.city ?? "");
  const [province, setProvince] = useState<string>(props.initial?.criteria?.province ?? "");
  const [minPrice, setMinPrice] = useState<string>(props.initial?.criteria?.minPrice?.toString?.() ?? "");
  const [maxPrice, setMaxPrice] = useState<string>(props.initial?.criteria?.maxPrice?.toString?.() ?? "");
  const [minBeds, setMinBeds] = useState<string>(props.initial?.criteria?.minBeds?.toString?.() ?? "");
  const [maxBeds, setMaxBeds] = useState<string>(props.initial?.criteria?.maxBeds?.toString?.() ?? "");
  const [minBaths, setMinBaths] = useState<string>(props.initial?.criteria?.minBaths?.toString?.() ?? "");
  const [maxBaths, setMaxBaths] = useState<string>(props.initial?.criteria?.maxBaths?.toString?.() ?? "");
  const [minSqft, setMinSqft] = useState<string>(props.initial?.criteria?.minSqft?.toString?.() ?? "");
  const [maxSqft, setMaxSqft] = useState<string>(props.initial?.criteria?.maxSqft?.toString?.() ?? "");
  const [hasPhotos, setHasPhotos] = useState<boolean>(props.initial?.criteria?.hasPhotos ?? false);

  const criteria = useMemo(() => {
    const n = (s: string) => (s.trim() === "" ? undefined : Number(s));
    return {
      keywords: keywords.trim() || undefined,
      city: city.trim() || undefined,
      province: province.trim() || undefined,

      minPrice: n(minPrice),
      maxPrice: n(maxPrice),

      minBeds: n(minBeds),
      maxBeds: n(maxBeds),

      minBaths: n(minBaths),
      maxBaths: n(maxBaths),

      minSqft: n(minSqft),
      maxSqft: n(maxSqft),

      hasPhotos: hasPhotos ? true : undefined,
    };
  }, [
    keywords, city, province,
    minPrice, maxPrice,
    minBeds, maxBeds,
    minBaths, maxBaths,
    minSqft, maxSqft,
    hasPhotos
  ]);

  const [preview, setPreview] = useState<any[]>([]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function doPreview() {
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch(`/api/saved-searches/${props.initial?.id ?? "preview"}/preview`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ criteria }),
      });

      // If creating (no id yet), use a tiny hack route name:
      // We'll handle this by allowing preview endpoint to be called with any id,
      // but easiest is: if create-mode, call a dedicated endpoint.
      // For now: if create-mode, call /api/saved-searches/preview instead.
      if (props.mode === "create") {
        const res2 = await fetch(`/api/saved-searches-preview`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ criteria }),
        });
        const data2 = await res2.json();
        if (!res2.ok) throw new Error(data2.error ?? "Preview failed");
        setPreview(data2.listings ?? []);
        return;
      }

      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Preview failed");
      setPreview(data.listings ?? []);
    } catch (e: any) {
      setErr(e?.message ?? "Preview failed");
    } finally {
      setBusy(false);
    }
  }

  async function save() {
    setBusy(true);
    setErr(null);
    try {
      const payload = { contactId, name, isActive, criteria };

      if (props.mode === "create") {
        const res = await fetch("/api/saved-searches", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Create failed");
        router.push(`/app/saved-searches/${data.id}`);
        return;
      }

      const res = await fetch(`/api/saved-searches/${props.initial!.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Update failed");
      router.refresh();
    } catch (e: any) {
      setErr(e?.message ?? "Save failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      {err && <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-red-800">{err}</div>}

      <div className="grid md:grid-cols-2 gap-3 rounded-xl border p-4">
        <div className="md:col-span-2">
          <label className="text-xs text-gray-600">Search name</label>
          <input className="w-full border rounded-md px-3 py-2" value={name} onChange={(e) => setName(e.target.value)} />
        </div>

        <div className="md:col-span-2">
          <label className="text-xs text-gray-600">Contact</label>
          <select className="w-full border rounded-md px-3 py-2" value={contactId} onChange={(e) => setContactId(e.target.value)}>
            {props.contacts.map((c) => (
              <option key={c.id} value={c.id}>
                {(c.fullName ?? "Unnamed") + (c.email ? ` — ${c.email}` : "")}
              </option>
            ))}
          </select>
        </div>

        <div className="md:col-span-2 flex items-center gap-2">
          <input id="active" type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
          <label htmlFor="active" className="text-sm">Active</label>
        </div>

        <div className="md:col-span-2">
          <label className="text-xs text-gray-600">Keywords</label>
          <input className="w-full border rounded-md px-3 py-2" value={keywords} onChange={(e) => setKeywords(e.target.value)} placeholder="e.g. river view, garage" />
        </div>

        <div>
          <label className="text-xs text-gray-600">City</label>
          <input className="w-full border rounded-md px-3 py-2" value={city} onChange={(e) => setCity(e.target.value)} placeholder="Calgary" />
        </div>
        <div>
          <label className="text-xs text-gray-600">Province</label>
          <input className="w-full border rounded-md px-3 py-2" value={province} onChange={(e) => setProvince(e.target.value)} placeholder="AB" />
        </div>

        <div>
          <label className="text-xs text-gray-600">Min price</label>
          <input className="w-full border rounded-md px-3 py-2" value={minPrice} onChange={(e) => setMinPrice(e.target.value)} inputMode="numeric" />
        </div>
        <div>
          <label className="text-xs text-gray-600">Max price</label>
          <input className="w-full border rounded-md px-3 py-2" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} inputMode="numeric" />
        </div>

        <div>
          <label className="text-xs text-gray-600">Min beds</label>
          <input className="w-full border rounded-md px-3 py-2" value={minBeds} onChange={(e) => setMinBeds(e.target.value)} inputMode="numeric" />
        </div>
        <div>
          <label className="text-xs text-gray-600">Max beds</label>
          <input className="w-full border rounded-md px-3 py-2" value={maxBeds} onChange={(e) => setMaxBeds(e.target.value)} inputMode="numeric" />
        </div>

        <div>
          <label className="text-xs text-gray-600">Min baths</label>
          <input className="w-full border rounded-md px-3 py-2" value={minBaths} onChange={(e) => setMinBaths(e.target.value)} inputMode="numeric" />
        </div>
        <div>
          <label className="text-xs text-gray-600">Max baths</label>
          <input className="w-full border rounded-md px-3 py-2" value={maxBaths} onChange={(e) => setMaxBaths(e.target.value)} inputMode="numeric" />
        </div>

        <div>
          <label className="text-xs text-gray-600">Min sqft</label>
          <input className="w-full border rounded-md px-3 py-2" value={minSqft} onChange={(e) => setMinSqft(e.target.value)} inputMode="numeric" />
        </div>
        <div>
          <label className="text-xs text-gray-600">Max sqft</label>
          <input className="w-full border rounded-md px-3 py-2" value={maxSqft} onChange={(e) => setMaxSqft(e.target.value)} inputMode="numeric" />
        </div>

        <div className="md:col-span-2 flex items-center gap-2">
          <input id="photos" type="checkbox" checked={hasPhotos} onChange={(e) => setHasPhotos(e.target.checked)} />
          <label htmlFor="photos" className="text-sm">Only listings with photos</label>
        </div>

        <div className="md:col-span-2 flex gap-2">
          <button type="button" onClick={doPreview} disabled={busy} className="rounded-md border px-4 py-2 text-sm">
            {busy ? "…" : "Preview"}
          </button>
          <button type="button" onClick={save} disabled={busy} className="rounded-md bg-black text-white px-4 py-2 text-sm">
            {busy ? "Saving…" : props.mode === "create" ? "Create" : "Save"}
          </button>
        </div>
      </div>

      {preview.length > 0 && (
        <div className="rounded-xl border p-4 space-y-2">
          <div className="text-sm font-medium">Preview results</div>
          <div className="space-y-1 text-sm text-gray-700">
            {preview.map((p: any) => (
              <div key={p.id} className="flex justify-between gap-3">
                <div className="truncate">{p.title}</div>
                <div className="text-gray-500">
                  {[p.city, p.province].filter(Boolean).join(", ")}{" "}
                  {typeof p.price === "number" ? `• $${p.price.toLocaleString()}` : ""}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <details className="rounded-xl border p-4">
        <summary className="cursor-pointer text-sm font-medium">Raw criteria JSON</summary>
        <pre className="mt-3 text-xs overflow-auto bg-gray-50 p-3 rounded">{JSON.stringify(criteria, null, 2)}</pre>
      </details>
    </div>
  );
}