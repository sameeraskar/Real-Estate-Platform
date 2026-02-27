import type { Prisma } from "@prisma/client";

/**
 * SQLite-safe criteria -> Prisma ListingWhereInput.
 * NOTE: SQLite does NOT support `mode: "insensitive"` in Prisma filters.
 * We use `contains` (LIKE) for "case-insensitive-ish" matching.
 */
export function criteriaToListingWhere(
  tenantId: string,
  criteria: any
): Prisma.ListingWhereInput {
  const c = (criteria ?? {}) as Record<string, any>;

  const toStringArray = (v: any): string[] => {
    if (!v) return [];
    if (Array.isArray(v)) return v.map(String).map((s) => s.trim()).filter(Boolean);
    if (typeof v === "string") {
      return v
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
    }
    return [String(v).trim()].filter(Boolean);
  };

  const toNumber = (v: any): number | undefined => {
    if (v === null || v === undefined || v === "") return undefined;
    const n = typeof v === "number" ? v : parseInt(String(v), 10);
    return Number.isFinite(n) ? n : undefined;
  };

  const q = String(c.q ?? c.keywords ?? "").trim();
  const cities = toStringArray(c.cities ?? c.city);
  const provinces = toStringArray(c.provinces ?? c.province);

  const minPrice = toNumber(c.minPrice);
  const maxPrice = toNumber(c.maxPrice);
  const minBeds = toNumber(c.minBeds);
  const maxBeds = toNumber(c.maxBeds);
  const minBaths = toNumber(c.minBaths);
  const maxBaths = toNumber(c.maxBaths);
  const minSqft = toNumber(c.minSqft);
  const maxSqft = toNumber(c.maxSqft);

  // Base scope
  const where: Prisma.ListingWhereInput = {
    tenantId,
    isHidden: false,
    status: "ACTIVE",
  };

  // City filter (multi)
  if (cities.length > 0) {
    where.AND = [
      ...(where.AND ?? []),
      {
        OR: cities.map((city) => ({
          city: { contains: city }, // SQLite-safe
        })),
      },
    ];
  }

  // Province filter (multi)
  if (provinces.length > 0) {
    where.AND = [
      ...(where.AND ?? []),
      {
        OR: provinces.map((p) => ({
          province: { contains: p }, // SQLite-safe
        })),
      },
    ];
  }

  // Keyword search
  if (q) {
    where.AND = [
      ...(where.AND ?? []),
      {
        OR: [
          { title: { contains: q } },
          { address: { contains: q } },
          { description: { contains: q } },
          { city: { contains: q } },
          { province: { contains: q } },
        ],
      },
    ];
  }

  // Price range
  if (minPrice !== undefined || maxPrice !== undefined) {
    where.AND = [
      ...(where.AND ?? []),
      {
        price: {
          ...(minPrice !== undefined ? { gte: minPrice } : {}),
          ...(maxPrice !== undefined ? { lte: maxPrice } : {}),
        },
      },
    ];
  }

  // Beds range
  if (minBeds !== undefined || maxBeds !== undefined) {
    where.AND = [
      ...(where.AND ?? []),
      {
        beds: {
          ...(minBeds !== undefined ? { gte: minBeds } : {}),
          ...(maxBeds !== undefined ? { lte: maxBeds } : {}),
        },
      },
    ];
  }

  // Baths range
  if (minBaths !== undefined || maxBaths !== undefined) {
    where.AND = [
      ...(where.AND ?? []),
      {
        baths: {
          ...(minBaths !== undefined ? { gte: minBaths } : {}),
          ...(maxBaths !== undefined ? { lte: maxBaths } : {}),
        },
      },
    ];
  }

  // Sqft range
  if (minSqft !== undefined || maxSqft !== undefined) {
    where.AND = [
      ...(where.AND ?? []),
      {
        sqft: {
          ...(minSqft !== undefined ? { gte: minSqft } : {}),
          ...(maxSqft !== undefined ? { lte: maxSqft } : {}),
        },
      },
    ];
  }

  return where;
}