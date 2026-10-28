-- AlterTable
ALTER TABLE "users"
ADD COLUMN "phone" VARCHAR(30),
ADD COLUMN "city" VARCHAR(120);

-- AlterTable
ALTER TABLE "books"
ADD COLUMN "status_label" VARCHAR(80),
ADD COLUMN "publication_date" DATE,
ADD COLUMN "mrp" DECIMAL(10,2),
ADD COLUMN "author_royalty_per_copy" DECIMAL(10,2),
ADD COLUMN "total_copies_sold" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "total_royalty_earned" DECIMAL(12,2) NOT NULL DEFAULT 0,
ADD COLUMN "royalty_paid" DECIMAL(12,2) NOT NULL DEFAULT 0,
ADD COLUMN "royalty_pending" DECIMAL(12,2) NOT NULL DEFAULT 0,
ADD COLUMN "last_royalty_payout_date" DATE,
ADD COLUMN "print_partner" VARCHAR(160),
ADD COLUMN "available_on" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
