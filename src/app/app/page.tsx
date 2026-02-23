import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function pct(leads: number, views: number) {
  if (!views) return "0.0%";
  return `${((leads / views) * 100).toFixed(1)}%`;
}

export default async function AppHomePage() {
  const session = (await getServerSession(authOptions)) as any;
  if (!session?.tenantId) redirect("/login");

  const tenantId = session.tenantId as string;

  const [activeListings, totals, recentLeads, topListings] = await Promise.all([
    prisma.listing.count({
      where: { tenantId, status: "ACTIVE" },
    }),

    prisma.listing.aggregate({
      where: { tenantId },
      _sum: { viewCount: true },
    }),

    prisma.lead.findMany({
      where: { tenantId },
      orderBy: { createdAt: "desc" },
      take: 10,
      include: { listing: { select: { id: true, title: true } } },
    }),

    prisma.listing.findMany({
      where: { tenantId },
      orderBy: { viewCount: "desc" },
      take: 5,
      include: { _count: { select: { leads: true } } },
    }),
  ]);

  const totalViews = totals._sum.viewCount ?? 0;

  const totalLeads = await prisma.lead.count({
    where: { tenantId },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold">Dashboard</h1>
          <p className="text-sm text-gray-600 mt-1">
            Quick snapshot of your performance
          </p>
        </div>

        <div className="flex gap-2">
          <Link
            href="/app/listings/new"
            className="rounded-md bg-black text-white px-4 py-2 text-sm"
          >
            New listing
          </Link>
          <Link
            href="/app/leads"
            className="rounded-md border px-4 py-2 text-sm"
          >
            View leads
          </Link>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border bg-white p-4">
          <div className="text-xs text-gray-500">Active listings</div>
          <div className="text-2xl font-semibold mt-1">{activeListings}</div>
        </div>

        <div className="rounded-xl border bg-white p-4">
          <div className="text-xs text-gray-500">Total views</div>
          <div className="text-2xl font-semibold mt-1">{totalViews}</div>
        </div>

        <div className="rounded-xl border bg-white p-4">
          <div className="text-xs text-gray-500">Total leads</div>
          <div className="text-2xl font-semibold mt-1">{totalLeads}</div>
        </div>

        <div className="rounded-xl border bg-white p-4">
          <div className="text-xs text-gray-500">Conversion rate</div>
          <div className="text-2xl font-semibold mt-1">
            {pct(totalLeads, totalViews)}
          </div>
        </div>
      </div>

      {/* Lists */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent leads */}
        <div className="rounded-xl border bg-white overflow-hidden">
          <div className="px-4 py-3 border-b flex items-center justify-between">
            <div className="font-medium">Recent leads</div>
            <Link href="/app/leads" className="text-sm underline">
              All leads
            </Link>
          </div>

          {recentLeads.length === 0 ? (
            <div className="p-4 text-gray-600">No leads yet.</div>
          ) : (
            <div className="divide-y">
              {recentLeads.map((l) => (
                <div key={l.id} className="px-4 py-3 text-sm">
                  <div className="flex items-center justify-between gap-3">
                    <div className="font-medium truncate">
                      {l.fullName ?? "Unnamed lead"}
                    </div>
                    <div className="text-xs text-gray-500">
                      {new Date(l.createdAt).toLocaleDateString()}
                    </div>
                  </div>

                  <div className="text-gray-600 truncate">
                    {l.email ?? "-"} {l.phone ? `• ${l.phone}` : ""}
                  </div>

                  <div className="text-xs text-gray-500 mt-1 truncate">
                    Listing: {l.listing?.title ?? "—"}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top listings */}
        <div className="rounded-xl border bg-white overflow-hidden">
          <div className="px-4 py-3 border-b flex items-center justify-between">
            <div className="font-medium">Top listings</div>
            <Link href="/app/listings" className="text-sm underline">
              All listings
            </Link>
          </div>

          {topListings.length === 0 ? (
            <div className="p-4 text-gray-600">No listings yet.</div>
          ) : (
            <div className="divide-y">
              {topListings.map((l) => (
                <div key={l.id} className="px-4 py-3 text-sm">
                  <div className="flex items-center justify-between gap-3">
                    <Link
                      href={`/app/listings/${l.id}/edit`}
                      className="font-medium underline truncate"
                    >
                      {l.title}
                    </Link>
                    <div className="text-xs text-gray-500">
                      Views: <b>{l.viewCount}</b> • Leads: <b>{l._count.leads}</b>
                    </div>
                  </div>

                  <div className="text-gray-600 truncate">
                    {l.city ?? "-"} •{" "}
                    {typeof l.price === "number"
                      ? `$${l.price.toLocaleString()}`
                      : "-"}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
