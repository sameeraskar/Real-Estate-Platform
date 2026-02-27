import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function SavedSearchDetailPage({
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

  const ran = sp.ran === "1";
  const inserted = sp.inserted ?? "0";
  const scanned = sp.scanned ?? "0";
  const runError = sp.error;

  const savedSearch = await prisma.savedSearch.findFirst({
    where: { id, tenantId: session.tenantId },
    include: {
      contact: { select: { id: true, fullName: true, email: true } },
      matches: {
        orderBy: { createdAt: "desc" },
        take: 80,
        include: {
          listing: {
            select: { id: true, title: true, city: true, province: true, price: true },
          },
        },
      },
      _count: { select: { matches: true } },
    },
  });

  if (!savedSearch) return <div className="p-6">Not found.</div>;

  const newMatches = savedSearch.matches.filter((m) => m.isNew);
  const seenMatches = savedSearch.matches.filter((m) => !m.isNew);

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <div className="text-xs text-gray-500">Saved Search</div>
          <h1 className="text-2xl font-semibold">{savedSearch.name}</h1>

          <div className="text-sm text-gray-600">
            Contact: {savedSearch.contact.fullName ?? savedSearch.contact.email ?? "—"} • Active:{" "}
            {savedSearch.isActive ? "Yes" : "No"} • Total matches: {savedSearch._count.matches}
          </div>

          <div className="text-xs text-gray-500 mt-1">
            Last run: {savedSearch.lastRunAt ? new Date(savedSearch.lastRunAt).toLocaleString() : "Never"}
          </div>
        </div>

        <div className="flex gap-2">
          <Link className="rounded-md border px-4 py-2 text-sm" href="/app/saved-searches">
            Back
          </Link>

          <Link
            className="rounded-md border px-4 py-2 text-sm"
            href={`/app/saved-searches/${savedSearch.id}/edit`}
          >
            Edit
          </Link>

          <form action={`/api/saved-searches/${savedSearch.id}/run`} method="POST">
            <button className="rounded-md bg-black text-white px-4 py-2 text-sm">
              Run search
            </button>
          </form>

          <form action={`/api/saved-searches/${savedSearch.id}/mark-seen`} method="POST">
            <button
              className="rounded-md border px-4 py-2 text-sm"
              disabled={newMatches.length === 0}
              title={newMatches.length === 0 ? "No new matches" : "Mark all new matches as seen"}
            >
              Mark seen
            </button>
          </form>
        </div>
      </div>

      {ran && !runError && (
        <div className="rounded-md border border-green-200 bg-green-50 px-4 py-3 text-green-800">
          Run complete: scanned {scanned} listings, added {inserted} new matches.
        </div>
      )}

      {runError && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-red-800">
          Run failed. Please try again.
        </div>
      )}

      <details className="rounded-xl border p-4">
        <summary className="cursor-pointer text-sm font-medium">Criteria JSON</summary>
        <pre className="mt-3 text-xs overflow-auto bg-gray-50 p-3 rounded">
          {JSON.stringify(savedSearch.criteria, null, 2)}
        </pre>
      </details>

      {/* NEW */}
      <div className="rounded-xl border overflow-hidden">
        <div className="px-4 py-2 text-sm font-medium border-b flex items-center justify-between">
          <span>New matches</span>
          <span className="text-xs text-gray-500">{newMatches.length}</span>
        </div>

        {newMatches.length === 0 ? (
          <div className="p-4 text-gray-600">No new matches. Run the search after syncing listings.</div>
        ) : (
          <div className="divide-y">
            {newMatches.map((m) => (
              <div key={m.id} className="px-4 py-3 text-sm flex justify-between gap-3">
                <div className="truncate">{m.listing.title}</div>
                <div className="text-gray-500">
                  {[m.listing.city, m.listing.province].filter(Boolean).join(", ")}{" "}
                  {typeof m.listing.price === "number" ? `• $${m.listing.price.toLocaleString()}` : ""}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* SEEN */}
      <div className="rounded-xl border overflow-hidden">
        <div className="px-4 py-2 text-sm font-medium border-b flex items-center justify-between">
          <span>Seen (recent)</span>
          <span className="text-xs text-gray-500">{seenMatches.length}</span>
        </div>

        {seenMatches.length === 0 ? (
          <div className="p-4 text-gray-600">No seen matches yet.</div>
        ) : (
          <div className="divide-y">
            {seenMatches.map((m) => (
              <div key={m.id} className="px-4 py-3 text-sm flex justify-between gap-3">
                <div className="truncate">{m.listing.title}</div>
                <div className="text-gray-500">
                  {[m.listing.city, m.listing.province].filter(Boolean).join(", ")}{" "}
                  {typeof m.listing.price === "number" ? `• $${m.listing.price.toLocaleString()}` : ""}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}