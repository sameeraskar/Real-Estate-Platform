-- CreateTable
CREATE TABLE "Lead" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "fullName" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "message" TEXT,
    "source" TEXT,
    "tenantId" TEXT NOT NULL,
    CONSTRAINT "Lead_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
