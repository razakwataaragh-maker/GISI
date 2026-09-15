-- AlterTable
ALTER TABLE "roles" ADD COLUMN     "rank" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "iam_bootstrap_control" (
    "id" VARCHAR(32) NOT NULL DEFAULT 'singleton',
    "consumed_at" TIMESTAMP(3),
    "consumed_by" TEXT,
    "change_reference" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "iam_bootstrap_control_pkey" PRIMARY KEY ("id")
);
