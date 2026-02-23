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
    CONSTRAINT "Lead_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Lead_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "Listing" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Lead" ("createdAt", "email", "fullName", "id", "listingId", "message", "phone", "source", "tenantId", "updatedAt") SELECT "createdAt", "email", "fullName", "id", "listingId", "message", "phone", "source", "tenantId", "updatedAt" FROM "Lead";
DROP TABLE "Lead";
ALTER TABLE "new_Lead" RENAME TO "Lead";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
