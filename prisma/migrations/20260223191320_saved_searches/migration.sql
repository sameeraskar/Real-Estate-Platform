/*
  Warnings:

  - You are about to drop the column `stage` on the `Contact` table. All the data in the column will be lost.
  - You are about to drop the column `city` on the `SavedSearch` table. All the data in the column will be lost.
  - You are about to drop the column `filters` on the `SavedSearch` table. All the data in the column will be lost.
  - You are about to drop the column `propertyType` on the `SavedSearch` table. All the data in the column will be lost.
  - Made the column `name` on table `SavedSearch` required. This step will fail if there are existing NULL values in that column.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Contact" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "tenantId" TEXT NOT NULL,
    "fullName" TEXT,
    "email" TEXT,
    "phone" TEXT,
    CONSTRAINT "Contact_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Contact" ("createdAt", "email", "fullName", "id", "phone", "tenantId", "updatedAt") SELECT "createdAt", "email", "fullName", "id", "phone", "tenantId", "updatedAt" FROM "Contact";
DROP TABLE "Contact";
ALTER TABLE "new_Contact" RENAME TO "Contact";
CREATE TABLE "new_Listing" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "tenantId" TEXT NOT NULL,
    "source" TEXT,
    "sourceListingKey" TEXT,
    "lastSyncedAt" DATETIME,
    "isHidden" BOOLEAN NOT NULL DEFAULT false,
    "featured" BOOLEAN NOT NULL DEFAULT false,
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
INSERT INTO "new_Listing" ("address", "baths", "beds", "city", "createdAt", "description", "featured", "id", "imageUrl", "isHidden", "lastSyncedAt", "postal", "price", "province", "source", "sourceListingKey", "sqft", "status", "tenantId", "title", "updatedAt", "viewCount") SELECT "address", "baths", "beds", "city", "createdAt", "description", "featured", "id", "imageUrl", "isHidden", "lastSyncedAt", "postal", "price", "province", "source", "sourceListingKey", "sqft", "status", "tenantId", "title", "updatedAt", "viewCount" FROM "Listing";
DROP TABLE "Listing";
ALTER TABLE "new_Listing" RENAME TO "Listing";
CREATE UNIQUE INDEX "Listing_tenantId_source_sourceListingKey_key" ON "Listing"("tenantId", "source", "sourceListingKey");
CREATE TABLE "new_SavedSearch" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "tenantId" TEXT NOT NULL,
    "contactId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "cities" TEXT,
    "provinces" TEXT,
    "minPrice" INTEGER,
    "maxPrice" INTEGER,
    "minBeds" INTEGER,
    "maxBeds" INTEGER,
    "minBaths" INTEGER,
    "maxBaths" INTEGER,
    "minSqft" INTEGER,
    "maxSqft" INTEGER,
    "keywords" TEXT,
    "propertyTypes" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT "SavedSearch_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "SavedSearch_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "Contact" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_SavedSearch" ("contactId", "createdAt", "id", "maxBaths", "maxBeds", "maxPrice", "maxSqft", "minBaths", "minBeds", "minPrice", "minSqft", "name", "tenantId", "updatedAt") SELECT "contactId", "createdAt", "id", "maxBaths", "maxBeds", "maxPrice", "maxSqft", "minBaths", "minBeds", "minPrice", "minSqft", "name", "tenantId", "updatedAt" FROM "SavedSearch";
DROP TABLE "SavedSearch";
ALTER TABLE "new_SavedSearch" RENAME TO "SavedSearch";
CREATE INDEX "SavedSearch_tenantId_idx" ON "SavedSearch"("tenantId");
CREATE INDEX "SavedSearch_contactId_idx" ON "SavedSearch"("contactId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "SavedSearchMatch_tenantId_idx" ON "SavedSearchMatch"("tenantId");

-- CreateIndex
CREATE INDEX "SavedSearchMatch_listingId_idx" ON "SavedSearchMatch"("listingId");
