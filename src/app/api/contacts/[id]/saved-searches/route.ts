import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

/**
 * This route supports TWO operations:
 * 1) Update lead status  (existing behavior)
 * 2) Link/Create Contact for lead (new behavior)
 *
 * Body options:
 * - { status: "NEW" | "CONTACTED" | "APPOINTMENT" | "WON" | "LOST" }
 * - { action: "LINK_CONTACT" }
 */

const UpdateStatusSchema = z.object({
  status: z.enum(["NEW", "CONTACTED", "APPOINTMENT", "WON", "LOST"]),
});

const LinkContactSchema = z.object({
  action: z.literal("LINK_CONTACT"),
});

const BodySchema = z.union([UpdateStatusSchema, LinkContactSchema]);

function normalizeEmail(email: string | null | undefined) {
  const e = email?.toLowerCase().trim();
  return e && e.length > 0 ? e : null;
}

function normalizePhone(phone: string | null | undefined) {
  const p = phone?.replace(/\s+/g, "").trim();
  return p && p.length > 0 ? p : null;
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const { id: leadId } = await params;

    const bodyRaw = await req.json().catch(() => ({}));
    const body = BodySchema.parse(bodyRaw);

    // Always tenant-scope lead fetch
    const lead = await prisma.lead.findFirst({
      where: { id: leadId, tenantId: user.tenantId },
      select: {
        id: true,
        tenantId: true,
        status: true,
        contactId: true,
        fullName: true,
        email: true,
        phone: true,
      },
    });

    if (!lead) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    }

    // -------------------------------
    // 1) UPDATE STATUS (existing)
    // -------------------------------
    if ("status" in body) {
      const updated = await prisma.lead.update({
        where: { id: lead.id },
        data: { status: body.status },
        select: { id: true, status: true },
      });

      return NextResponse.json({ lead: updated }, { status: 200 });
    }

    // -------------------------------
    // 2) LINK/CREATE CONTACT (new)
    // -------------------------------
    // If already linked, just return the linked contact
    if (lead.contactId) {
      const contact = await prisma.contact.findFirst({
        where: { id: lead.contactId, tenantId: user.tenantId },
        select: { id: true, fullName: true, email: true, phone: true },
      });

      return NextResponse.json(
        {
          lead: { id: lead.id, contactId: lead.contactId },
          contact,
        },
        { status: 200 }
      );
    }

    const fullName = lead.fullName?.trim() || null;
    const email = normalizeEmail(lead.email);
    const phone = normalizePhone(lead.phone);

    // Find existing contact by email/phone (tenant-scoped)
    const existing = await prisma.contact.findFirst({
      where: {
        tenantId: user.tenantId,
        OR: [
          ...(email ? [{ email }] : []),
          ...(phone ? [{ phone }] : []),
        ],
      },
      select: { id: true },
    });

    const contactId =
      existing?.id ??
      (
        await prisma.contact.create({
          data: {
            tenantId: user.tenantId,
            fullName,
            email,
            phone,
          },
          select: { id: true },
        })
      ).id;

    // Link lead -> contact
    await prisma.lead.update({
      where: { id: lead.id },
      data: { contactId },
      select: { id: true },
    });

    const contact = await prisma.contact.findFirst({
      where: { id: contactId, tenantId: user.tenantId },
      select: { id: true, fullName: true, email: true, phone: true },
    });

    return NextResponse.json(
      {
        lead: { id: lead.id, contactId },
        contact,
      },
      { status: 200 }
    );
  } catch (error) {
    // If requireAuth is updated to throw Response(401), return it
    if (error instanceof Response) return error;

    // If requireAuth still throws Error('Unauthorized')
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Lead status/link-contact error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}