import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function parseList(s: string | null | undefined): string[] {
  if (!s) return [];
  return s
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);
}

export async function POST(
  req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const session = (await getServerSession(authOptions)) as any;
  if (!session?.tenantId) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await ctx.params;

  const search = await prisma.savedSearch.findFirst({
    where: { id, tenantId: session.tenantId, isActive: true },
  });

  if (!search) {
    return NextResponse.json({ ok: false, error: "Saved search not found" }, { status: 404 });
  }

  const cities = parseList(search.cities);
  const provinces = parseList(search.provinces);
  const types = parseList(search.propertyTypes);

  // Fetch candidate listings (tenant + visible + active)
  const listings = await prisma.listing.findMany({
    where: {
      tenantId: session.tenantId,
      status: "ACTIVE",
      isHidden: false,
      ...(cities.length ? { city: { in: cities } } : {}),
      ...(provinces.length ? { province: { in: provinces } } : {}),
      ...(search.minPrice != null ? { price: { gte: search.minPrice } } : {}),
      ...(search.maxPrice != null ? { price: { lte: search.maxPrice } } : {}),
      ...(search.minBeds != null ? { beds: { gte: search.minBeds } } : {}),
      ...(search.maxBeds != null ? { beds: { lte: search.maxBeds } } : {}),
      ...(search.minBaths != null ? { baths: { gte: search.minBaths } } : {}),
      ...(search.maxBaths != null ? { baths: { lte: search.maxBaths } } : {}),
      ...(search.minSqft != null ? { sqft: { gte: search.minSqft } } : {}),
      ...(search.maxSqft != null ? { sqft: { lte: search.maxSqft } } : {}),
    },
    select: {
      id: true,
      title: true,
      address: true,
      description: true,
    },
    take: 1000,
  });

  // Keywords / propertyTypes MVP: text match (types just treated as keywords for now)
  const keywordBag = [
    ...(search.keywords ? [search.keywords] : []),
    ...(types.length ? types : []),
  ]
    .join(" ")
    .trim()
    .toLowerCase();

  const filtered = !keywordBag
    ? listings
    : listings.filter((l) => {
        const hay = `${l.title ?? ""} ${l.address ?? ""} ${l.description ?? ""}`.toLowerCase();
        // every token must appear? (stricter). you can change to "some token" if you want
        const tokens = keywordBag.split(/\s+/).filter(Boolean);
        return tokens.every((t) => hay.includes(t));
      });

  // Upsert matches (unique savedSearchId+listingId prevents dupes)
  let created = 0;
  for (const l of filtered) {
    const m = await prisma.savedSearchMatch.upsert({
      where: { savedSearchId_listingId: { savedSearchId: search.id, listingId: l.id } },
      update: {}, // already exists
      create: {
        tenantId: session.tenantId,
        savedSearchId: search.id,
        listingId: l.id,
      },
    });
    if (m) created++;
  }

  const count = await prisma.savedSearchMatch.count({
    where: { tenantId: session.tenantId, savedSearchId: search.id },
  });

  return NextResponse.json({ ok: true, totalMatches: count });
}
