import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import RecomputeButton from "@/components/crm/RecomputeButton";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function ContactDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const session = (await getServerSession(authOptions)) as any;
  if (!session?.tenantId) redirect("/login");

  const { id } = await params;
  const sp = await searchParams;

  const createdSearch = sp.createdSearch === "1";

  const contact = await prisma.contact.findFirst({
    where: { id, tenantId: session.tenantId },
    include: {
      leads: {
        orderBy: { createdAt: "desc" },
        take: 50,
        include: {
          listing: { select: { id: true, title: true } },
        },
      },
      savedSearches: {
        orderBy: { updatedAt: "desc" },
        take: 50,
        include: {
          _count: { select: { matches: true } },
        },
      },
    },
  });

  if (!contact) {
    return (
      <div className="p-6 space-y-3">
        <div className="rounded-xl border p-4">Contact not found.</div>
        <Link className="underline text-sm" href="/app/contacts">
          Back to contacts
        </Link>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-5xl">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm text-gray-500">Contact</div>
          <h1 className="text-2xl font-semibold">
            {contact.fullName ?? contact.email ?? contact.phone ?? "Unnamed contact"}
          </h1>
          <div className="text-sm text-gray-600">
            {[contact.email, contact.phone].filter(Boolean).join(" • ")}
          </div>
        </div>

        <div className="flex gap-2">
          <Link className="rounded-md border px-4 py-2 text-sm" href="/app/contacts">
            Back
          </Link>
          <Link
            className="rounded-md bg-black text-white px-4 py-2 text-sm"
            href={`/app/contacts/${contact.id}/searches/new`}
          >
            Create saved search
          </Link>
        </div>
      </div>

      {createdSearch && (
        <div className="rounded-md border border-green-200 bg-green-50 px-4 py-3 text-green-800">
          Saved search created ✅
        </div>
      )}

      {/* Saved Searches */}
      <div className="rounded-xl border overflow-hidden">
        <div className="px-4 py-3 border-b flex items-center justify-between">
          <div className="font-medium">Saved Searches</div>
          <div className="text-sm text-gray-500">
            {contact.savedSearches.length} total
          </div>
        </div>

        {contact.savedSearches.length === 0 ? (
          <div className="p-4 text-gray-600">
            No saved searches yet. Create one to start matching listings automatically.
          </div>
        ) : (
          <div className="divide-y">
            {contact.savedSearches.map((s) => (
              <div key={s.id} className="p-4 flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="font-medium truncate">{s.name}</div>
                  <div className="text-sm text-gray-600 mt-1">
                    {[
                      s.cities ? `Cities: ${s.cities}` : null,
                      s.provinces ? `Prov: ${s.provinces}` : null,
                      s.minPrice != null ? `Min $${s.minPrice.toLocaleString()}` : null,
                      s.maxPrice != null ? `Max $${s.maxPrice.toLocaleString()}` : null,
                      s.minBeds != null ? `Beds ≥ ${s.minBeds}` : null,
                      s.keywords ? `Keywords: ${s.keywords}` : null,
                    ]
                      .filter(Boolean)
                      .join(" • ") || "No filters set"}
                  </div>

                  <div className="text-xs text-gray-500 mt-2">
                    Matches: {s._count.matches} • Updated{" "}
                    {new Date(s.updatedAt).toLocaleString()}
                  </div>
                </div>

                <div className="flex gap-2 shrink-0">
                  <RecomputeButton savedSearchId={s.id} />

                  <Link
                    className="rounded-md border px-3 py-2 text-sm"
                    href={`/app/saved-searches/${s.id}`}
                  >
                    View
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Leads */}
      <div className="rounded-xl border overflow-hidden">
        <div className="px-4 py-3 border-b flex items-center justify-between">
          <div className="font-medium">Leads</div>
          <div className="text-sm text-gray-500">{contact.leads.length} shown</div>
        </div>

        {contact.leads.length === 0 ? (
          <div className="p-4 text-gray-600">No leads for this contact yet.</div>
        ) : (
          <div className="divide-y">
            {contact.leads.map((l) => (
              <div key={l.id} className="p-4 text-sm">
                <div className="text-gray-600">
                  {new Date(l.createdAt).toLocaleString()}
                </div>
                <div className="mt-1">
                  {l.listing ? (
                    <span>
                      Listing:{" "}
                      <Link className="underline" href={`/app/listings/${l.listing.id}/edit`}>
                        {l.listing.title}
                      </Link>
                    </span>
                  ) : (
                    <span>Listing: —</span>
                  )}
                </div>
                {l.message && <div className="mt-2 text-gray-700">{l.message}</div>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}