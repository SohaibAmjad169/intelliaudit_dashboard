-- CreateTable
CREATE TABLE "energy_breakdown" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "project_id" UUID NOT NULL,
  "breakdown_data" JSONB NOT NULL,
  "model_used" VARCHAR(50),
  "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
  "total_electric_kwh" DECIMAL(15,2),
  "total_gas_therms" DECIMAL(15,2),
  "total_steam_mmbtu" DECIMAL(15,2),
  "total_other_mmbtu" DECIMAL(15,2),

  CONSTRAINT "energy_breakdown_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "energy_breakdown" ADD CONSTRAINT "energy_breakdown_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- CreateIndex
CREATE INDEX "idx_energy_breakdown_project_id" ON "energy_breakdown"("project_id");

-- Add comment to the table
COMMENT ON TABLE "energy_breakdown" IS 'This model stores energy breakdown data generated from field notes';

-- Create a trigger to update the updated_at timestamp
CREATE TRIGGER set_timestamp
BEFORE UPDATE ON energy_breakdown
FOR EACH ROW
EXECUTE FUNCTION trigger_set_timestamp(); 