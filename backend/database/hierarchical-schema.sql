-- Hierarchical Category Structure for Reddit Scraper
-- 10 parent categories with 30 subcategories

-- Step 1: Add parent_id to categories table
ALTER TABLE categories
ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES categories(id),
ADD COLUMN IF NOT EXISTS level INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;

-- Add index for hierarchy queries
CREATE INDEX IF NOT EXISTS idx_categories_parent_id ON categories(parent_id);

-- Step 2: Create view for easy querying
CREATE OR REPLACE VIEW categories_hierarchy AS
SELECT
  c.id,
  c.name,
  c.description,
  c.parent_id,
  c.level,
  c.sort_order,
  c.is_active,
  c.post_count,
  p.name as parent_name,
  p.id as parent_category_id
FROM categories c
LEFT JOIN categories p ON c.parent_id = p.id
WHERE c.is_active = true
ORDER BY
  COALESCE(p.sort_order, c.sort_order),
  c.level,
  c.sort_order;

-- Step 3: Function to get all posts for a parent category (including children)
CREATE OR REPLACE FUNCTION get_posts_by_parent_category(parent_cat_id UUID)
RETURNS TABLE (
  post_id UUID,
  category_id UUID,
  category_name TEXT,
  confidence NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    pc.post_id,
    pc.category_id,
    c.name as category_name,
    pc.confidence
  FROM post_categories pc
  JOIN categories c ON pc.category_id = c.id
  WHERE c.id = parent_cat_id
     OR c.parent_id = parent_cat_id;
END;
$$ LANGUAGE plpgsql;

COMMENT ON TABLE categories IS 'Hierarchical categories: level 0 = parent, level 1 = child';
COMMENT ON COLUMN categories.parent_id IS 'NULL for parent categories, references parent for children';
COMMENT ON COLUMN categories.level IS '0 for parent categories, 1 for subcategories';
COMMENT ON COLUMN categories.sort_order IS 'Display order within same level';
