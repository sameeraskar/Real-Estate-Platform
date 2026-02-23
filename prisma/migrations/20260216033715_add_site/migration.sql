-- CreateTable
CREATE TABLE "Site" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "tenantId" TEXT NOT NULL,
    "brandName" TEXT NOT NULL DEFAULT 'Demo Realty',
    "tagline" TEXT NOT NULL DEFAULT 'Helping you find home.',
    "primaryColor" TEXT NOT NULL DEFAULT '#111827',
    "logoUrl" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "template" TEXT NOT NULL DEFAULT 'modern',
    CONSTRAINT "Site_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Site_tenantId_key" ON "Site"("tenantId");
