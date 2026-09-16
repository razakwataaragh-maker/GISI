-- Add rank field to roles table for privilege escalation prevention
ALTER TABLE "roles" ADD COLUMN "rank" INTEGER NOT NULL DEFAULT 0;

-- Add index on rank for performance
CREATE INDEX "roles_rank_idx" ON "roles"("rank");

-- Create bootstrap_control table for controlled system-administrator bootstrap
CREATE TABLE "bootstrap_control" (
    "id" TEXT NOT NULL,
    "consumed_at" TIMESTAMP(3),
    "consumed_by" TEXT,
    "change_reference" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bootstrap_control_pkey" PRIMARY KEY ("id")
);

-- Add Finance Officer restriction trigger
-- This prevents Finance Officer roles from being granted Activation-domain permissions
CREATE OR REPLACE FUNCTION restrict_finance_officer_activation_permissions()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    -- Check if the target role is a Finance Officer role
    -- and the permission being granted is an Activation-domain permission
    IF EXISTS (
        SELECT 1 FROM "roles" 
        WHERE "id" = NEW."role_id" 
        AND "key" = 'finance-officer'
    ) AND (
        NEW."permission_id" LIKE 'activation.%' OR
        NEW."permission_id" LIKE 'student.activate%'
    ) THEN
        RAISE EXCEPTION 'Finance Officer roles cannot be granted Activation-domain permissions';
    END IF;
    
    RETURN NEW;
END;
$$;

CREATE TRIGGER restrict_finance_officer_activation_permissions_trigger
BEFORE INSERT OR UPDATE ON "role_permissions"
FOR EACH ROW
EXECUTE FUNCTION restrict_finance_officer_activation_permissions();
