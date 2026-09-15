-- Add constraint to ensure rank is non-negative
-- Prisma cannot generate CHECK constraints, so this is added manually as per the --create-only exception
ALTER TABLE "roles" ADD CONSTRAINT "roles_rank_non_negative" CHECK ("rank" >= 0);