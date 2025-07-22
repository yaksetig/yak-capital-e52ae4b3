-- Update the database function to include btc_price column
CREATE OR REPLACE FUNCTION public.get_m2_supply_data()
 RETURNS TABLE(date timestamp with time zone, m2_supply bigint, btc_price numeric)
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT date, m2_supply, btc_price 
  FROM m2supply 
  ORDER BY date ASC;
$function$