const fullName = body.fullName?.trim() || null;
const email = body.email?.toLowerCase().trim() || null;
const phone = body.phone?.replace(/\s+/g, "").trim() || null;

const result = await prisma.$transaction(async (tx) => {
  // 1) Find existing contact by email OR phone (tenant-scoped)
  const existingContact =
    email || phone
      ? await tx.contact.findFirst({
          where: {
            tenantId,
            OR: [
              ...(email ? [{ email }] : []),
              ...(phone ? [{ phone }] : []),
            ],
          },
          select: { id: true, fullName: true, email: true, phone: true },
        })
      : null;

  // 2) Create contact if none exists (only if we have at least something)
  let contactId: string | null = existingContact?.id ?? null;

  if (!contactId && (fullName || email || phone)) {
    const created = await tx.contact.create({
      data: {
        tenantId,
        fullName,
        email,
        phone,
      },
      select: { id: true },
    });
    contactId = created.id;
  }

  // 3) If we found an existing contact, optionally “fill in blanks”
  // (this prevents losing lead data when contact was missing pieces)
  if (existingContact?.id) {
    const needsUpdate =
      (!existingContact.fullName && fullName) ||
      (!existingContact.email && email) ||
      (!existingContact.phone && phone);

    if (needsUpdate) {
      await tx.contact.update({
        where: { id: existingContact.id },
        data: {
          fullName: existingContact.fullName ?? fullName,
          email: existingContact.email ?? email,
          phone: existingContact.phone ?? phone,
        },
      });
    }
  }

  // 4) Create the lead linked to contactId
  const lead = await tx.lead.create({
    data: {
      tenantId,
      fullName,
      email,
      phone,
      message: body.message ?? null,
      source: body.source ?? null,
      listingId: body.listingId ?? null,

      contactId, // ✅ THIS is what you’re missing today

      // Keep your attribution fields too:
      utmSource: body.utmSource ?? null,
      utmMedium: body.utmMedium ?? null,
      utmCampaign: body.utmCampaign ?? null,
      utmContent: body.utmContent ?? null,
      utmTerm: body.utmTerm ?? null,
      gclid: body.gclid ?? null,
      gbraid: body.gbraid ?? null,
      wbraid: body.wbraid ?? null,
      fbclid: body.fbclid ?? null,
      landingPath: body.landingPath ?? null,
      referrer: body.referrer ?? null,
      userAgent: body.userAgent ?? null,
    },
    select: { id: true, contactId: true },
  });

  return lead;
});

// result.contactId should now be non-null (unless no name/email/phone provided)