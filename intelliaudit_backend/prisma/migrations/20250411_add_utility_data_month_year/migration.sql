-- Add month and year columns to utility_data table
ALTER TABLE utility_data 
ADD COLUMN month INTEGER,
ADD COLUMN year INTEGER;

-- Update existing records to populate month and year
UPDATE utility_data 
SET 
  month = EXTRACT(MONTH FROM date),
  year = EXTRACT(YEAR FROM date);

-- Create an index to optimize queries by month and year
CREATE INDEX idx_utility_data_month_year ON utility_data(project_id, year, month);

-- Add NOT NULL constraint after populating data
ALTER TABLE utility_data 
ALTER COLUMN month SET NOT NULL,
ALTER COLUMN year SET NOT NULL;

-- Add comment explaining the columns
COMMENT ON COLUMN utility_data.month IS 'Month number (1-12) extracted from date field';
COMMENT ON COLUMN utility_data.year IS 'Year number extracted from date field';

-- Create a trigger to automatically set month and year on insert/update
CREATE OR REPLACE FUNCTION update_utility_data_month_year()
RETURNS TRIGGER AS $$
BEGIN
  NEW.month := EXTRACT(MONTH FROM NEW.date);
  NEW.year := EXTRACT(YEAR FROM NEW.date);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_utility_data_month_year
BEFORE INSERT OR UPDATE ON utility_data
FOR EACH ROW
EXECUTE FUNCTION update_utility_data_month_year(); 