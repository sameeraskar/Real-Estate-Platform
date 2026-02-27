import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const bodySchema = z.object({
  name: z.string().min(1),

  // allow either string, null, or missing
  cities: z.string().nullable().optional(),
  provinces: z.string().nullable().optional(),
  keywords: z.string().nullable().optional(),
  propertyTypes: z.string().nullable().optional(),

  minPrice: z.number().int().nullable().optional(),
  maxPrice: z.number().int().nullable().optional(),
  minBeds: z.number().int().nullable().optional(),
  maxBeds: z.number().int().nullable().optional(),
  minBaths: z.number().int().nullable().optional(),
  maxBaths: z.number().int().nullable().optional(),
  minSqft: z.number().int().nullable().optional(),
  maxSqft: z.number().int().nullable().optional(),

  isActive: z.boolean().optional().default(true),
});

function cleanStr(v: string | null | undefined) {
  const s = (v ?? "").trim();
  return s.length ? s : undefined;
}

function cleanInt(v: number | null | undefined) {
  if (v === null || v === undefined) return undefined;
  return Number.isFinite(v) ? v : undefined;
}

export async function POST(
  req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const session = (await getServerSession(authOptions)) as any;
  if (!session?.tenantId) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const { id: contactId } = await ctx.params;

  const parsed = bodySchema.parse(await req.json());

  // Ensure contact belongs to tenant
  const contact = await prisma.contact.findFirst({
    where: { id: contactId, tenantId: session.tenantId },
    select: { id: true },
  });

  if (!contact) {
    return NextResponse.json({ ok: false, error: "Contact not found" }, { status: 404 });
  }

  // Build criteria JSON (only include fields that actually have values)
  const criteria = {
    cities: cleanStr(parsed.cities),
    provinces: cleanStr(parsed.provinces),
    keywords: cleanStr(parsed.keywords),
    propertyTypes: cleanStr(parsed.propertyTypes),

    minPrice: cleanInt(parsed.minPrice),
    maxPrice: cleanInt(parsed.maxPrice),
    minBeds: cleanInt(parsed.minBeds),
    maxBeds: cleanInt(parsed.maxBeds),
    minBaths: cleanInt(parsed.minBaths),
    maxBaths: cleanInt(parsed.maxBaths),
    minSqft: cleanInt(parsed.minSqft),
    maxSqft: cleanInt(parsed.maxSqft),
  };

  const savedSearch = await prisma.savedSearch.create({
    data: {
      tenantId: session.tenantId,
      contactId,
      name: parsed.name,
      criteria,               // ✅ required Json field
      isActive: parsed.isActive ?? true,
    },
    select: { id: true },
  });

  // Send user back to contact page (or wherever you want)
  return NextResponse.json({ ok: true, id: savedSearch.id });
}