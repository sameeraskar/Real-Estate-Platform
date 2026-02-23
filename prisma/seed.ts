import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

  
async function main() {
  const tenant = await prisma.tenant.upsert({
    where: { slug: "demo" },
    update: {},
    create: {
      name: "Demo Realty",
      slug: "demo",
      domains: {
        create: [{ hostname: "demo.localhost", type: "SUBDOMAIN", verified: true }],
      },
      site: {
        create: {
          brandName: "Demo Realty",
          tagline: "Helping you find home.",
          template: "modern",
        },
      },
      
    },
  });

  await prisma.user.upsert({
    where: { email: "demo@demo.com" },
    update: { tenantId: tenant.id },
    create: {
      email: "demo@demo.com",
      name: "Demo User",
      tenantId: tenant.id,
    },
  });

  const demoListings = [
    {
      source: "PILLAR9",
      sourceListingKey: `p9-${tenant.id}-townhome`,
      tenantId: tenant.id,
      title: "Modern Townhome in NW Calgary",
      address: "123 Rocky Ridge Ave NW",
      city: "Calgary",
      province: "AB",
      price: 589000,
      beds: 3,
      baths: 2,
      sqft: 1650,
      imageUrl: "https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=1200&q=80",
      description: "Bright end-unit townhome with open concept living and double garage.",
      status: "ACTIVE",
      lastSyncedAt: new Date(),
    },
    {
      source: "PILLAR9",
      sourceListingKey: `p9-${tenant.id}-condo`,
      tenantId: tenant.id,
      title: "Downtown Condo with River Views",
      address: "909 5 St SW #1204",
      city: "Calgary",
      province: "AB",
      price: 399000,
      beds: 2,
      baths: 2,
      sqft: 980,
      imageUrl: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=1200&q=80",
      description: "Walkable lifestyle, floor-to-ceiling windows, and modern finishes.",
      status: "ACTIVE",
      lastSyncedAt: new Date(),
    },
    {
      source: "PILLAR9",
      sourceListingKey: `p9-${tenant.id}-aspen`,
      tenantId: tenant.id,
      title: "Luxury Detached in Aspen Woods",
      address: "77 Aspen Summit Manor SW",
      city: "Calgary",
      province: "AB",
      price: 1349000,
      beds: 5,
      baths: 4,
      sqft: 3450,
      imageUrl: "https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=1200&q=80",
      description: "Elegant home with chef’s kitchen, finished basement, and private yard.",
      status: "ACTIVE",
      lastSyncedAt: new Date(),
    },
  ];
  
  for (const listing of demoListings) {
    await prisma.listing.upsert({
      where: {
        listing_source_key_per_tenant: {
          tenantId: listing.tenantId,
          source: listing.source,
          sourceListingKey: listing.sourceListingKey,
        },
      },
      update: {
        // keep in sync
        ...listing,
      },
      create: listing,
    });
  }
  
  
  

  console.log("Seed complete:", { tenant: tenant.slug, user: "demo@demo.com" });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => prisma.$disconnect());
