import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const session = (await getServerSession(authOptions)) as any;
  if (!session?.tenantId) return NextResponse.json({ ok: false }, { status: 401 });

  const { id } = await ctx.params;

  // (optional) confirm search belongs to tenant
  const savedSearch = await prisma.savedSearch.findFirst({
    where: { id, tenantId: session.tenantId },
    select: { id: true },
  });
  if (!savedSearch) return NextResponse.json({ ok: false }, { status: 404 });

  // mark all matches seen
  const res = await prisma.savedSearchMatch.updateMany({
    where: { tenantId: session.tenantId, savedSearchId: id, isNew: true },
    data: { isNew: false },
  });

  // ✅ redirect back to the UI with a banner flag
  const url = new URL(`/app/saved-searches/${id}`, req.url);
  url.searchParams.set("seen", "1");
  url.searchParams.set("updated", String(res.count));
  return NextResponse.redirect(url, { status: 303 });
}