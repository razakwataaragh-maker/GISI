-- Create SessionStatus enum
CREATE TYPE "SessionStatus" AS ENUM ('DRAFT', 'OPEN', 'CLOSED', 'ARCHIVED');

-- Create sessions table
CREATE TABLE "sessions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "start_date" TIMESTAMPTZ(3) NOT NULL,
    "end_date" TIMESTAMPTZ(3) NOT NULL,
    "application_window_start" TIMESTAMPTZ(3),
    "application_window_end" TIMESTAMPTZ(3),
    "registration_window_start" TIMESTAMPTZ(3),
    "registration_window_end" TIMESTAMPTZ(3),
    "status" "SessionStatus" NOT NULL DEFAULT 'DRAFT',
    "opened_at" TIMESTAMPTZ(3),
    "closed_at" TIMESTAMPTZ(3),
    "archived_at" TIMESTAMPTZ(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by" TEXT NOT NULL,
    "updated_by" TEXT NOT NULL,
    "status_changed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status_changed_by" TEXT NOT NULL,
    "status_change_reason" TEXT NOT NULL,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- Create indexes on sessions
CREATE INDEX "sessions_status_idx" ON "sessions"("status");
CREATE INDEX "sessions_start_date_idx" ON "sessions"("start_date");
CREATE INDEX "sessions_end_date_idx" ON "sessions"("end_date");
CREATE INDEX "sessions_application_window_start_application_window_end_idx" ON "sessions"("application_window_start", "application_window_end");
CREATE INDEX "sessions_registration_window_start_registration_window_end_idx" ON "sessions"("registration_window_start", "registration_window_end");

-- Create session_history table
CREATE TABLE "session_history" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "session_id" UUID NOT NULL,
    "changed_field" TEXT NOT NULL,
    "previous_value" TEXT,
    "new_value" TEXT,
    "changed_at" TIMESTAMP(3) NOT NULL,
    "changed_by" TEXT NOT NULL,
    "change_reason" TEXT NOT NULL,
    "change_reference" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "session_history_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "session_history_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "sessions"("id") ON DELETE RESTRICT ON UPDATE RESTRICT
);

-- Create indexes on session_history
CREATE INDEX "session_history_session_id_changed_at_idx" ON "session_history"("session_id", "changed_at");
CREATE INDEX "session_history_changed_at_idx" ON "session_history"("changed_at");
