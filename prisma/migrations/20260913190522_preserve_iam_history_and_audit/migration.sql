/*
  Warnings:

  - Added the required column `assignment_reason` to the `role_permissions` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "role_permissions_role_id_permission_id_key";

-- AlterTable
ALTER TABLE "role_permissions" ADD COLUMN     "assignment_reason" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "user_role_assignments" ADD COLUMN     "revocation_reason" TEXT;

-- CreateTable
CREATE TABLE "audit_events" (
    "id" UUID NOT NULL,
    "event_name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "actor_id" TEXT,
    "actor_type" TEXT NOT NULL,
    "target_type" TEXT NOT NULL,
    "target_id" TEXT,
    "action" TEXT NOT NULL,
    "outcome" TEXT NOT NULL,
    "occurred_at" TIMESTAMP(3) NOT NULL,
    "recorded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "correlation_id" TEXT,
    "owning_module" TEXT NOT NULL,
    "source_boundary" TEXT NOT NULL,
    "reason" TEXT,
    "change_reference" TEXT,
    "before_state" JSONB,
    "after_state" JSONB,

    CONSTRAINT "audit_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "audit_events_event_name_occurred_at_idx" ON "audit_events"("event_name", "occurred_at");

-- CreateIndex
CREATE INDEX "audit_events_actor_id_occurred_at_idx" ON "audit_events"("actor_id", "occurred_at");

-- CreateIndex
CREATE INDEX "audit_events_target_type_target_id_occurred_at_idx" ON "audit_events"("target_type", "target_id", "occurred_at");

-- CreateIndex
CREATE INDEX "audit_events_correlation_id_idx" ON "audit_events"("correlation_id");
