-- Create AdmissionStatus enum
CREATE TYPE "AdmissionStatus" AS ENUM ('OFFERED', 'ACCEPTED', 'DECLINED', 'DEFERRED', 'EXPIRED');

-- Create admissions table
CREATE TABLE "admissions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "application_id" UUID NOT NULL UNIQUE,
    "student_id" UUID NOT NULL,
    "programme_id" UUID NOT NULL,
    "session_id" UUID NOT NULL,
    "status" "AdmissionStatus" NOT NULL DEFAULT 'OFFERED',
    "offer_date" TIMESTAMPTZ(3) NOT NULL,
    "acceptance_deadline" TIMESTAMPTZ(3) NOT NULL,
    "accepted_at" TIMESTAMPTZ(3),
    "deferred_at" TIMESTAMPTZ(3),
    "deferral_end_date" TIMESTAMPTZ(3),
    "declined_at" TIMESTAMPTZ(3),
    "expired_at" TIMESTAMPTZ(3),
    "admission_letter" TEXT,
    "letter_generated_at" TIMESTAMPTZ(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by" TEXT NOT NULL,
    "updated_by" TEXT NOT NULL,
    "status_changed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status_changed_by" TEXT NOT NULL,
    "status_change_reason" TEXT NOT NULL,

    CONSTRAINT "admissions_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "admissions_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "applications"("id") ON DELETE RESTRICT ON UPDATE RESTRICT,
    CONSTRAINT "admissions_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE RESTRICT ON UPDATE RESTRICT,
    CONSTRAINT "admissions_programme_id_fkey" FOREIGN KEY ("programme_id") REFERENCES "programmes"("id") ON DELETE RESTRICT ON UPDATE RESTRICT,
    CONSTRAINT "admissions_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "sessions"("id") ON DELETE RESTRICT ON UPDATE RESTRICT
);

-- Create indexes on admissions
CREATE INDEX "admissions_student_id_idx" ON "admissions"("student_id");
CREATE INDEX "admissions_application_id_idx" ON "admissions"("application_id");
CREATE INDEX "admissions_programme_id_idx" ON "admissions"("programme_id");
CREATE INDEX "admissions_session_id_idx" ON "admissions"("session_id");
CREATE INDEX "admissions_status_idx" ON "admissions"("status");
CREATE INDEX "admissions_offer_date_idx" ON "admissions"("offer_date");
CREATE INDEX "admissions_acceptance_deadline_idx" ON "admissions"("acceptance_deadline");
CREATE INDEX "admissions_accepted_at_idx" ON "admissions"("accepted_at");

-- Create admission_history table
CREATE TABLE "admission_history" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "admission_id" UUID NOT NULL,
    "changed_field" TEXT NOT NULL,
    "previous_value" TEXT,
    "new_value" TEXT,
    "changed_at" TIMESTAMP(3) NOT NULL,
    "changed_by" TEXT NOT NULL,
    "change_reason" TEXT NOT NULL,
    "change_reference" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "admission_history_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "admission_history_admission_id_fkey" FOREIGN KEY ("admission_id") REFERENCES "admissions"("id") ON DELETE RESTRICT ON UPDATE RESTRICT
);

-- Create indexes on admission_history
CREATE INDEX "admission_history_admission_id_changed_at_idx" ON "admission_history"("admission_id", "changed_at");
CREATE INDEX "admission_history_changed_at_idx" ON "admission_history"("changed_at");
