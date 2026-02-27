import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const schema = z.object({
  contactId: z.string().min(1),
  name: z.string().min(1),
  criteria: z.any(), // stored as Json
  isActive: z.boolean().optional(),
});

export async function POST(req: Request) {
  const session = (await getServerSession(authOptions)) as any;
  if (!session?.tenantId) return NextResponse.json({ ok: false }, { status: 401 });

  const body = schema.parse(await req.json());

  // Ensure contact belongs to tenant
  const contact = await prisma.contact.findFirst({
    where: { id: body.contactId, tenantId: session.tenantId },
    select: { id: true },
  });
  if (!contact) return NextResponse.json({ ok: false, error: "contact" }, { status: 404 });

  const savedSearch = await prisma.savedSearch.create({
    data: {
      tenantId: session.tenantId,
      contactId: body.contactId,
      name: body.name,
      criteria: body.criteria,
      isActive: body.isActive ?? true,
    },
    select: { id: true },
  });

  return NextResponse.json({ ok: true, id: savedSearch.id });
}