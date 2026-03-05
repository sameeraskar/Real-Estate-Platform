import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const COOKIE_NAME = "rp_attrib";

function parseCookieHeader(cookieHeader: string | null) {
  const out: Record<string, string> = {};
  if (!cookieHeader) return out;

  for (const part of cookieHeader.split(";")) {
    const [k, ...rest] = part.trim().split("=");
    if (!k) continue;
    out[k] = decodeURIComponent(rest.join("=") || "");
  }
  return out;
}

function safeJson(raw: string | undefined) {
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function normalizeEmail(email: string) {
  const e = email?.toLowerCase().trim();
  return e ? e : null;
}

function normalizePhone(phone: string) {
  const p = phone?.replace(/\s+/g, "").trim();
  return p ? p : null;
}

export async function POST(req: Request) {

  const form = await req.formData();

  const tenantSlug = String(form.get("tenantSlug") ?? "");
  const listingId = String(form.get("listingId") ?? "");
  const name = String(form.get("name") ?? "").trim();
  const emailRaw = String(form.get("email") ?? "");
  const phoneRaw = String(form.get("phone") ?? "");
  const message = String(form.get("message") ?? "");

  const email = normalizeEmail(emailRaw);
  const phone = normalizePhone(phoneRaw);

  if (!tenantSlug || !name || !email) {
    return NextResponse.redirect(
      new URL(`/t/${tenantSlug}/listings/${listingId}?error=missing`, req.url),
      { status: 303 }
    );
  }

  const tenant = await prisma.tenant.findUnique({
    where: { slug: tenantSlug },
    select: { id: true },
  });

  if (!tenant) {
    return NextResponse.redirect(
      new URL(`/t/${tenantSlug}?error=tenant`, req.url),
      { status: 303 }
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

  // ✅ read attribution cookie
  const cookieHeader = req.headers.get("cookie");
  const cookies = parseCookieHeader(cookieHeader);
  const attrib = safeJson(cookies[COOKIE_NAME]) ?? {};

  const userAgent = req.headers.get("user-agent") ?? null;

  // ✅ Create/link Contact + create Lead in a transaction
  await prisma.$transaction(async (tx) => {
    // 1) Find existing contact by email or phone (tenant scoped)
    const existingContact =
      email || phone
        ? await tx.contact.findFirst({
            where: {
              tenantId: tenant.id,
              OR: [
                ...(email ? [{ email }] : []),
                ...(phone ? [{ phone }] : []),
              ],
            },
            select: { id: true, fullName: true, email: true, phone: true },
          })
        : null;

    // 2) Create contact if none exists
    let contactId: string | null = existingContact?.id ?? null;

    if (!contactId) {
      const created = await tx.contact.create({
        data: {
          tenantId: tenant.id,
          fullName: name,
          email,
          phone,
        },
        select: { id: true },
      });
      contactId = created.id;
    } else {
      // 3) Optional: fill missing fields on existing contact
      const needsUpdate =
        (!existingContact?.fullName && name) ||
        (!existingContact?.email && email) ||
        (!existingContact?.phone && phone);

      if (needsUpdate) {
        await tx.contact.update({
          where: { id: existingContact!.id },
          data: {
            fullName: existingContact!.fullName ?? name,
            email: existingContact!.email ?? email,
            phone: existingContact!.phone ?? phone,
          },
        });
      }
    }

    // 4) Create lead linked to contact
    await tx.lead.create({
      data: {
        tenantId: tenant.id,
        listingId: safeListingId,
        fullName: name,
        email,
        phone: phone || null,
        message: message || null,
        source: safeListingId ? "listing-form" : "contact-form",

        contactId, // ✅ this is the missing link

        // ✅ attribution fields
        utmSource: attrib.utmSource || null,
        utmMedium: attrib.utmMedium || null,
        utmCampaign: attrib.utmCampaign || null,
        utmContent: attrib.utmContent || null,
        utmTerm: attrib.utmTerm || null,

        gclid: attrib.gclid || null,
        gbraid: attrib.gbraid || null,
        wbraid: attrib.wbraid || null,
        fbclid: attrib.fbclid || null,

        landingPath: attrib.landingPath || null,
        referrer: attrib.referrer || null,
        userAgent,
      },
    });
  });

  // ✅ redirect back to listing page with banner
  if (safeListingId) {
    return NextResponse.redirect(
      new URL(`/t/${tenantSlug}/listings/${safeListingId}?submitted=1`, req.url),
      { status: 303 }
    );
  }

  return NextResponse.redirect(
    new URL(`/t/${tenantSlug}?submitted=1`, req.url),
    { status: 303 }
  );
}