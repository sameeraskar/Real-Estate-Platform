"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type SiteFormData = {
  brandName: string;
  tagline: string;
  phone: string;
  email: string;
  template: "default" | "modern" | "classic" | "minimal";
};

export default function SiteForm({
  initialData,
}: {
  initialData: Partial<SiteFormData>;
}) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [success, setSuccess] = useState(false);

  const [form, setForm] = useState<SiteFormData>({
    brandName: initialData.brandName ?? "",
    tagline: initialData.tagline ?? "",
    phone: initialData.phone ?? "",
    email: initialData.email ?? "",
    template: (initialData.template as any) ?? "modern",
  });

  function update<K extends keyof SiteFormData>(key: K, value: SiteFormData[K]) {
    setForm((p) => ({ ...p, [key]: value }));
    setErrorMsg("");
    setSuccess(false);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg("");
    setSuccess(false);

    try {
      const res = await fetch("/api/site", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok || !data.ok) {
        throw new Error(data?.error || `Failed (${res.status})`);
      }

      setSuccess(true);
      router.refresh();
    } catch (err: any) {
      setErrorMsg(err?.message || "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {errorMsg && <p className="text-sm text-red-700">Error: {errorMsg}</p>}
      {success && <p className="text-sm text-green-700">Saved ✅</p>}

      <div>
        <label className="block text-sm font-medium mb-1">Brand name</label>
        <input
          className="w-full border rounded-md px-3 py-2"
          value={form.brandName}
          onChange={(e) => update("brandName", e.target.value)}
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Tagline</label>
        <textarea
          className="w-full border rounded-md px-3 py-2"
          rows={3}
          value={form.tagline}
          onChange={(e) => update("tagline", e.target.value)}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium mb-1">Phone</label>
          <input
            className="w-full border rounded-md px-3 py-2"
            value={form.phone}
            onChange={(e) => update("phone", e.target.value)}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Email</label>
          <input
            className="w-full border rounded-md px-3 py-2"
            value={form.email}
            onChange={(e) => update("email", e.target.value)}
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Template</label>
        <select
          className="w-full border rounded-md px-3 py-2"
          value={form.template}
          onChange={(e) => update("template", e.target.value as any)}
        >
          <option value="modern">Modern</option>
          <option value="classic">Classic</option>
          <option value="minimal">Minimal</option>
          <option value="default">Default</option>
        </select>
      </div>

      <button
        className="rounded-md bg-black text-white px-4 py-2 text-sm"
        disabled={isLoading}
      >
        {isLoading ? "Saving..." : "Save"}
      </button>
    </form>
  );
}
