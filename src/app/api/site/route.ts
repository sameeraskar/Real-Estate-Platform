import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  brandName: z.string().min(1).max(100),
  tagline: z.string().max(200).optional().default(""),
  phone: z.string().max(30).optional().default(""),
  email: z.string().max(200).optional().default(""),
  template: z.enum(["default", "modern", "classic", "minimal"]).default("modern"),
});

export async function PUT(req: Request) {
  const session = (await getServerSession(authOptions)) as any;
  if (!session?.tenantId) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const data = schema.parse(body);

  const site = await prisma.site.upsert({
    where: { tenantId: session.tenantId },
    update: {
      brandName: data.brandName,
      tagline: data.tagline || null,
      phone: data.phone || null,
      email: data.email || null,
      template: data.template,
    },
    create: {
      tenantId: session.tenantId,
      brandName: data.brandName,
      tagline: data.tagline || null,
      phone: data.phone || null,
      email: data.email || null,
      template: data.template,
    },
  });

  return NextResponse.json({ ok: true, site });
}
