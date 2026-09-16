-- Create StudentStatus enum
CREATE TYPE "StudentStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED', 'GRADUATED', 'WITHDRAWN');

-- Create students table
CREATE TABLE "students" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "student_number" TEXT NOT NULL,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "date_of_birth" TIMESTAMP(3),
    "gender" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "national_id" TEXT,
    "passport_number" TEXT,
    "address_line1" TEXT,
    "address_line2" TEXT,
    "city" TEXT,
    "state" TEXT,
    "postal_code" TEXT,
    "country" TEXT,
    "emergency_contact_name" TEXT,
    "emergency_contact_phone" TEXT,
    "emergency_contact_relationship" TEXT,
    "status" "StudentStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by" TEXT NOT NULL,
    "updated_by" TEXT NOT NULL,
    "status_changed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status_changed_by" TEXT NOT NULL,
    "status_change_reason" TEXT NOT NULL,

    CONSTRAINT "students_pkey" PRIMARY KEY ("id")
);

-- Create unique index on student_number
CREATE UNIQUE INDEX "students_student_number_key" ON "students"("student_number");

-- Create indexes on students
CREATE INDEX "students_status_idx" ON "students"("status");
CREATE INDEX "students_last_name_first_name_idx" ON "students"("last_name", "first_name");

-- Create student_status_history table
CREATE TABLE "student_status_history" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "student_id" UUID NOT NULL,
    "previous_status" "StudentStatus" NOT NULL,
    "new_status" "StudentStatus" NOT NULL,
    "changed_at" TIMESTAMP(3) NOT NULL,
    "changed_by" TEXT NOT NULL,
    "change_reason" TEXT NOT NULL,
    "change_reference" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "student_status_history_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "student_status_history_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE RESTRICT ON UPDATE RESTRICT
);

-- Create indexes on student_status_history
CREATE INDEX "student_status_history_student_id_changed_at_idx" ON "student_status_history"("student_id", "changed_at");
CREATE INDEX "student_status_history_changed_at_idx" ON "student_status_history"("changed_at");

-- Create student_profile_history table
CREATE TABLE "student_profile_history" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "student_id" UUID NOT NULL,
    "changed_field" TEXT NOT NULL,
    "previous_value" TEXT,
    "new_value" TEXT,
    "changed_at" TIMESTAMP(3) NOT NULL,
    "changed_by" TEXT NOT NULL,
    "change_reason" TEXT NOT NULL,
    "change_reference" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "student_profile_history_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "student_profile_history_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE RESTRICT ON UPDATE RESTRICT
);

-- Create indexes on student_profile_history
CREATE INDEX "student_profile_history_student_id_changed_at_idx" ON "student_profile_history"("student_id", "changed_at");
CREATE INDEX "student_profile_history_changed_at_idx" ON "student_profile_history"("changed_at");

-- Create student_documents table
CREATE TABLE "student_documents" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "student_id" UUID NOT NULL,
    "document_type" TEXT NOT NULL,
    "file_name" TEXT NOT NULL,
    "storage_path" TEXT NOT NULL,
    "file_size" INTEGER NOT NULL,
    "mime_type" TEXT NOT NULL,
    "uploaded_at" TIMESTAMP(3) NOT NULL,
    "uploaded_by" TEXT NOT NULL,
    "upload_reason" TEXT,
    "change_reference" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "student_documents_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "student_documents_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE RESTRICT ON UPDATE RESTRICT
);

-- Create indexes on student_documents
CREATE INDEX "student_documents_student_id_document_type_idx" ON "student_documents"("student_id", "document_type");
CREATE INDEX "student_documents_uploaded_at_idx" ON "student_documents"("uploaded_at");
