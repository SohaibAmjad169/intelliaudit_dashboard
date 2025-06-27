-- CreateFunction
CREATE OR REPLACE FUNCTION public.update_utility_data_month_year()
RETURNS TRIGGER AS $$
BEGIN
    -- Only update if start_date is not null
    IF NEW.start_date IS NOT NULL THEN
        NEW.month := EXTRACT(MONTH FROM NEW.start_date)::INTEGER;
        NEW.year := EXTRACT(YEAR FROM NEW.start_date)::INTEGER;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- DropTrigger (if exists)
DROP TRIGGER IF EXISTS utility_data_month_year_trigger ON public.utility_data;

-- CreateTrigger
CREATE TRIGGER utility_data_month_year_trigger
    BEFORE INSERT OR UPDATE OF start_date
    ON public.utility_data
    FOR EACH ROW
    EXECUTE FUNCTION public.update_utility_data_month_year();

-- Update existing records
UPDATE public.utility_data
SET 
    month = EXTRACT(MONTH FROM start_date)::INTEGER,
    year = EXTRACT(YEAR FROM start_date)::INTEGER
WHERE start_date IS NOT NULL
    AND (month IS NULL OR year IS NULL); 