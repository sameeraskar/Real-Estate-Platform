/*
  Warnings:

  - You are about to drop the column `cities` on the `SavedSearch` table. All the data in the column will be lost.
  - You are about to drop the column `keywords` on the `SavedSearch` table. All the data in the column will be lost.
  - You are about to drop the column `maxBaths` on the `SavedSearch` table. All the data in the column will be lost.
  - You are about to drop the column `maxBeds` on the `SavedSearch` table. All the data in the column will be lost.
  - You are about to drop the column `maxPrice` on the `SavedSearch` table. All the data in the column will be lost.
  - You are about to drop the column `maxSqft` on the `SavedSearch` table. All the data in the column will be lost.
  - You are about to drop the column `minBaths` on the `SavedSearch` table. All the data in the column will be lost.
  - You are about to drop the column `minBeds` on the `SavedSearch` table. All the data in the column will be lost.
  - You are about to drop the column `minPrice` on the `SavedSearch` table. All the data in the column will be lost.
  - You are about to drop the column `minSqft` on the `SavedSearch` table. All the data in the column will be lost.
  - You are about to drop the column `propertyTypes` on the `SavedSearch` table. All the data in the column will be lost.
  - You are about to drop the column `provinces` on the `SavedSearch` table. All the data in the column will be lost.
  - Added the required column `criteria` to the `SavedSearch` table without a default value. This is not possible if the table is not empty.

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
    "name" TEXT NOT NULL,
    "criteria" JSONB NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT "SavedSearch_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "SavedSearch_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "Contact" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_SavedSearch" ("contactId", "createdAt", "id", "isActive", "name", "tenantId", "updatedAt") SELECT "contactId", "createdAt", "id", "isActive", "name", "tenantId", "updatedAt" FROM "SavedSearch";
DROP TABLE "SavedSearch";
ALTER TABLE "new_SavedSearch" RENAME TO "SavedSearch";
CREATE INDEX "SavedSearch_tenantId_idx" ON "SavedSearch"("tenantId");
CREATE INDEX "SavedSearch_contactId_idx" ON "SavedSearch"("contactId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
