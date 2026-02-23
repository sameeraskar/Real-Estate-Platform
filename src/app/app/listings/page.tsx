import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import ListingRowActions from "@/components/admin/ListingRowActions";


export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function ListingsAdminPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const session = (await getServerSession(authOptions)) as any;
  if (!session?.tenantId) redirect("/login");

  const sp = await searchParams;
  const sort = sp.sort ?? "new"; // new | views | leads

  const listings = await prisma.listing.findMany({
    where: { tenantId: session.tenantId },
    orderBy:
      sort === "views"
        ? { viewCount: "desc" }
        : sort === "leads"
        ? { createdAt: "desc" } // we’ll sort leads in-memory below
        : { createdAt: "desc" },
    take: 200,
    include: {
      _count: { select: { leads: true } },
    },
  });

  // If sorting by leads, do it in-memory using _count.leads
  const sorted =
    sort === "leads"
      ? [...listings].sort((a, b) => b._count.leads - a._count.leads)
      : listings;

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-end justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold">Listings</h1>
          <div className="text-sm text-gray-600">
            Source-of-truth: Pillar9 sync (no manual editing required)
          </div>
        </div>

        <div className="flex gap-2">
          <Link href="/app/settings" className="rounded-md border px-4 py-2 text-sm">
            Sync settings
          </Link>
          <Link
            href="/app/listings?sort=new"
            className={`rounded-md border px-3 py-2 text-sm ${sort === "new" ? "bg-gray-100" : ""}`}
          >
            New
          </Link>
          <Link
            href="/app/listings?sort=views"
            className={`rounded-md border px-3 py-2 text-sm ${sort === "views" ? "bg-gray-100" : ""}`}
          >
            Views
          </Link>
          <Link
            href="/app/listings?sort=leads"
            className={`rounded-md border px-3 py-2 text-sm ${sort === "leads" ? "bg-gray-100" : ""}`}
          >
            Leads
          </Link>
        </div>
      </div>

      <div className="rounded-xl border overflow-hidden bg-white">
      <div className="grid grid-cols-8 gap-2 px-4 py-2 text-sm font-medium border-b">
        <div className="col-span-2">Title</div>
        <div>City</div>
        <div>Price</div>
        <div>Views</div>
        <div>Leads</div>
        <div>Last synced</div>
        <div className="text-right">Actions</div>
      </div>

        {sorted.length === 0 ? (
          <div className="p-4 text-gray-600">No listings yet.</div>
        ) : (
          sorted.map((l) => (
            <div key={l.id} className="grid grid-cols-8 gap-2 px-4 py-3 text-sm border-b items-center">
              <div className="col-span-2 truncate">
                <Link className="underline" href={`/t/demo/listings/${l.id}`}>
                  {l.title}
                </Link>
                <div className="text-xs text-gray-500 truncate">
                  {l.source} • {l.sourceListingKey}
                  {l.isHidden ? " • hidden" : ""}
                  {l.featured ? " • featured" : ""}
                </div>
              </div>

              <div>{l.city ?? "-"}</div>
              <div>{typeof l.price === "number" ? `$${l.price.toLocaleString()}` : "-"}</div>
              <div>{l.viewCount}</div>
              <div>{l._count.leads}</div>

              <div className="text-xs text-gray-600">
                {l.lastSyncedAt ? new Date(l.lastSyncedAt).toLocaleString() : "-"}
              </div>

              <ListingRowActions id={l.id} isHidden={l.isHidden} featured={l.featured} />
            </div>
          ))
        )}
      </div>

      <div className="text-sm text-gray-600">
        Public: <code>/t/demo/listings</code>
      </div>
    </div>
  );
}
