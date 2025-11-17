-- CreateEnum
CREATE TYPE "BankVerificationStatus" AS ENUM ('Pending', 'Approved', 'Rejected');

-- AlterTable
ALTER TABLE "operator_profiles" ADD COLUMN     "bank_verification_document" TEXT,
ADD COLUMN     "bank_verification_notes" TEXT,
ADD COLUMN     "bank_verification_reviewed_at" TIMESTAMP(3),
ADD COLUMN     "bank_verification_reviewed_by" TEXT,
ADD COLUMN     "bank_verification_status" "BankVerificationStatus" DEFAULT 'Pending',
ADD COLUMN     "bank_verification_submitted_at" TIMESTAMP(3);
