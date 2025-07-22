-- Create a function to get M2 supply data
CREATE OR REPLACE FUNCTION get_m2_supply_data()
RETURNS TABLE(date timestamp with time zone, m2_supply bigint)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT date, m2_supply 
  FROM m2supply 
  ORDER BY date ASC;
$$;