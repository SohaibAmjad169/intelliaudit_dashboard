-- Add lamps_per_fixture column
ALTER TABLE equipment_analysis 
ADD COLUMN lamps_per_fixture DECIMAL DEFAULT 1.0;

-- Migrate existing data from specifications
UPDATE equipment_analysis
SET lamps_per_fixture = (specifications->>'lampsPerFixture')::decimal
WHERE specifications->>'lampsPerFixture' IS NOT NULL;

-- Add comment
COMMENT ON COLUMN equipment_analysis.lamps_per_fixture IS 'Number of lamps per fixture, primarily for lighting equipment'; 