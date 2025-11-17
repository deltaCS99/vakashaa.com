/*
  Warnings:

  - You are about to drop the column `paystack_subaccount_code` on the `operator_profiles` table. All the data in the column will be lost.
  - Made the column `business_phone` on table `operator_profiles` required. This step will fail if there are existing NULL values in that column.
  - Made the column `business_whatsapp` on table `operator_profiles` required. This step will fail if there are existing NULL values in that column.

*/
-- CreateEnum
CREATE TYPE "IdDocumentType" AS ENUM ('ID', 'Passport');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "QuoteStatus" ADD VALUE 'Completed';
ALTER TYPE "QuoteStatus" ADD VALUE 'Disputed';
ALTER TYPE "QuoteStatus" ADD VALUE 'Refunded';

-- AlterTable
ALTER TABLE "operator_profiles" DROP COLUMN "paystack_subaccount_code",
ADD COLUMN     "average_rating" DOUBLE PRECISION,
ADD COLUMN     "company_registration_document" TEXT,
ADD COLUMN     "id_document" TEXT,
ADD COLUMN     "id_document_type" "IdDocumentType",
ADD COLUMN     "service_agreement" TEXT,
ADD COLUMN     "service_agreement_signed_at" TIMESTAMP(3),
ADD COLUMN     "total_reviews" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "verification_documents_submitted_at" TIMESTAMP(3),
ALTER COLUMN "business_phone" SET NOT NULL,
ALTER COLUMN "business_whatsapp" SET NOT NULL;

-- AlterTable
ALTER TABLE "quote_requests" ADD COLUMN     "confirmed_tour_date" TIMESTAMP(3),
ADD COLUMN     "confirmed_tour_end_date" TIMESTAMP(3),
ADD COLUMN     "dispute_created_at" TIMESTAMP(3),
ADD COLUMN     "dispute_reason" TEXT,
ADD COLUMN     "dispute_resolved_at" TIMESTAMP(3),
ADD COLUMN     "refund_amount" INTEGER,
ADD COLUMN     "refund_reason" TEXT,
ADD COLUMN     "refunded_at" TIMESTAMP(3),
ADD COLUMN     "tour_completed_at" TIMESTAMP(3),
ADD COLUMN     "tour_completed_by_operator" BOOLEAN DEFAULT false,
ADD COLUMN     "tour_confirmed_at" TIMESTAMP(3),
ADD COLUMN     "tour_confirmed_by_customer" BOOLEAN DEFAULT false;

-- CreateTable
CREATE TABLE "reviews" (
    "id" TEXT NOT NULL,
    "quote_request_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "operator_profile_id" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reviews_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "reviews_quote_request_id_key" ON "reviews"("quote_request_id");

-- CreateIndex
CREATE INDEX "reviews_operator_profile_id_idx" ON "reviews"("operator_profile_id");

-- CreateIndex
CREATE INDEX "reviews_rating_idx" ON "reviews"("rating");

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_quote_request_id_fkey" FOREIGN KEY ("quote_request_id") REFERENCES "quote_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_operator_profile_id_fkey" FOREIGN KEY ("operator_profile_id") REFERENCES "operator_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
