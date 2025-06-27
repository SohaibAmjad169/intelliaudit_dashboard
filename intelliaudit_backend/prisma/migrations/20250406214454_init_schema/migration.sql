-- CreateEnum
CREATE TYPE "project_stage" AS ENUM ('data_collection', 'analysis', 'report', 'review', 'complete');

-- CreateEnum
CREATE TYPE "project_status" AS ENUM ('UNASSIGNED', 'SCHEDULE_NEEDED', 'SITE_VISIT_SCHEDULED', 'REVISIT_NEEDED', 'PENDING_PE_SIGNATURE', 'PENDING_CITY_APPROVAL', 'AWAITING_PAYMENT', 'OUTSOURCED', 'ON_HOLD', 'CANCELED');

-- CreateEnum
CREATE TYPE "report_section_type" AS ENUM ('executive_summary', 'energy_audit', 'water_audit', 'retrocommissioning', 'appendices');

-- CreateTable
CREATE TABLE "ai_photo_analysis" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "project_id" UUID,
    "photo_filename" VARCHAR(255),
    "manufacturer" VARCHAR(255),
    "model" VARCHAR(255),
    "serial_number" VARCHAR(255),
    "equipment_type" VARCHAR(255),
    "specifications" JSONB,
    "condition" JSONB,
    "confidence" DECIMAL(3,2),
    "notes" TEXT,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "photo_url" TEXT,
    "thumbnail_url" TEXT,
    "ai_model" TEXT,
    "location" JSONB,
    "installation_details" JSONB,
    "certification_info" JSONB,
    "maintenance_history" JSONB,
    "system_connections" JSONB,
    "category" TEXT,
    "quantity" INTEGER,
    "load_factor" TEXT,
    "control_strategy" TEXT,
    "operating_hours" INTEGER,
    "annual_kwh" DECIMAL,

    CONSTRAINT "ai_photo_analysis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ashrae_equipment" (
    "id" SERIAL NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "wattage_w" INTEGER NOT NULL,
    "hours_per_week" INTEGER NOT NULL,
    "annual_hours" INTEGER NOT NULL,
    "annual_kwh" INTEGER NOT NULL,
    "formula_used" TEXT NOT NULL,
    "work_shown" TEXT NOT NULL,
    "assumptions" TEXT,
    "recommendations" TEXT,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "project_id" UUID,

    CONSTRAINT "ashrae_equipment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "building_end_use_breakdowns" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "project_id" UUID NOT NULL,
    "building_id" UUID NOT NULL,
    "building_type_code" VARCHAR(50) NOT NULL,
    "end_use_breakdown" JSONB NOT NULL,
    "original_default_breakdown" JSONB NOT NULL,
    "change_history" JSONB NOT NULL DEFAULT '[]',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID,

    CONSTRAINT "building_end_use_breakdowns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "default_end_use_breakdowns" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "building_type_code" VARCHAR(50) NOT NULL,
    "heating" DECIMAL(5,2) NOT NULL,
    "cooling" DECIMAL(5,2) NOT NULL,
    "ventilation" DECIMAL(5,2) NOT NULL,
    "interior_lighting" DECIMAL(5,2) NOT NULL,
    "exterior_lighting" DECIMAL(5,2) NOT NULL,
    "office_equipment" DECIMAL(5,2),
    "plug_loads" DECIMAL(5,2),
    "residential_appliances" DECIMAL(5,2),
    "miscellaneous_electronics" DECIMAL(5,2),
    "domestic_hot_water" DECIMAL(5,2),
    "cooking_kitchen_equipment" DECIMAL(5,2),
    "commercial_refrigeration" DECIMAL(5,2),
    "medical_laboratory_equipment" DECIMAL(5,2),
    "data_centers" DECIMAL(5,2),
    "laundry_equipment" DECIMAL(5,2),
    "residential_refrigeration" DECIMAL(5,2),
    "vertical_transportation" DECIMAL(5,2),
    "pools_recreational" DECIMAL(5,2),
    "other_miscellaneous" DECIMAL(5,2),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "default_end_use_breakdowns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "energy_conservation_measures" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "project_id" UUID NOT NULL,
    "measure_type" TEXT NOT NULL,
    "measure_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "existing_condition" TEXT,
    "recommendation" TEXT,
    "benefits" JSONB,
    "estimated_savings" JSONB,
    "photo_references" JSONB,
    "implementation_notes" TEXT,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "calculation_notes" TEXT,

    CONSTRAINT "energy_conservation_measures_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "energy_costs" (
    "id" SERIAL NOT NULL,
    "state" VARCHAR(50) NOT NULL,
    "electricity_kwh" DECIMAL(10,6) NOT NULL,
    "electricity_kbtu" DECIMAL(10,6) NOT NULL,
    "natural_gas_therm" DECIMAL(10,6) NOT NULL,
    "propane_gallon" DECIMAL(10,6) NOT NULL,
    "fuel_oil_1_gallon" DECIMAL(10,6) NOT NULL,
    "fuel_oil_4_gallon" DECIMAL(10,6) NOT NULL,
    "coal_ton" DECIMAL(10,6) NOT NULL,
    "district_heat_mmbtu" DECIMAL(10,6) NOT NULL,
    "district_chilled_ton_hour" DECIMAL(10,6) NOT NULL,
    "wood_mmbtu" DECIMAL(10,6) NOT NULL,
    "district_steam_mmbtu" DECIMAL(10,6) NOT NULL,
    "kerosene_gallon" DECIMAL(10,6) NOT NULL,
    "other_mmbtu" DECIMAL(10,6) NOT NULL,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "water_hcf" DECIMAL(10,6),

    CONSTRAINT "energy_costs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "enriched_equipment" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "project_id" UUID NOT NULL,
    "source_type" TEXT NOT NULL,
    "original_field_notes_id" UUID,
    "original_photo_analysis_id" UUID,
    "manufacturer" TEXT,
    "model" TEXT,
    "serial_number" TEXT,
    "equipment_type" TEXT,
    "category" TEXT,
    "specifications" JSONB,
    "condition" JSONB,
    "location" TEXT,
    "quantity" INTEGER,
    "load_factor" TEXT,
    "control_strategy" TEXT,
    "operating_hours" INTEGER,
    "annual_kwh" DECIMAL,
    "energy_cost" DECIMAL,
    "photo_url" TEXT,
    "thumbnail_url" TEXT,
    "confidence" DECIMAL,
    "notes" TEXT,
    "maintenance_notes" TEXT,
    "ecm" JSONB,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID,
    "ai_model" TEXT,
    "is_merged" BOOLEAN DEFAULT false,
    "photos" JSONB DEFAULT '[]',

    CONSTRAINT "enriched_equipment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "equipment_analysis" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "project_id" UUID NOT NULL,
    "equipment_type" VARCHAR(255) NOT NULL,
    "manufacturer" VARCHAR(255),
    "model" VARCHAR(255),
    "category" VARCHAR(50),
    "quantity" INTEGER,
    "wattage" DECIMAL,
    "capacity" VARCHAR(100),
    "operating_hours" DECIMAL,
    "days_per_week" DECIMAL,
    "annual_kwh" DECIMAL,
    "notes" TEXT,
    "confidence" DECIMAL,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "ai_model" VARCHAR(50),
    "flow_rate" VARCHAR(50),
    "efficiency" VARCHAR(100),
    "location" TEXT,
    "input_rating" DECIMAL,
    "temperature_rise" DECIMAL,
    "efficiency_unit" VARCHAR,
    "energy_source" VARCHAR,
    "daily_usage" DECIMAL,
    "calculation_details" JSONB,
    "is_per_unit" BOOLEAN DEFAULT false,
    "total_quantity" INTEGER,
    "serial_number" TEXT,
    "source_type" TEXT,
    "specifications" JSONB,
    "load_factor" DECIMAL DEFAULT 1.0,
    "area_type" VARCHAR(20) DEFAULT 'common',
    "annual_cost_estimate" DECIMAL DEFAULT 0.0,
    "is_calculation_verified" BOOLEAN DEFAULT false,
    "weekly_hours" DECIMAL,
    "annual_hours" DECIMAL,
    "formula_used" TEXT,
    "work_shown" TEXT,
    "recommendations" TEXT,
    "photo_url" TEXT,
    "thumbnail_url" TEXT,
    "photo_filename" TEXT,
    "photos" JSONB DEFAULT '[]',
    "condition" JSONB,
    "original_photo_analysis_id" UUID,
    "control_strategy" TEXT,
    "voltage" VARCHAR(50),
    "phase" VARCHAR(20),
    "fuel_type" VARCHAR(50),
    "cooling_efficiency" VARCHAR(50),
    "heating_efficiency" VARCHAR(50),
    "equipment_age" INTEGER,
    "installation_date" DATE,
    "maintenance_schedule" VARCHAR(100),
    "replacement_cost" DECIMAL,
    "expected_lifetime" INTEGER,
    "refrigerant_type" VARCHAR(50),
    "airflow_rate" DECIMAL,
    "lumens" INTEGER,
    "color_temperature" INTEGER,
    "lighting_type" VARCHAR(50),
    "flow_rate_gpm" DECIMAL,
    "water_usage_annual" DECIMAL,
    "recovery_rate" DECIMAL,
    "standby_loss" DECIMAL,
    "cycles_per_week" INTEGER,
    "water_usage_per_cycle" DECIMAL,
    "irrigation_area" DECIMAL,
    "irrigation_schedule" VARCHAR(255),
    "energy_star_rated" BOOLEAN DEFAULT false,
    "annual_therms" DECIMAL,

    CONSTRAINT "equipment_analysis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "profiles" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "full_name" TEXT,
    "avatar_url" TEXT,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "projects" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "building_address" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'SCHEDULE_NEEDED',
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "pm_id" TEXT,
    "property_name" TEXT,
    "property_address" TEXT,
    "property_city" TEXT,
    "property_state" TEXT,
    "property_postal_code" TEXT,
    "property_primary_function" TEXT,
    "property_gross_floor_area" INTEGER,
    "property_year_built" INTEGER,
    "raw_notes" TEXT,
    "ec_o" TEXT,
    "is_public" BOOLEAN DEFAULT false,
    "building_info" JSONB,
    "total_units" INTEGER,
    "unit_types" JSONB,
    "building_floors" INTEGER,
    "building_type" TEXT,
    "building_notes" TEXT,
    "energy_star_score" INTEGER,
    "site_total_energy" DECIMAL(15,1),
    "source_total_energy" DECIMAL(15,1),
    "site_intensity" DECIMAL(10,1),
    "source_intensity" DECIMAL(10,1),
    "direct_ghg_emissions" DECIMAL(10,2),
    "energy_metrics_last_updated" TIMESTAMPTZ(6),
    "energy_metrics_year" INTEGER,
    "energy_metrics_month" INTEGER,
    "energy_metrics_source" VARCHAR(50) DEFAULT 'manual',
    "satellite_image_url" TEXT,

    CONSTRAINT "projects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "utility_calcs" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "project_id" UUID NOT NULL,
    "pm_id" VARCHAR NOT NULL,
    "month" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "meter_id" VARCHAR NOT NULL,
    "meter_type" VARCHAR NOT NULL,
    "usage" DECIMAL,
    "cost" DECIMAL,
    "usage_units" VARCHAR,
    "property_name" VARCHAR,
    "equipment_id" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "heating_degree_days" INTEGER,
    "cooling_degree_days" INTEGER,

    CONSTRAINT "utility_calcs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "utility_data" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "project_id" UUID NOT NULL,
    "pm_id" VARCHAR(255) NOT NULL,
    "meter_id" VARCHAR(100),
    "meter_name" VARCHAR(255),
    "meter_type" VARCHAR(100),
    "start_date" TIMESTAMPTZ(6),
    "end_date" TIMESTAMPTZ(6),
    "month" INTEGER,
    "year" INTEGER,
    "usage" DECIMAL,
    "cost" DECIMAL DEFAULT 0,
    "usage_units" VARCHAR(50),
    "property_name" VARCHAR(255),
    "property_address" VARCHAR(255),
    "property_city" VARCHAR(100),
    "property_state" VARCHAR(50),
    "property_postal_code" VARCHAR(20),
    "property_primary_function" VARCHAR(100),
    "property_gross_floor_area" DECIMAL,
    "property_year_built" INTEGER,
    "import_date" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "hdd" TEXT,
    "cdd" TEXT,

    CONSTRAINT "utility_data_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "weather_comparison" (
    "id" SERIAL NOT NULL,
    "project_id" UUID NOT NULL,
    "zip_code" VARCHAR(10) NOT NULL,
    "station_id" INTEGER NOT NULL,
    "month" INTEGER NOT NULL,
    "base_year" INTEGER NOT NULL,
    "comparison_year" INTEGER,
    "base_year_hdd" DECIMAL NOT NULL,
    "base_year_cdd" DECIMAL NOT NULL,
    "base_year_tdd" DECIMAL NOT NULL,
    "comparison_year_hdd" DECIMAL NOT NULL,
    "comparison_year_cdd" DECIMAL NOT NULL,
    "comparison_year_tdd" DECIMAL NOT NULL,
    "hdd_delta" DECIMAL,
    "cdd_delta" DECIMAL,
    "tdd_delta" DECIMAL,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "weather_comparison_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_ai_photo_analysis_equipment_type" ON "ai_photo_analysis"("equipment_type");

-- CreateIndex
CREATE INDEX "idx_ai_photo_analysis_manufacturer" ON "ai_photo_analysis"("manufacturer");

-- CreateIndex
CREATE INDEX "idx_ai_photo_analysis_project" ON "ai_photo_analysis"("project_id");

-- CreateIndex
CREATE INDEX "idx_ashrae_equipment_project_id" ON "ashrae_equipment"("project_id");

-- CreateIndex
CREATE INDEX "idx_building_end_use_created_at" ON "building_end_use_breakdowns"("created_at" DESC);

-- CreateIndex
CREATE INDEX "idx_building_end_use_project_building" ON "building_end_use_breakdowns"("project_id", "building_id");

-- CreateIndex
CREATE UNIQUE INDEX "building_end_use_breakdowns_project_id_building_id_key" ON "building_end_use_breakdowns"("project_id", "building_id");

-- CreateIndex
CREATE UNIQUE INDEX "default_end_use_breakdowns_building_type_code_key" ON "default_end_use_breakdowns"("building_type_code");

-- CreateIndex
CREATE INDEX "energy_conservation_measures_project_id_idx" ON "energy_conservation_measures"("project_id");

-- CreateIndex
CREATE INDEX "idx_energy_costs_state" ON "energy_costs"("state");

-- CreateIndex
CREATE INDEX "enriched_equipment_original_field_notes_id_idx" ON "enriched_equipment"("original_field_notes_id");

-- CreateIndex
CREATE INDEX "enriched_equipment_original_photo_analysis_id_idx" ON "enriched_equipment"("original_photo_analysis_id");

-- CreateIndex
CREATE INDEX "enriched_equipment_project_id_idx" ON "enriched_equipment"("project_id");

-- CreateIndex
CREATE INDEX "enriched_equipment_source_type_idx" ON "enriched_equipment"("source_type");

-- CreateIndex
CREATE INDEX "idx_projects_building_type" ON "projects"("building_type");

-- CreateIndex
CREATE INDEX "idx_projects_total_units" ON "projects"("total_units");

-- CreateIndex
CREATE INDEX "idx_utility_calcs_degree_days" ON "utility_calcs"("heating_degree_days", "cooling_degree_days");

-- CreateIndex
CREATE INDEX "idx_utility_calcs_meter_type" ON "utility_calcs"("meter_type");

-- CreateIndex
CREATE INDEX "idx_utility_calcs_project_year_month" ON "utility_calcs"("project_id", "year", "month");

-- CreateIndex
CREATE INDEX "utility_calcs_date_idx" ON "utility_calcs"("year", "month");

-- CreateIndex
CREATE INDEX "utility_calcs_meter_type_idx" ON "utility_calcs"("meter_type");

-- CreateIndex
CREATE INDEX "utility_calcs_project_id_idx" ON "utility_calcs"("project_id");

-- CreateIndex
CREATE UNIQUE INDEX "utility_calcs_project_id_pm_id_meter_type_month_year_key" ON "utility_calcs"("project_id", "pm_id", "meter_type", "month", "year");

-- CreateIndex
CREATE INDEX "utility_data_dates_idx" ON "utility_data"("start_date", "end_date");

-- CreateIndex
CREATE INDEX "utility_data_project_id_idx" ON "utility_data"("project_id");

-- CreateIndex
CREATE INDEX "utility_data_property_id_idx" ON "utility_data"("pm_id");

-- CreateIndex
CREATE UNIQUE INDEX "unique_utility_data" ON "utility_data"("project_id", "pm_id", "meter_id", "start_date");

-- CreateIndex
CREATE INDEX "idx_weather_comparison_project_id" ON "weather_comparison"("project_id");

-- CreateIndex
CREATE INDEX "idx_weather_comparison_zip_code" ON "weather_comparison"("zip_code");

-- CreateIndex
CREATE UNIQUE INDEX "weather_comparison_project_id_zip_code_month_key" ON "weather_comparison"("project_id", "zip_code", "month");

-- AddForeignKey
ALTER TABLE "ai_photo_analysis" ADD CONSTRAINT "ai_photo_analysis_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "ashrae_equipment" ADD CONSTRAINT "fk_ashrae_equipment_project" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "building_end_use_breakdowns" ADD CONSTRAINT "building_end_use_breakdowns_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "energy_conservation_measures" ADD CONSTRAINT "energy_conservation_measures_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "enriched_equipment" ADD CONSTRAINT "enriched_equipment_original_equipment_analysis_id_fkey" FOREIGN KEY ("original_field_notes_id") REFERENCES "equipment_analysis"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "enriched_equipment" ADD CONSTRAINT "enriched_equipment_original_photo_analysis_id_fkey" FOREIGN KEY ("original_photo_analysis_id") REFERENCES "ai_photo_analysis"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "enriched_equipment" ADD CONSTRAINT "enriched_equipment_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "utility_calcs" ADD CONSTRAINT "utility_calcs_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "utility_data" ADD CONSTRAINT "utility_data_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "weather_comparison" ADD CONSTRAINT "weather_comparison_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
