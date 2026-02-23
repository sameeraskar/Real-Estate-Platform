-- CreateTable
CREATE TABLE "Listing" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "tenantId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "title" TEXT NOT NULL,
    "address" TEXT,
    "city" TEXT,
    "province" TEXT,
    "postal" TEXT,
    "price" INTEGER,
    "beds" INTEGER,
    "baths" INTEGER,
    "sqft" INTEGER,
    "imageUrl" TEXT,
    "description" TEXT,
    CONSTRAINT "Listing_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
