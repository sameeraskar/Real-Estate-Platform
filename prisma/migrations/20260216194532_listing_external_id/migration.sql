/*
  Warnings:

  - A unique constraint covering the columns `[externalId]` on the table `Listing` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Listing" ADD COLUMN "externalId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Listing_externalId_key" ON "Listing"("externalId");
