-- Atomic stock decrement helper for inventory-tracked products.
-- Prevents lost updates when multiple checkouts are processed concurrently.

CREATE OR REPLACE FUNCTION public.decrement_product_stock(
  p_product_id uuid,
  p_quantity integer
)
RETURNS TABLE (stock_quantity integer)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_quantity IS NULL OR p_quantity <= 0 THEN
    RETURN;
  END IF;

  RETURN QUERY
  UPDATE public.products
  SET stock_quantity = GREATEST(public.products.stock_quantity - p_quantity, 0)
  WHERE public.products.id = p_product_id
    AND public.products.track_inventory = true
    AND public.products.stock_quantity IS NOT NULL
  RETURNING public.products.stock_quantity;
END;
$$;

GRANT EXECUTE ON FUNCTION public.decrement_product_stock(uuid, integer) TO service_role;
