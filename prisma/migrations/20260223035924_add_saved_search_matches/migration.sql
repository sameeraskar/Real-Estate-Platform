/*
  Warnings:

  - You are about to drop the column `channel` on the `SavedSearch` table. All the data in the column will be lost.
  - You are about to drop the column `isActive` on the `SavedSearch` table. All the data in the column will be lost.
  - You are about to drop the column `lastRunAt` on the `SavedSearch` table. All the data in the column will be lost.
  - You are about to drop the column `notifiedAt` on the `SavedSearchMatch` table. All the data in the column will be lost.
  - Added the required column `tenantId` to the `SavedSearchMatch` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_SavedSearch" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "tenantId" TEXT NOT NULL,
    "contactId" TEXT NOT NULL,
    "name" TEXT,
    "city" TEXT,
    "minPrice" INTEGER,
    "maxPrice" INTEGER,
    "minBeds" INTEGER,
    "maxBeds" INTEGER,
    "minBaths" INTEGER,
    "maxBaths" INTEGER,
    "minSqft" INTEGER,
    "maxSqft" INTEGER,
    "propertyType" TEXT,
    "filters" JSONB,
    CONSTRAINT "SavedSearch_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "SavedSearch_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "Contact" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_SavedSearch" ("city", "contactId", "createdAt", "id", "maxPrice", "minBaths", "minBeds", "minPrice", "name", "tenantId", "updatedAt") SELECT "city", "contactId", "createdAt", "id", "maxPrice", "minBaths", "minBeds", "minPrice", "name", "tenantId", "updatedAt" FROM "SavedSearch";
DROP TABLE "SavedSearch";
ALTER TABLE "new_SavedSearch" RENAME TO "SavedSearch";
CREATE TABLE "new_SavedSearchMatch" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tenantId" TEXT NOT NULL,
    "savedSearchId" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    CONSTRAINT "SavedSearchMatch_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "SavedSearchMatch_savedSearchId_fkey" FOREIGN KEY ("savedSearchId") REFERENCES "SavedSearch" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "SavedSearchMatch_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "Listing" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_SavedSearchMatch" ("createdAt", "id", "listingId", "savedSearchId") SELECT "createdAt", "id", "listingId", "savedSearchId" FROM "SavedSearchMatch";
DROP TABLE "SavedSearchMatch";
ALTER TABLE "new_SavedSearchMatch" RENAME TO "SavedSearchMatch";
CREATE UNIQUE INDEX "SavedSearchMatch_savedSearchId_listingId_key" ON "SavedSearchMatch"("savedSearchId", "listingId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
