import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const schema = z.object({
  contactId: z.string().min(1),
  name: z.string().optional(),

  city: z.string().nullable().optional(),

  minPrice: z.number().int().nullable().optional(),
  maxPrice: z.number().int().nullable().optional(),

  minBeds: z.number().int().nullable().optional(),
  maxBeds: z.number().int().nullable().optional(),

  minBaths: z.number().int().nullable().optional(),
  maxBaths: z.number().int().nullable().optional(),

  minSqft: z.number().int().nullable().optional(),
  maxSqft: z.number().int().nullable().optional(),

  propertyType: z.string().nullable().optional(),

  // Flexible bucket:
  // examples: areas: ["Aspen Woods","Kensington"], keywords:["river","garage"], hasGarage:true
  filters: z.record(z.any()).nullable().optional(),
});

export async function POST(req: Request) {
  const session = (await getServerSession(authOptions)) as any;
  if (!session?.tenantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = schema.parse(await req.json());

  const contact = await prisma.contact.findFirst({
    where: { id: body.contactId, tenantId: session.tenantId },
    select: { id: true },
  });

  if (!contact) {
    return NextResponse.json({ error: "Invalid contact" }, { status: 400 });
  }

  const created = await prisma.savedSearch.create({
    data: {
      tenantId: session.tenantId,
      contactId: body.contactId,
      name: body.name ?? null,

      city: body.city ?? null,
      minPrice: body.minPrice ?? null,
      maxPrice: body.maxPrice ?? null,
      minBeds: body.minBeds ?? null,
      maxBeds: body.maxBeds ?? null,
      minBaths: body.minBaths ?? null,
      maxBaths: body.maxBaths ?? null,
      minSqft: body.minSqft ?? null,
      maxSqft: body.maxSqft ?? null,
      propertyType: body.propertyType ?? null,

      filters: body.filters ?? null,
    },
    select: { id: true },
  });

  return NextResponse.json(created);
}
