-- Create a materialized view for monthly utility summaries
CREATE MATERIALIZED VIEW utility_monthly_summary AS
SELECT 
    uc.project_id,
    uc.year,
    uc.month,
    -- Electric summary
    SUM(CASE WHEN uc.meter_type = 'Electric' THEN uc.usage ELSE 0 END) as total_electric_kwh,
    SUM(CASE WHEN uc.meter_type = 'Electric' THEN uc.cost ELSE 0 END) as total_electric_cost,
    -- Gas summary
    SUM(CASE WHEN uc.meter_type = 'Gas' THEN uc.usage ELSE 0 END) as total_gas_therms,
    SUM(CASE WHEN uc.meter_type = 'Gas' THEN uc.cost ELSE 0 END) as total_gas_cost,
    -- Steam summary
    SUM(CASE WHEN uc.meter_type = 'Steam' THEN uc.usage ELSE 0 END) as total_steam_mmbtu,
    SUM(CASE WHEN uc.meter_type = 'Steam' THEN uc.cost ELSE 0 END) as total_steam_cost,
    -- Other summary
    SUM(CASE WHEN uc.meter_type NOT IN ('Electric', 'Gas', 'Steam') THEN uc.usage ELSE 0 END) as total_other_mmbtu,
    SUM(CASE WHEN uc.meter_type NOT IN ('Electric', 'Gas', 'Steam') THEN uc.cost ELSE 0 END) as total_other_cost,
    -- Weather data (already properly structured in utility_calcs)
    AVG(uc.heating_degree_days) as avg_heating_degree_days,
    AVG(uc.cooling_degree_days) as avg_cooling_degree_days,
    -- Building info
    MAX(p.property_gross_floor_area) as building_square_footage,
    MAX(p.building_type) as building_type,
    -- Calculated fields
    SUM(CASE WHEN uc.meter_type = 'Electric' THEN uc.usage ELSE 0 END) / 
        NULLIF(MAX(p.property_gross_floor_area), 0) as electric_kwh_per_sqft,
    SUM(CASE WHEN uc.meter_type = 'Gas' THEN uc.usage ELSE 0 END) / 
        NULLIF(MAX(p.property_gross_floor_area), 0) as gas_therms_per_sqft
FROM 
    utility_calcs uc
LEFT JOIN
    projects p ON uc.project_id = p.id
GROUP BY 
    uc.project_id,
    uc.year,
    uc.month;

-- Create indexes for the materialized view
CREATE UNIQUE INDEX idx_utility_monthly_summary_project_date 
ON utility_monthly_summary(project_id, year, month);

CREATE INDEX idx_utility_monthly_summary_date 
ON utility_monthly_summary(year, month);

-- Create a function to refresh the materialized view
CREATE OR REPLACE FUNCTION refresh_utility_monthly_summary()
RETURNS trigger AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY utility_monthly_summary;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to refresh the view when utility calcs change
CREATE TRIGGER refresh_utility_monthly_summary_on_utility_calcs
AFTER INSERT OR UPDATE OR DELETE ON utility_calcs
FOR EACH STATEMENT
EXECUTE FUNCTION refresh_utility_monthly_summary();

-- Add helpful comments
COMMENT ON MATERIALIZED VIEW utility_monthly_summary IS 
'Monthly summary of utility data including usage, costs, and weather data';

COMMENT ON COLUMN utility_monthly_summary.total_electric_kwh IS 
'Total electric usage in kWh for the month';

COMMENT ON COLUMN utility_monthly_summary.total_gas_therms IS 
'Total gas usage in therms for the month';

COMMENT ON COLUMN utility_monthly_summary.electric_kwh_per_sqft IS 
'Electric usage intensity (kWh per square foot)';

COMMENT ON COLUMN utility_monthly_summary.gas_therms_per_sqft IS 
'Gas usage intensity (therms per square foot)'; 