import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function normEmail(v: string) {
  return v.trim().toLowerCase();
}

function normPhone(v: string) {
  // super basic normalization: keep digits only
  return v.replace(/[^\d]/g, "");
}

export async function POST(req: Request) {
  const form = await req.formData();

  const tenantSlug = String(form.get("tenantSlug") ?? "").trim();
  const listingId = String(form.get("listingId") ?? "").trim();
  const name = String(form.get("name") ?? "").trim();
  const emailRaw = String(form.get("email") ?? "").trim();
  const phoneRaw = String(form.get("phone") ?? "").trim();
  const messageRaw = String(form.get("message") ?? "").trim();

  const email = emailRaw ? normEmail(emailRaw) : "";
  const phone = phoneRaw ? normPhone(phoneRaw) : "";

  if (!tenantSlug || !name || !email) {
    return NextResponse.json(
      { ok: false, error: "Missing fields" },
      { status: 400 }
    );
  }

  const tenant = await prisma.tenant.findUnique({
    where: { slug: tenantSlug },
    select: { id: true },
  });

  if (!tenant) {
    return NextResponse.json(
      { ok: false, error: "Unknown tenant" },
      { status: 404 }
    );
  }

  // Optional: only attach listingId if it belongs to this tenant
  let safeListingId: string | null = null;
  if (listingId) {
    const listing = await prisma.listing.findFirst({
      where: { id: listingId, tenantId: tenant.id },
      select: { id: true },
    });
    if (listing) safeListingId = listing.id;
  }

  // ✅ Upsert Contact (primary key for CRM)
  // We'll prefer email as the stable identifier; phone is a fallback.
  // NOTE: This assumes you made Contact.email unique per tenant later;
  // for now, we do best-effort via findFirst + update/create.
  const existingContact = await prisma.contact.findFirst({
    where: {
      tenantId: tenant.id,
      OR: [
        ...(email ? [{ email }] : []),
        ...(phone ? [{ phone }] : []),
      ],
    },
    select: { id: true },
  });

  const contact = existingContact
    ? await prisma.contact.update({
        where: { id: existingContact.id },
        data: {
          fullName: name || undefined,
          email: email || undefined,
          phone: phone || undefined,
          updatedAt: new Date(),
        },
        select: { id: true },
      })
    : await prisma.contact.create({
        data: {
          tenantId: tenant.id,
          fullName: name || null,
          email: email || null,
          phone: phone || null,
        },
        select: { id: true },
      });

  // ✅ Create Lead linked to Contact (and optionally Listing)
  await prisma.lead.create({
    data: {
      tenantId: tenant.id,
      fullName: name,
      email,
      phone: phone || null,
      message: messageRaw || null,
      source: "listing-form",
      listingId: safeListingId,
      contactId: contact.id,
    },
  });

  // ✅ Redirect back to listing with a success flag (instead of showing {"ok":true})
  const redirectTo = safeListingId
    ? `/t/${tenantSlug}/listings/${safeListingId}?sent=1`
    : `/t/${tenantSlug}?sent=1`;

  return NextResponse.redirect(new URL(redirectTo, req.url));
}
