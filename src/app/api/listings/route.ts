import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  title: z.string().min(1).max(120),
  status: z.enum(["ACTIVE", "DRAFT", "SOLD"]).default("DRAFT"),
  address: z.string().optional().default(""),
  city: z.string().optional().default(""),
  province: z.string().optional().default(""),
  postal: z.string().optional().default(""),
  price: z.string().optional().default(""),
  beds: z.string().optional().default(""),
  baths: z.string().optional().default(""),
  sqft: z.string().optional().default(""),
  imageUrl: z.string().optional().default(""),
  description: z.string().optional().default(""),
});

function toIntOrNull(v: string) {
  const n = parseInt(v, 10);
  return Number.isFinite(n) ? n : null;
}

export async function POST(req: Request) {
  const session = (await getServerSession(authOptions)) as any;
  if (!session?.tenantId) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const data = schema.parse(body);

  const listing = await prisma.listing.create({
    data: {
      tenantId: session.tenantId,
      title: data.title,
      status: data.status,
      address: data.address || null,
      city: data.city || null,
      province: data.province || null,
      postal: data.postal || null,
      price: data.price ? toIntOrNull(data.price) : null,
      beds: data.beds ? toIntOrNull(data.beds) : null,
      baths: data.baths ? toIntOrNull(data.baths) : null,
      sqft: data.sqft ? toIntOrNull(data.sqft) : null,
      imageUrl: data.imageUrl || null,
      description: data.description || null,
    },
    select: { id: true },
  });

  return NextResponse.json({ ok: true, id: listing.id });
}
