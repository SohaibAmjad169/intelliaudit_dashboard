-- Create a view with computed month and year columns
CREATE OR REPLACE VIEW utility_data_with_dates AS
SELECT 
    *,
    EXTRACT(MONTH FROM start_date)::INTEGER as month,
    EXTRACT(YEAR FROM start_date)::INTEGER as year
FROM utility_data; 