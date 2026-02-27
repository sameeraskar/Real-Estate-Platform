import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { criteriaToListingWhere } from "@/lib/savedSearchCriteria";

export async function POST(req: Request) {
  const session = (await getServerSession(authOptions)) as any;
  if (!session?.tenantId) return NextResponse.json({ ok: false }, { status: 401 });

  const { criteria } = (await req.json()) as { criteria: unknown };

  const listings = await prisma.listing.findMany({
    where: criteriaToListingWhere(session.tenantId, criteria),
    orderBy: [{ featured: "desc" }, { createdAt: "desc" }],
    take: 25,
    select: { id: true, title: true, city: true, province: true, price: true },
  });

  return NextResponse.json({ ok: true, listings });
}