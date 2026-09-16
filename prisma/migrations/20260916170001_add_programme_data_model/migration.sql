-- Create ProgrammeStatus enum
CREATE TYPE "ProgrammeStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- Create programmes table
CREATE TABLE "programmes" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "programme_code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "status" "ProgrammeStatus" NOT NULL DEFAULT 'DRAFT',
    "current_version" INTEGER NOT NULL DEFAULT 1,
    "effective_from" TIMESTAMPTZ(3),
    "effective_to" TIMESTAMPTZ(3),
    "published_at" TIMESTAMPTZ(3),
    "archived_at" TIMESTAMPTZ(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by" TEXT NOT NULL,
    "updated_by" TEXT NOT NULL,
    "status_changed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status_changed_by" TEXT NOT NULL,
    "status_change_reason" TEXT NOT NULL,

    CONSTRAINT "programmes_pkey" PRIMARY KEY ("id")
);

-- Create unique index on programme_code
CREATE UNIQUE INDEX "programmes_programme_code_key" ON "programmes"("programme_code");

-- Create indexes on programmes
CREATE INDEX "programmes_status_idx" ON "programmes"("status");
CREATE INDEX "programmes_published_at_idx" ON "programmes"("published_at");
CREATE INDEX "programmes_effective_from_effective_to_idx" ON "programmes"("effective_from", "effective_to");

-- Create programme_versions table
CREATE TABLE "programme_versions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "programme_id" UUID NOT NULL,
    "version_number" INTEGER NOT NULL,
    "programme_code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "effective_from" TIMESTAMPTZ(3),
    "effective_to" TIMESTAMPTZ(3),
    "published_at" TIMESTAMPTZ(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT NOT NULL,

    CONSTRAINT "programme_versions_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "programme_versions_programme_id_fkey" FOREIGN KEY ("programme_id") REFERENCES "programmes"("id") ON DELETE RESTRICT ON UPDATE RESTRICT
);

-- Create unique index on programme_id and version_number
CREATE UNIQUE INDEX "programme_versions_programme_id_version_number_key" ON "programme_versions"("programme_id", "version_number");

-- Create indexes on programme_versions
CREATE INDEX "programme_versions_programme_id_version_number_idx" ON "programme_versions"("programme_id", "version_number");
CREATE INDEX "programme_versions_programme_code_idx" ON "programme_versions"("programme_code");

-- Create programme_history table
CREATE TABLE "programme_history" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "programme_id" UUID NOT NULL,
    "changed_field" TEXT NOT NULL,
    "previous_value" TEXT,
    "new_value" TEXT,
    "changed_at" TIMESTAMP(3) NOT NULL,
    "changed_by" TEXT NOT NULL,
    "change_reason" TEXT NOT NULL,
    "change_reference" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "programme_history_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "programme_history_programme_id_fkey" FOREIGN KEY ("programme_id") REFERENCES "programmes"("id") ON DELETE RESTRICT ON UPDATE RESTRICT
);

-- Create indexes on programme_history
CREATE INDEX "programme_history_programme_id_changed_at_idx" ON "programme_history"("programme_id", "changed_at");
CREATE INDEX "programme_history_changed_at_idx" ON "programme_history"("changed_at");
