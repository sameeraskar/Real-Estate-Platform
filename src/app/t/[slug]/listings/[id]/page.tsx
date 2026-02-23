import Link from "next/link";
import { prisma } from "@/lib/prisma";
import ViewTracker from "@/components/public/ViewTracker";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function ListingDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string; id: string }>;
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const { slug, id } = await params;
  const sp = await searchParams;

  // ✅ matches the redirect we return from /api/public/leads
  const sent = sp.sent === "1";
  const err = sp.err; // optional (e.g., "missing" | "tenant" | "listing")

  const tenant = await prisma.tenant.findUnique({
    where: { slug },
    select: {
      id: true,
      name: true,
      site: { select: { brandName: true } },
    },
  });

  if (!tenant) return <div className="p-6">Unknown tenant.</div>;

  const listing = await prisma.listing.findFirst({
    where: { id, tenantId: tenant.id, status: "ACTIVE" },
  });

  if (!listing) return <div className="p-6">Listing not found.</div>;

  const brand = tenant.site?.brandName ?? tenant.name;

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      {/* increments viewCount */}
      <ViewTracker listingId={listing.id} />

      <div className="flex items-center justify-between">
        <Link href={`/t/${slug}`} className="text-sm underline">
          Back
        </Link>
        <Link href={`/t/${slug}/listings`} className="text-sm underline">
          All listings
        </Link>
      </div>

      <div className="rounded-2xl border overflow-hidden">
        <div className="aspect-[16/9] bg-gray-100">
          {listing.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={listing.imageUrl}
              alt={listing.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-500">
              No image
            </div>
          )}
        </div>

        <div className="p-6 space-y-3">
          <div className="text-xs text-gray-500">{brand}</div>

          <h1 className="text-2xl font-semibold">{listing.title}</h1>

          <div className="text-gray-600">
            {[listing.address, listing.city, listing.province, listing.postal]
              .filter(Boolean)
              .join(", ")}
          </div>

          <div className="text-lg font-semibold">
            {typeof listing.price === "number"
              ? `$${listing.price.toLocaleString()}`
              : "Price on request"}
          </div>

          <div className="text-sm text-gray-600">
            {listing.beds ?? "-"} bd • {listing.baths ?? "-"} ba •{" "}
            {listing.sqft ?? "-"} sqft
          </div>

          {listing.description && (
            <p className="text-gray-700 leading-relaxed">{listing.description}</p>
          )}
        </div>
      </div>

      {/* Lead form */}
      <div className="rounded-2xl border p-6 space-y-4">
        <h2 className="text-xl font-semibold">Book a viewing / Ask a question</h2>

        {/* ✅ Success banner */}
        {sent && (
          <div className="rounded-md border border-green-200 bg-green-50 px-4 py-3 text-green-800 text-sm">
            Thanks! Your message was sent. We’ll get back to you soon.
          </div>
        )}

        {/* ✅ Error banner (optional support if you later redirect with ?err=...) */}
        {!sent && err && (
          <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-red-800 text-sm">
            Something went wrong ({err}). Please try again.
          </div>
        )}

        <form
          action="/api/public/leads"
          method="POST"
          className="grid md:grid-cols-2 gap-3"
        >
          <input type="hidden" name="tenantSlug" value={slug} />
          <input type="hidden" name="listingId" value={listing.id} />

          <input
            name="name"
            placeholder="Your name"
            className="border rounded-md px-3 py-2"
            required
          />
          <input
            name="email"
            placeholder="Your email"
            className="border rounded-md px-3 py-2"
            required
          />
          <input
            name="phone"
            placeholder="Phone (optional)"
            className="border rounded-md px-3 py-2 md:col-span-2"
          />
          <textarea
            name="message"
            placeholder="Message (optional)"
            className="border rounded-md px-3 py-2 md:col-span-2"
            rows={4}
          />

          <button className="rounded-md bg-black text-white px-4 py-2 text-sm md:col-span-2">
            Send
          </button>
        </form>

        <p className="text-xs text-gray-500">
          This lead will be saved to the CRM and linked to this listing.
        </p>
      </div>
    </div>
  );
}
