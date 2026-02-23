import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function SearchesPage() {
  const session = (await getServerSession(authOptions)) as any;
  if (!session?.tenantId) redirect("/login");

  const searches = await prisma.savedSearch.findMany({
    where: { tenantId: session.tenantId },
    orderBy: { updatedAt: "desc" },
    take: 200,
    include: {
      contact: { select: { id: true, fullName: true, email: true } },
      _count: { select: { matches: true } },
    },
  });

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Saved Searches</h1>
        <Link
          href="/app/searches/new"
          className="rounded-md bg-black text-white px-4 py-2 text-sm"
        >
          New search
        </Link>
      </div>

      <div className="rounded-xl border overflow-hidden">
        <div className="grid grid-cols-5 gap-2 px-4 py-2 text-sm font-medium border-b">
          <div>Contact</div>
          <div>City</div>
          <div>Min Price</div>
          <div>Min Beds</div>
          <div>Matches</div>
        </div>

        {searches.length === 0 ? (
          <div className="p-4 text-gray-600">No saved searches yet.</div>
        ) : (
          searches.map((s) => (
            <div key={s.id} className="grid grid-cols-5 gap-2 px-4 py-3 text-sm border-b">
              <div className="truncate">
                <Link className="underline" href={`/app/searches/${s.id}`}>
                  {s.contact?.fullName ?? s.contact?.email ?? "Unknown contact"}
                </Link>
              </div>
              <div>{s.city ?? "-"}</div>
              <div>{typeof s.minPrice === "number" ? `$${s.minPrice.toLocaleString()}` : "-"}</div>
              <div>{typeof s.minBeds === "number" ? s.minBeds : "-"}</div>
              <div>{s._count.matches}</div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
