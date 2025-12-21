-- Documentation System Schema
-- Public, hierarchical documentation system separate from courses

-- Categories (hierarchical)
CREATE TABLE doc_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  description text,
  icon text,
  parent_id uuid REFERENCES doc_categories(id) ON DELETE SET NULL,
  sort_order integer DEFAULT 0,
  is_published boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Pages
CREATE TABLE doc_pages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid REFERENCES doc_categories(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  slug text NOT NULL,
  content text, -- Markdown
  excerpt text,
  is_published boolean DEFAULT false,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  updated_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  UNIQUE(category_id, slug)
);

-- Attachments (PDFs, etc.)
CREATE TABLE doc_attachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id uuid REFERENCES doc_pages(id) ON DELETE CASCADE NOT NULL,
  filename text NOT NULL,
  storage_path text NOT NULL,
  file_size integer,
  mime_type text,
  created_at timestamptz DEFAULT now()
);

-- Full-text search index
CREATE INDEX idx_doc_pages_search ON doc_pages
  USING gin(to_tsvector('english', coalesce(title, '') || ' ' || coalesce(content, '')));

-- Indexes for common queries
CREATE INDEX idx_doc_pages_category ON doc_pages(category_id);
CREATE INDEX idx_doc_pages_published ON doc_pages(is_published) WHERE is_published = true;
CREATE INDEX idx_doc_categories_parent ON doc_categories(parent_id);
CREATE INDEX idx_doc_categories_published ON doc_categories(is_published) WHERE is_published = true;

-- Enable RLS
ALTER TABLE doc_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE doc_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE doc_attachments ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Public read for published content
CREATE POLICY "Anyone can view published categories"
  ON doc_categories FOR SELECT
  USING (is_published = true);

CREATE POLICY "Anyone can view published pages"
  ON doc_pages FOR SELECT
  USING (is_published = true);

CREATE POLICY "Anyone can view attachments of published pages"
  ON doc_attachments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM doc_pages p
      WHERE p.id = doc_attachments.page_id
        AND p.is_published = true
    )
  );

-- Admin policies
CREATE POLICY "Admins can manage categories"
  ON doc_categories FOR ALL
  USING (is_admin(auth.uid()));

CREATE POLICY "Admins can manage pages"
  ON doc_pages FOR ALL
  USING (is_admin(auth.uid()));

CREATE POLICY "Admins can manage attachments"
  ON doc_attachments FOR ALL
  USING (is_admin(auth.uid()));

-- Staff can view all (including drafts)
CREATE POLICY "Staff can view all categories"
  ON doc_categories FOR SELECT
  USING (is_staff(auth.uid()));

CREATE POLICY "Staff can view all pages"
  ON doc_pages FOR SELECT
  USING (is_staff(auth.uid()));

CREATE POLICY "Staff can view all attachments"
  ON doc_attachments FOR SELECT
  USING (is_staff(auth.uid()));

-- Function to search documentation
CREATE OR REPLACE FUNCTION search_docs(
  search_query text,
  result_limit integer DEFAULT 20
)
RETURNS TABLE (
  id uuid,
  title text,
  excerpt text,
  slug text,
  category_slug text,
  category_name text,
  rank real
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    p.title,
    COALESCE(p.excerpt, LEFT(p.content, 200)) as excerpt,
    p.slug,
    c.slug as category_slug,
    c.name as category_name,
    ts_rank(
      to_tsvector('english', coalesce(p.title, '') || ' ' || coalesce(p.content, '')),
      plainto_tsquery('english', search_query)
    ) as rank
  FROM doc_pages p
  JOIN doc_categories c ON c.id = p.category_id
  WHERE p.is_published = true
    AND c.is_published = true
    AND to_tsvector('english', coalesce(p.title, '') || ' ' || coalesce(p.content, ''))
        @@ plainto_tsquery('english', search_query)
  ORDER BY rank DESC
  LIMIT result_limit;
END;
$$;

-- Grant execute to public (search is for everyone)
GRANT EXECUTE ON FUNCTION search_docs(text, integer) TO PUBLIC;

-- Seed initial categories
INSERT INTO doc_categories (name, slug, description, icon, sort_order, is_published) VALUES
  ('Getting Started', 'getting-started', 'Learn the basics of building with StarterSpark kits', 'Rocket', 1, true),
  ('Arduino Basics', 'arduino-basics', 'Fundamental Arduino programming concepts', 'Cpu', 2, true),
  ('Electronics', 'electronics', 'Understanding electronic components and circuits', 'Zap', 3, true),
  ('Troubleshooting', 'troubleshooting', 'Common issues and how to fix them', 'Wrench', 4, true),
  ('Reference', 'reference', 'API references and quick lookup guides', 'Book', 5, true);
