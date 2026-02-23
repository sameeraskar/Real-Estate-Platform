-- CreateTable
CREATE TABLE "Contact" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "tenantId" TEXT NOT NULL,
    "fullName" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "stage" TEXT NOT NULL DEFAULT 'NEW',
    CONSTRAINT "Contact_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SavedSearch" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "tenantId" TEXT NOT NULL,
    "contactId" TEXT NOT NULL,
    "name" TEXT NOT NULL DEFAULT 'Listing Alerts',
    "city" TEXT,
    "minPrice" INTEGER,
    "maxPrice" INTEGER,
    "minBeds" INTEGER,
    "minBaths" INTEGER,
    "channel" TEXT NOT NULL DEFAULT 'EMAIL',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastRunAt" DATETIME,
    CONSTRAINT "SavedSearch_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "SavedSearch_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "Contact" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SavedSearchMatch" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "savedSearchId" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "notifiedAt" DATETIME,
    CONSTRAINT "SavedSearchMatch_savedSearchId_fkey" FOREIGN KEY ("savedSearchId") REFERENCES "SavedSearch" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "SavedSearchMatch_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "Listing" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

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
    "status" TEXT NOT NULL DEFAULT 'NEW',
    "tenantId" TEXT NOT NULL,
    "listingId" TEXT,
    "contactId" TEXT,
    CONSTRAINT "Lead_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Lead_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "Listing" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Lead_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "Contact" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Lead" ("createdAt", "email", "fullName", "id", "listingId", "message", "phone", "source", "status", "tenantId", "updatedAt") SELECT "createdAt", "email", "fullName", "id", "listingId", "message", "phone", "source", "status", "tenantId", "updatedAt" FROM "Lead";
DROP TABLE "Lead";
ALTER TABLE "new_Lead" RENAME TO "Lead";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "Contact_tenantId_idx" ON "Contact"("tenantId");

-- CreateIndex
CREATE INDEX "SavedSearch_tenantId_idx" ON "SavedSearch"("tenantId");

-- CreateIndex
CREATE INDEX "SavedSearch_tenantId_isActive_idx" ON "SavedSearch"("tenantId", "isActive");

-- CreateIndex
CREATE INDEX "SavedSearch_contactId_idx" ON "SavedSearch"("contactId");

-- CreateIndex
CREATE INDEX "SavedSearchMatch_savedSearchId_idx" ON "SavedSearchMatch"("savedSearchId");

-- CreateIndex
CREATE INDEX "SavedSearchMatch_listingId_idx" ON "SavedSearchMatch"("listingId");

-- CreateIndex
CREATE UNIQUE INDEX "SavedSearchMatch_savedSearchId_listingId_key" ON "SavedSearchMatch"("savedSearchId", "listingId");
