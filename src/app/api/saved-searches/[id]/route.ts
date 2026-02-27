import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const schema = z.object({
  name: z.string().min(1),
  criteria: z.any(),
  isActive: z.boolean().optional(),
});

export async function PUT(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const session = (await getServerSession(authOptions)) as any;
  if (!session?.tenantId) return NextResponse.json({ ok: false }, { status: 401 });

  const { id } = await ctx.params;
  const body = schema.parse(await req.json());

  const updated = await prisma.savedSearch.updateMany({
    where: { id, tenantId: session.tenantId },
    data: {
      name: body.name,
      criteria: body.criteria,
      isActive: body.isActive ?? true,
    },
  });

  if (updated.count === 0) return NextResponse.json({ ok: false }, { status: 404 });
  return NextResponse.json({ ok: true });
}