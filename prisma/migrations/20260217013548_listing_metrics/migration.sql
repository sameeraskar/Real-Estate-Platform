-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Lead" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "fullName" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "message" TEXT,
    "source" TEXT,
    "tenantId" TEXT NOT NULL,
    "listingId" TEXT,
    CONSTRAINT "Lead_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Lead_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "Listing" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Lead" ("createdAt", "email", "fullName", "id", "message", "phone", "source", "tenantId", "updatedAt") SELECT "createdAt", "email", "fullName", "id", "message", "phone", "source", "tenantId", "updatedAt" FROM "Lead";
DROP TABLE "Lead";
ALTER TABLE "new_Lead" RENAME TO "Lead";
CREATE TABLE "new_Listing" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "tenantId" TEXT NOT NULL,
    "externalId" TEXT,
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
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "Listing_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Listing" ("address", "baths", "beds", "city", "createdAt", "description", "externalId", "id", "imageUrl", "postal", "price", "province", "sqft", "status", "tenantId", "title", "updatedAt") SELECT "address", "baths", "beds", "city", "createdAt", "description", "externalId", "id", "imageUrl", "postal", "price", "province", "sqft", "status", "tenantId", "title", "updatedAt" FROM "Listing";
DROP TABLE "Listing";
ALTER TABLE "new_Listing" RENAME TO "Listing";
CREATE UNIQUE INDEX "Listing_externalId_key" ON "Listing"("externalId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
