-- Update products.updated_at when product_media changes

CREATE OR REPLACE FUNCTION update_product_on_media_change()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    UPDATE products
    SET updated_at = now()
    WHERE id = OLD.product_id;

    RETURN OLD;
  END IF;

  UPDATE products
  SET updated_at = now()
  WHERE id = NEW.product_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_product_on_media_change ON product_media;

CREATE TRIGGER trigger_update_product_on_media_change
AFTER INSERT OR UPDATE OR DELETE ON product_media
FOR EACH ROW
EXECUTE FUNCTION update_product_on_media_change();