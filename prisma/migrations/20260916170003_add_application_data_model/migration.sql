-- Create ApplicationStatus enum
CREATE TYPE "ApplicationStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'INFORMATION_REQUESTED', 'APPROVED', 'REJECTED');

-- Create applications table
CREATE TABLE "applications" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "student_id" UUID NOT NULL,
    "programme_id" UUID NOT NULL,
    "session_id" UUID NOT NULL,
    "status" "ApplicationStatus" NOT NULL DEFAULT 'DRAFT',
    "personal_statement" TEXT,
    "academic_history" TEXT,
    "submitted_at" TIMESTAMPTZ(3),
    "decision_date" TIMESTAMPTZ(3),
    "decision_reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by" TEXT NOT NULL,
    "updated_by" TEXT NOT NULL,
    "status_changed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status_changed_by" TEXT NOT NULL,
    "status_change_reason" TEXT NOT NULL,

    CONSTRAINT "applications_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "applications_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE RESTRICT ON UPDATE RESTRICT,
    CONSTRAINT "applications_programme_id_fkey" FOREIGN KEY ("programme_id") REFERENCES "programmes"("id") ON DELETE RESTRICT ON UPDATE RESTRICT,
    CONSTRAINT "applications_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "sessions"("id") ON DELETE RESTRICT ON UPDATE RESTRICT
);

-- Create indexes on applications
CREATE INDEX "applications_student_id_idx" ON "applications"("student_id");
CREATE INDEX "applications_programme_id_idx" ON "applications"("programme_id");
CREATE INDEX "applications_session_id_idx" ON "applications"("session_id");
CREATE INDEX "applications_status_idx" ON "applications"("status");
CREATE INDEX "applications_submitted_at_idx" ON "applications"("submitted_at");
CREATE INDEX "applications_decision_date_idx" ON "applications"("decision_date");

-- Create application_history table
CREATE TABLE "application_history" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "application_id" UUID NOT NULL,
    "changed_field" TEXT NOT NULL,
    "previous_value" TEXT,
    "new_value" TEXT,
    "changed_at" TIMESTAMP(3) NOT NULL,
    "changed_by" TEXT NOT NULL,
    "change_reason" TEXT NOT NULL,
    "change_reference" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "application_history_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "application_history_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "applications"("id") ON DELETE RESTRICT ON UPDATE RESTRICT
);

-- Create indexes on application_history
CREATE INDEX "application_history_application_id_changed_at_idx" ON "application_history"("application_id", "changed_at");
CREATE INDEX "application_history_changed_at_idx" ON "application_history"("changed_at");

-- Create application_documents table
CREATE TABLE "application_documents" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "application_id" UUID NOT NULL,
    "document_type" TEXT NOT NULL,
    "file_name" TEXT NOT NULL,
    "storage_path" TEXT NOT NULL,
    "file_size" INTEGER NOT NULL,
    "mime_type" TEXT NOT NULL,
    "uploaded_at" TIMESTAMPTZ(3) NOT NULL,
    "uploaded_by" TEXT NOT NULL,
    "upload_reason" TEXT,
    "change_reference" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "application_documents_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "application_documents_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "applications"("id") ON DELETE RESTRICT ON UPDATE RESTRICT
);

-- Create indexes on application_documents
CREATE INDEX "application_documents_application_id_document_type_idx" ON "application_documents"("application_id", "document_type");
CREATE INDEX "application_documents_uploaded_at_idx" ON "application_documents"("uploaded_at");
