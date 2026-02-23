import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const bodySchema = z.object({
  action: z.enum(["toggleHidden", "toggleFeatured"]),
});

export async function POST(
  req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const session = (await getServerSession(authOptions)) as any;
  if (!session?.tenantId) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await ctx.params;
  const { action } = bodySchema.parse(await req.json());

  // Fetch listing scoped to tenant
  const listing = await prisma.listing.findFirst({
    where: { id, tenantId: session.tenantId },
    select: { id: true, isHidden: true, featured: true },
  });

  if (!listing) {
    return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });
  }

  const data =
    action === "toggleHidden"
      ? { isHidden: !listing.isHidden }
      : { featured: !listing.featured };

  await prisma.listing.update({
    where: { id: listing.id },
    data,
  });

  return NextResponse.json({ ok: true, ...data });
}
