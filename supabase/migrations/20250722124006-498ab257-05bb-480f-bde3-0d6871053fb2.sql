-- Enable RLS on m2supply table
ALTER TABLE m2supply ENABLE ROW LEVEL SECURITY;

-- Create policy to allow read access to m2supply data
CREATE POLICY "Allow public read access to m2supply" 
ON m2supply 
FOR SELECT 
USING (true);

-- Fix the function to set proper search_path
CREATE OR REPLACE FUNCTION get_m2_supply_data()
RETURNS TABLE(date timestamp with time zone, m2_supply bigint)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT date, m2_supply 
  FROM m2supply 
  ORDER BY date ASC;
$$;