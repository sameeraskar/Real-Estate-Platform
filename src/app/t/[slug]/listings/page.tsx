import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function asInt(v: string | undefined) {
  if (!v) return undefined;
  const n = parseInt(v, 10);
  return Number.isFinite(n) ? n : undefined;
}

export default async function PublicListingsPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const { slug } = await params;
  const sp = await searchParams;

  const q = (sp.q ?? "").trim();
  const city = (sp.city ?? "").trim();
  const minPrice = asInt(sp.minPrice);
  const beds = asInt(sp.beds);

  const tenant = await prisma.tenant.findUnique({
    where: { slug },
    select: {
      id: true,
      name: true,
      site: { select: { brandName: true } },
    },
  });

  if (!tenant) return <div className="p-6">Unknown tenant.</div>;

  const listings = await prisma.listing.findMany({
    where: {
      tenantId: tenant.id,
      status: "ACTIVE",
      isHidden: false,

      ...(city ? { city: { contains: city, mode: "insensitive" } } : {}),
      ...(minPrice ? { price: { gte: minPrice } } : {}),
      ...(beds ? { beds: { gte: beds } } : {}),
      ...(q
        ? {
            OR: [
              { title: { contains: q, mode: "insensitive" } },
              { address: { contains: q, mode: "insensitive" } },
              { description: { contains: q, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    orderBy: [{ featured: "desc" }, { createdAt: "desc" }],
    take: 60,
  });

  const brand = tenant.site?.brandName ?? tenant.name;

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold">{brand} — Listings</h1>
          <p className="text-gray-600 mt-1">{listings.length} active listings</p>
        </div>

        <Link href={`/t/${slug}`} className="text-sm underline">
          Back to home
        </Link>
      </div>

      {/* Filters (GET → updates URL) */}
      <form method="GET" className="grid md:grid-cols-4 gap-3 rounded-xl border p-4">
        <input
          name="q"
          defaultValue={q}
          placeholder="Search (title, address, description)…"
          className="w-full border rounded-md px-3 py-2"
        />
        <input
          name="city"
          defaultValue={city}
          placeholder="City (e.g., Calgary)"
          className="w-full border rounded-md px-3 py-2"
        />
        <input
          name="minPrice"
          defaultValue={sp.minPrice ?? ""}
          placeholder="Min price (e.g., 400000)"
          className="w-full border rounded-md px-3 py-2"
          inputMode="numeric"
        />
        <input
          name="beds"
          defaultValue={sp.beds ?? ""}
          placeholder="Min beds (e.g., 3)"
          className="w-full border rounded-md px-3 py-2"
          inputMode="numeric"
        />

        <div className="md:col-span-4 flex gap-2">
          <button className="rounded-md bg-black text-white px-4 py-2 text-sm">
            Apply filters
          </button>

          <Link href={`/t/${slug}/listings`} className="rounded-md border px-4 py-2 text-sm">
            Clear
          </Link>
        </div>
      </form>

      {/* Cards */}
      {listings.length === 0 ? (
        <div className="rounded-xl border p-6 text-gray-600">
          No listings found. Try clearing filters.
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {listings.map((l) => (
            <Link
              key={l.id}
              href={`/t/${slug}/listings/${l.id}`}
              className="rounded-xl overflow-hidden border hover:shadow-md transition block"
            >
              <div className="aspect-[4/3] bg-gray-100">
                {l.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={l.imageUrl}
                    alt={l.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-500">
                    No image
                  </div>
                )}
              </div>

              <div className="p-4 space-y-1">
                <div className="font-semibold">{l.title}</div>

                <div className="text-sm text-gray-600">
                  {[l.city, l.province].filter(Boolean).join(", ") || l.address || ""}
                </div>

                <div className="text-sm">
                  {typeof l.price === "number"
                    ? `$${l.price.toLocaleString()}`
                    : "Price on request"}
                </div>

                <div className="text-xs text-gray-600">
                  {l.beds ?? "-"} bd • {l.baths ?? "-"} ba • {l.sqft ?? "-"} sqft
                </div>

                {l.featured && (
                  <div className="inline-block text-xs mt-2 px-2 py-1 rounded bg-yellow-100">
                    Featured
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
