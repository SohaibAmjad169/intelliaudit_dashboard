-- Enable pgcrypto extension for gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- CreateTable
CREATE TABLE "photo_batch_job" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "project_id" UUID NOT NULL,
  "status" VARCHAR(20) NOT NULL,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "completed_at" TIMESTAMPTZ(6),
  "total_photos" INTEGER NOT NULL,
  "processed_photos" INTEGER NOT NULL DEFAULT 0,
  "equipment_type" VARCHAR(255),
  "priority" VARCHAR(10) NOT NULL DEFAULT 'normal',

  CONSTRAINT "photo_batch_job_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "photo_metadata_result" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "batch_id" UUID NOT NULL,
  "photo_id" UUID,
  "photo_url" TEXT,
  "equipment_type" VARCHAR(255),
  "manufacturer" VARCHAR(255),
  "model" VARCHAR(255),
  "serial_number" VARCHAR(255),
  "capacity" VARCHAR(100),
  "efficiency" VARCHAR(100),
  "efficiency_unit" VARCHAR(50),
  "year" VARCHAR(10),
  "condition" VARCHAR(20),
  "confidence" DECIMAL(3,2),
  "processing_time" INTEGER,
  "extracted_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "is_applied" BOOLEAN NOT NULL DEFAULT false,
  "applied_to_equipment_id" UUID,

  CONSTRAINT "photo_metadata_result_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "metadata_match_job" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "project_id" UUID NOT NULL,
  "batch_id" UUID NOT NULL,
  "status" VARCHAR(20) NOT NULL,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "completed_at" TIMESTAMPTZ(6),
  "config" JSONB,
  "results_summary" JSONB,

  CONSTRAINT "metadata_match_job_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "photo_batch_job" ADD CONSTRAINT "photo_batch_job_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "photo_metadata_result" ADD CONSTRAINT "photo_metadata_result_batch_id_fkey" FOREIGN KEY ("batch_id") REFERENCES "photo_batch_job"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "photo_metadata_result" ADD CONSTRAINT "photo_metadata_result_applied_to_equipment_id_fkey" FOREIGN KEY ("applied_to_equipment_id") REFERENCES "equipment_analysis"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "metadata_match_job" ADD CONSTRAINT "metadata_match_job_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "metadata_match_job" ADD CONSTRAINT "metadata_match_job_batch_id_fkey" FOREIGN KEY ("batch_id") REFERENCES "photo_batch_job"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- Create indexes
CREATE INDEX "idx_photo_batch_job_project_id" ON "photo_batch_job"("project_id");
CREATE INDEX "idx_photo_batch_job_status" ON "photo_batch_job"("status");
CREATE INDEX "idx_photo_metadata_result_batch_id" ON "photo_metadata_result"("batch_id");
CREATE INDEX "idx_photo_metadata_result_equipment" ON "photo_metadata_result"("equipment_type");
CREATE INDEX "idx_metadata_match_job_project" ON "metadata_match_job"("project_id");
CREATE INDEX "idx_metadata_match_job_batch" ON "metadata_match_job"("batch_id"); 