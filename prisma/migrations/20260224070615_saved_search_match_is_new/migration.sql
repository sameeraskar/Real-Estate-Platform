-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_SavedSearchMatch" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tenantId" TEXT NOT NULL,
    "savedSearchId" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "isNew" BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT "SavedSearchMatch_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "SavedSearchMatch_savedSearchId_fkey" FOREIGN KEY ("savedSearchId") REFERENCES "SavedSearch" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "SavedSearchMatch_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "Listing" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_SavedSearchMatch" ("createdAt", "id", "listingId", "savedSearchId", "tenantId") SELECT "createdAt", "id", "listingId", "savedSearchId", "tenantId" FROM "SavedSearchMatch";
DROP TABLE "SavedSearchMatch";
ALTER TABLE "new_SavedSearchMatch" RENAME TO "SavedSearchMatch";
CREATE INDEX "SavedSearchMatch_tenantId_idx" ON "SavedSearchMatch"("tenantId");
CREATE INDEX "SavedSearchMatch_listingId_idx" ON "SavedSearchMatch"("listingId");
CREATE UNIQUE INDEX "SavedSearchMatch_savedSearchId_listingId_key" ON "SavedSearchMatch"("savedSearchId", "listingId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
