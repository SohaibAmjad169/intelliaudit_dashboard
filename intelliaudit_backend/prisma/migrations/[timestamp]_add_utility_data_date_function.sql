-- Create function to extract month and year
CREATE OR REPLACE FUNCTION update_utility_data_month_year()
RETURNS TRIGGER AS $$
BEGIN
    -- Extract month and year from start_date
    NEW.month := EXTRACT(MONTH FROM NEW.start_date)::INTEGER;
    NEW.year := EXTRACT(YEAR FROM NEW.start_date)::INTEGER;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update month and year
CREATE TRIGGER utility_data_month_year_trigger
    BEFORE INSERT OR UPDATE ON utility_data
    FOR EACH ROW
    EXECUTE FUNCTION update_utility_data_month_year();

-- Update existing records
UPDATE utility_data
SET 
    month = EXTRACT(MONTH FROM start_date)::INTEGER,
    year = EXTRACT(YEAR FROM start_date)::INTEGER
WHERE start_date IS NOT NULL; 