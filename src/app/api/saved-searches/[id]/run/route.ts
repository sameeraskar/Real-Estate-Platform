import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { criteriaToListingWhere } from "@/lib/search/criteriaToWhere";

export async function POST(
  req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const session = (await getServerSession(authOptions)) as any;
  if (!session?.tenantId) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  const { id } = await ctx.params;

  const savedSearch = await prisma.savedSearch.findFirst({
    where: { id, tenantId: session.tenantId },
    select: { id: true, tenantId: true, criteria: true },
  });

  if (!savedSearch) {
    return NextResponse.redirect(new URL(`/app/saved-searches`, req.url));
  }

  const now = new Date();

  // 1) Build where clause from criteria JSON
  const where = criteriaToListingWhere(session.tenantId, savedSearch.criteria);

  // 2) Find matching listings (limit for MVP)
  const listingRows = await prisma.listing.findMany({
    where,
    select: { id: true },
    orderBy: { createdAt: "desc" },
    take: 500,
  });

  // 3) Insert matches (dedupe via @@unique)
  let inserted = 0;
  for (const row of listingRows) {
    try {
      await prisma.savedSearchMatch.create({
        data: {
          tenantId: session.tenantId,
          savedSearchId: savedSearch.id,
          listingId: row.id,
          isNew: true, // ✅ new match
        },
      });
      inserted++;
    } catch {
      // ignore duplicates
    }
  }

  // 4) Mark search as run
  await prisma.savedSearch.update({
    where: { id: savedSearch.id },
    data: { lastRunAt: now },
  });

  // 5) Redirect back to detail page with banner params
  const url = new URL(`/app/saved-searches/${savedSearch.id}`, req.url);
  url.searchParams.set("ran", "1");
  url.searchParams.set("inserted", String(inserted));
  url.searchParams.set("scanned", String(listingRows.length));
  return NextResponse.redirect(url, { status: 303 });
}