-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Listing" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "tenantId" TEXT NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'MANUAL',
    "sourceListingKey" TEXT NOT NULL,
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
INSERT INTO "new_Listing" ("address", "baths", "beds", "city", "createdAt", "description", "id", "imageUrl", "isHidden", "lastSyncedAt", "postal", "price", "province", "source", "sourceListingKey", "sqft", "status", "tenantId", "title", "updatedAt", "viewCount") SELECT "address", "baths", "beds", "city", "createdAt", "description", "id", "imageUrl", "isHidden", "lastSyncedAt", "postal", "price", "province", "source", "sourceListingKey", "sqft", "status", "tenantId", "title", "updatedAt", "viewCount" FROM "Listing";
DROP TABLE "Listing";
ALTER TABLE "new_Listing" RENAME TO "Listing";
CREATE UNIQUE INDEX "Listing_tenantId_source_sourceListingKey_key" ON "Listing"("tenantId", "source", "sourceListingKey");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
