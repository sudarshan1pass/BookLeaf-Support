-- CreateEnum
CREATE TYPE "TicketCategory" AS ENUM ('ROYALTY_AND_PAYMENTS', 'ISBN_AND_METADATA_ISSUES', 'PRINTING_AND_QUALITY', 'DISTRIBUTION_AND_AVAILABILITY', 'BOOK_STATUS_AND_PRODUCTION_UPDATES', 'GENERAL_INQUIRY');

-- CreateEnum
CREATE TYPE "TicketPriority" AS ENUM ('CRITICAL', 'HIGH', 'MEDIUM', 'LOW');

-- AlterTable
ALTER TABLE "tickets" ADD COLUMN     "assigned_admin_id" TEXT,
ADD COLUMN     "category" "TicketCategory" NOT NULL DEFAULT 'GENERAL_INQUIRY',
ADD COLUMN     "priority" "TicketPriority" NOT NULL DEFAULT 'MEDIUM';

-- CreateTable
CREATE TABLE "ticket_internal_notes" (
    "id" TEXT NOT NULL,
    "ticket_id" TEXT NOT NULL,
    "admin_id" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ticket_internal_notes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ticket_internal_notes_ticket_id_created_at_idx" ON "ticket_internal_notes"("ticket_id", "created_at");

-- CreateIndex
CREATE INDEX "tickets_category_priority_updated_at_idx" ON "tickets"("category", "priority", "updated_at");

-- CreateIndex
CREATE INDEX "tickets_assigned_admin_id_status_idx" ON "tickets"("assigned_admin_id", "status");

-- AddForeignKey
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_assigned_admin_id_fkey" FOREIGN KEY ("assigned_admin_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ticket_internal_notes" ADD CONSTRAINT "ticket_internal_notes_ticket_id_fkey" FOREIGN KEY ("ticket_id") REFERENCES "tickets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ticket_internal_notes" ADD CONSTRAINT "ticket_internal_notes_admin_id_fkey" FOREIGN KEY ("admin_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
