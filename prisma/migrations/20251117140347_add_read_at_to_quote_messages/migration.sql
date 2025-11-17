-- AlterTable
ALTER TABLE "_BlogRelatedTours" ADD CONSTRAINT "_BlogRelatedTours_AB_pkey" PRIMARY KEY ("A", "B");

-- DropIndex
DROP INDEX "_BlogRelatedTours_AB_unique";

-- AlterTable
ALTER TABLE "quote_messages" ADD COLUMN     "read_at" TIMESTAMP(3);
