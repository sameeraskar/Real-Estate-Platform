-- AlterTable
ALTER TABLE "Lead" ADD COLUMN "fbclid" TEXT;
ALTER TABLE "Lead" ADD COLUMN "gclid" TEXT;
ALTER TABLE "Lead" ADD COLUMN "landingPath" TEXT;
ALTER TABLE "Lead" ADD COLUMN "referrer" TEXT;
ALTER TABLE "Lead" ADD COLUMN "userAgent" TEXT;
ALTER TABLE "Lead" ADD COLUMN "utmCampaign" TEXT;
ALTER TABLE "Lead" ADD COLUMN "utmContent" TEXT;
ALTER TABLE "Lead" ADD COLUMN "utmMedium" TEXT;
ALTER TABLE "Lead" ADD COLUMN "utmSource" TEXT;
ALTER TABLE "Lead" ADD COLUMN "utmTerm" TEXT;

-- CreateIndex
CREATE INDEX "Lead_tenantId_idx" ON "Lead"("tenantId");

-- CreateIndex
CREATE INDEX "Lead_listingId_idx" ON "Lead"("listingId");

-- CreateIndex
CREATE INDEX "Lead_contactId_idx" ON "Lead"("contactId");
