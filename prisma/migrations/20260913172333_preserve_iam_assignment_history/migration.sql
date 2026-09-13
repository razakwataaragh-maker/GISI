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

-- Preserve revoked grant history while allowing only one active grant.
CREATE UNIQUE INDEX "role_permissions_active_role_permission_key"
ON "role_permissions"("role_id", "permission_id")
WHERE "status" = 'ACTIVE';
