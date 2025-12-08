-- Add content keys for Footer

INSERT INTO site_content (content_key, content_type, content, default_value, description, category, sort_order) VALUES
-- Charity banner
('footer.charity.percentage', 'text', '70%', '70%', 'Charity percentage highlight', 'global', 100),
('footer.charity.text', 'text', 'of every purchase goes directly to Hawaii STEM charities', 'of every purchase goes directly to Hawaii STEM charities', 'Charity banner text', 'global', 101),

-- Brand section
('footer.brand.tagline', 'text', 'Open-source robotics education designed by students, for students. Building the next generation of Hawaii''s engineers.', 'Open-source robotics education designed by students, for students.', 'Footer brand tagline', 'global', 102),

-- Newsletter section
('footer.newsletter.title', 'text', 'Stay Updated', 'Stay Updated', 'Newsletter section title', 'global', 110),
('footer.newsletter.description', 'text', 'Get notified about new kits and workshops.', 'Get notified about new kits and workshops.', 'Newsletter section description', 'global', 111)

ON CONFLICT (content_key) DO UPDATE SET
  content = EXCLUDED.content,
  default_value = EXCLUDED.default_value,
  description = EXCLUDED.description,
  sort_order = EXCLUDED.sort_order;
