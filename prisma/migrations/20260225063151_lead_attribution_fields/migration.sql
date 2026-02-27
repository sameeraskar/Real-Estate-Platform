-- DropIndex
DROP INDEX "Lead_contactId_idx";

-- DropIndex
DROP INDEX "Lead_listingId_idx";

-- DropIndex
DROP INDEX "Lead_tenantId_idx";

-- AlterTable
ALTER TABLE "Lead" ADD COLUMN "gbraid" TEXT;
ALTER TABLE "Lead" ADD COLUMN "wbraid" TEXT;
