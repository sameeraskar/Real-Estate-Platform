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

export async function POST(req: Request) {
  const form = await req.formData();

  const tenantSlug = String(form.get("tenantSlug") ?? "");
  const listingId = String(form.get("listingId") ?? "");
  const name = String(form.get("name") ?? "");
  const email = String(form.get("email") ?? "");
  const phone = String(form.get("phone") ?? "");
  const message = String(form.get("message") ?? "");

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
    return NextResponse.redirect(new URL(`/t/${tenantSlug}?error=tenant`, req.url), { status: 303 });
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

  await prisma.lead.create({
    data: {
      tenantId: tenant.id,
      listingId: safeListingId,
      fullName: name,
      email,
      phone: phone || null,
      message: message || null,
      source: safeListingId ? "listing-form" : "contact-form",

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

  // ✅ redirect back to listing page with banner
  if (safeListingId) {
    return NextResponse.redirect(
      new URL(`/t/${tenantSlug}/listings/${safeListingId}?submitted=1`, req.url),
      { status: 303 }
    );
  }

  return NextResponse.redirect(new URL(`/t/${tenantSlug}?submitted=1`, req.url), { status: 303 });
}