import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const listingSchema = z.object({
  key: z.string().min(1), // pretend this is Pillar9 listing key
  status: z.string().optional(),
  title: z.string().min(1),
  address: z.string().optional(),
  city: z.string().optional(),
  province: z.string().optional(),
  postal: z.string().optional(),
  price: z.number().int().optional(),
  beds: z.number().int().optional(),
  baths: z.number().int().optional(),
  sqft: z.number().int().optional(),
  imageUrl: z.string().url().optional(),
  description: z.string().optional(),
});

const bodySchema = z.object({
  listings: z.array(listingSchema).min(1),
});

export async function POST(req: Request) {
  try {
    const session = (await getServerSession(authOptions)) as any;
    if (!session?.tenantId) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const tenantId = session.tenantId as string;

    const body = await req.json();
    const { listings } = bodySchema.parse(body);

    const now = new Date();
    const source = "PILLAR9";

    // Idempotent sync without upsert:
    // 1) updateMany by (tenantId, source, sourceListingKey)
    // 2) if nothing updated, create
    for (const l of listings) {
      const key = l.key.trim(); // normalize key (prevents accidental whitespace dupes)

      const data = {
        lastSyncedAt: now,
        status: l.status ?? "ACTIVE",
        title: l.title,
        address: l.address ?? null,
        city: l.city ?? null,
        province: l.province ?? null,
        postal: l.postal ?? null,
        price: l.price ?? null,
        beds: l.beds ?? null,
        baths: l.baths ?? null,
        sqft: l.sqft ?? null,
        imageUrl: l.imageUrl ?? null,
        description: l.description ?? null,
      };

      const updated = await prisma.listing.updateMany({
        where: {
          tenantId,
          source,
          sourceListingKey: key,
        },
        data,
      });

      if (updated.count === 0) {
        await prisma.listing.create({
          data: {
            tenantId,
            source,
            sourceListingKey: key,
            ...data,
          },
        });
      }
    }

    return NextResponse.json({ ok: true, count: listings.length });
  } catch (err: any) {
    // Zod validation errors
    if (err?.name === "ZodError") {
      return NextResponse.json(
        { ok: false, error: "Invalid payload", details: err.errors },
        { status: 400 }
      );
    }

    console.error("mock pillar9 sync error:", err);
    return NextResponse.json({ ok: false, error: "Server error" }, { status: 500 });
  }
}
