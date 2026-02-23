"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type ContactOption = { id: string; fullName: string | null; email: string };

export default function NewSearchForm({ contacts }: { contacts: ContactOption[] }) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const [form, setForm] = useState({
    contactId: contacts[0]?.id ?? "",
    city: "",
    minPrice: "",
    minBeds: "",
  });

  function setField(name: string, value: string) {
    setForm((p) => ({ ...p, [name]: value }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);

    const payload = {
      contactId: form.contactId,
      city: form.city.trim() || null,
      minPrice: form.minPrice ? Number(form.minPrice) : null,
      minBeds: form.minBeds ? Number(form.minBeds) : null,
    };

    const res = await fetch("/api/searches", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    setIsLoading(false);

    if (!res.ok) {
      alert("Failed to create search");
      return;
    }

    const data = await res.json();
    router.push(`/app/searches/${data.id}`);
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4 rounded-xl border p-4">
      <div>
        <label className="text-sm font-medium">Contact</label>
        <select
          className="w-full border rounded-md px-3 py-2"
          value={form.contactId}
          onChange={(e) => setField("contactId", e.target.value)}
          required
        >
          {contacts.map((c) => (
            <option key={c.id} value={c.id}>
              {(c.fullName ?? "").trim() || c.email}
            </option>
          ))}
        </select>
      </div>

      <div className="grid md:grid-cols-2 gap-3">
        <div>
          <label className="text-sm font-medium">City</label>
          <input
            className="w-full border rounded-md px-3 py-2"
            value={form.city}
            onChange={(e) => setField("city", e.target.value)}
            placeholder="Calgary"
          />
        </div>

        <div>
          <label className="text-sm font-medium">Min Price</label>
          <input
            className="w-full border rounded-md px-3 py-2"
            value={form.minPrice}
            onChange={(e) => setField("minPrice", e.target.value)}
            placeholder="400000"
            inputMode="numeric"
          />
        </div>

        <div>
          <label className="text-sm font-medium">Min Beds</label>
          <input
            className="w-full border rounded-md px-3 py-2"
            value={form.minBeds}
            onChange={(e) => setField("minBeds", e.target.value)}
            placeholder="3"
            inputMode="numeric"
          />
        </div>
      </div>

      <button
        disabled={isLoading}
        className="rounded-md bg-black text-white px-4 py-2 text-sm disabled:opacity-50"
      >
        {isLoading ? "Creating..." : "Create search"}
      </button>
    </form>
  );
}
