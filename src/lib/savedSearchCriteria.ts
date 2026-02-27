import type { Prisma } from "@prisma/client";

export type SavedSearchCriteria = {
  keywords?: string;

  city?: string;
  province?: string;

  minPrice?: number;
  maxPrice?: number;

  minBeds?: number;
  maxBeds?: number;

  minBaths?: number;
  maxBaths?: number;

  minSqft?: number;
  maxSqft?: number;

  hasPhotos?: boolean;
};

function asNum(v: unknown): number | undefined {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string" && v.trim() !== "" && Number.isFinite(Number(v))) return Number(v);
  return undefined;
}

function asBool(v: unknown): boolean | undefined {
  if (typeof v === "boolean") return v;
  if (typeof v === "string") {
    if (v === "true") return true;
    if (v === "false") return false;
  }
  return undefined;
}

function asStr(v: unknown): string | undefined {
  if (typeof v === "string") {
    const s = v.trim();
    return s ? s : undefined;
  }
  return undefined;
}

export function normalizeCriteria(raw: unknown): SavedSearchCriteria {
  const obj = (raw && typeof raw === "object" ? (raw as any) : {}) as any;

  return {
    keywords: asStr(obj.keywords),

    city: asStr(obj.city),
    province: asStr(obj.province),

    minPrice: asNum(obj.minPrice),
    maxPrice: asNum(obj.maxPrice),

    minBeds: asNum(obj.minBeds),
    maxBeds: asNum(obj.maxBeds),

    minBaths: asNum(obj.minBaths),
    maxBaths: asNum(obj.maxBaths),

    minSqft: asNum(obj.minSqft),
    maxSqft: asNum(obj.maxSqft),

    hasPhotos: asBool(obj.hasPhotos),
  };
}

export function criteriaToListingWhere(
  tenantId: string,
  raw: unknown
): Prisma.ListingWhereInput {
  const c = normalizeCriteria(raw);

  const where: Prisma.ListingWhereInput = {
    tenantId,
    status: "ACTIVE",
    isHidden: false,
  };

  if (c.city) where.city = { contains: c.city, mode: "insensitive" };
  if (c.province) where.province = { contains: c.province, mode: "insensitive" };

  if (c.minPrice != null || c.maxPrice != null) {
    where.price = {
      ...(c.minPrice != null ? { gte: Math.floor(c.minPrice) } : {}),
      ...(c.maxPrice != null ? { lte: Math.floor(c.maxPrice) } : {}),
    };
  }

  if (c.minBeds != null || c.maxBeds != null) {
    where.beds = {
      ...(c.minBeds != null ? { gte: Math.floor(c.minBeds) } : {}),
      ...(c.maxBeds != null ? { lte: Math.floor(c.maxBeds) } : {}),
    };
  }

  if (c.minBaths != null || c.maxBaths != null) {
    where.baths = {
      ...(c.minBaths != null ? { gte: Math.floor(c.minBaths) } : {}),
      ...(c.maxBaths != null ? { lte: Math.floor(c.maxBaths) } : {}),
    };
  }

  if (c.minSqft != null || c.maxSqft != null) {
    where.sqft = {
      ...(c.minSqft != null ? { gte: Math.floor(c.minSqft) } : {}),
      ...(c.maxSqft != null ? { lte: Math.floor(c.maxSqft) } : {}),
    };
  }

  if (c.hasPhotos === true) {
    // “has photos” = non-null and non-empty
    where.imageUrl = { not: "" };
  }

  if (c.keywords) {
    where.OR = [
      { title: { contains: c.keywords, mode: "insensitive" } },
      { address: { contains: c.keywords, mode: "insensitive" } },
      { description: { contains: c.keywords, mode: "insensitive" } },
      { city: { contains: c.keywords, mode: "insensitive" } },
      { province: { contains: c.keywords, mode: "insensitive" } },
    ];
  }

  return where;
}