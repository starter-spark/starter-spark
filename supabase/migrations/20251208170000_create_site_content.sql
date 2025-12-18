-- Phase 15.5: Universal Content Management
-- Create site_content table for editable text across the site

CREATE TABLE site_content (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  content_key text UNIQUE NOT NULL,          -- 'footer.copyright', 'hero.headline', etc.
  content_type text NOT NULL DEFAULT 'text', -- 'text', 'rich_text', 'json', 'html'
  content text NOT NULL,
  default_value text,                        -- Fallback if content is empty
  description text,                          -- Admin hint
  category text NOT NULL,                    -- 'global', 'homepage', 'shop', 'events', etc.
  sort_order integer DEFAULT 0,
  last_updated_by uuid REFERENCES auth.users(id),
  updated_at timestamptz DEFAULT now()
);
-- RLS
ALTER TABLE site_content ENABLE ROW LEVEL SECURITY;
-- Public can read all content
CREATE POLICY "Public can read site_content"
  ON site_content FOR SELECT
  USING (true);
-- Admin can manage all content
CREATE POLICY "Admin can manage site_content"
  ON site_content FOR ALL
  USING (is_admin());
-- Create index for faster lookups
CREATE INDEX idx_site_content_key ON site_content(content_key);
CREATE INDEX idx_site_content_category ON site_content(category);
-- Seed initial content values
INSERT INTO site_content (content_key, content_type, content, default_value, description, category, sort_order) VALUES
-- Global
('footer.copyright', 'text', '© 2025 StarterSpark Robotics. All rights reserved.', '© 2025 StarterSpark Robotics. All rights reserved.', 'Footer copyright text', 'global', 1),
('header.cta', 'text', 'Shop Kits', 'Shop Kits', 'Header CTA button text', 'global', 2),

-- Homepage
('home.hero.headline', 'text', 'Build Your First Robot', 'Build Your First Robot', 'Homepage hero main headline', 'homepage', 1),
('home.hero.subheadline', 'text', 'Learn robotics with our hands-on kits designed for makers of all ages.', 'Learn robotics with our hands-on kits designed for makers of all ages.', 'Homepage hero subheadline', 'homepage', 2),
('home.hero.cta_primary', 'text', 'Shop Kits', 'Shop Kits', 'Homepage primary CTA button', 'homepage', 3),
('home.hero.cta_secondary', 'text', 'Learn More', 'Learn More', 'Homepage secondary CTA button', 'homepage', 4),
('home.events.empty', 'text', 'No upcoming events. Check back soon for new workshops!', 'No upcoming events', 'Homepage events section empty state', 'homepage', 5),
('home.mission.headline', 'text', 'Our Mission', 'Our Mission', 'Homepage mission section headline', 'homepage', 6),
('home.mission.description', 'rich_text', 'We''re on a mission to make robotics education accessible to everyone. 70% of our profits go directly to local STEM programs and underserved schools in Hawaii.', 'We''re on a mission to make robotics education accessible to everyone.', 'Homepage mission section description', 'homepage', 7),

-- Shop
('shop.header.title', 'text', 'Shop', 'Shop', 'Shop page title', 'shop', 1),
('shop.header.description', 'text', 'Browse our robotics kits designed for learners of all ages.', 'Browse our robotics kits', 'Shop page description', 'shop', 2),
('shop.empty', 'text', 'No products available at this time.', 'No products available', 'Shop empty state', 'shop', 3),

-- Events
('events.header.title', 'text', 'Events', 'Events', 'Events page title', 'events', 1),
('events.header.description', 'text', 'Hands-on workshops, competitions, and community events throughout Hawaii. Join us to learn robotics, meet fellow builders, and grow your skills.', 'Join our workshops and events', 'Events page description', 'events', 2),
('events.empty', 'text', 'No upcoming events. Check back soon for new workshops and events!', 'No upcoming events', 'Events empty state', 'events', 3),

-- Community
('community.header.title', 'text', 'The Lab', 'The Lab', 'Community page title', 'community', 1),
('community.header.description', 'text', 'Ask questions, share your projects, and connect with fellow robotics enthusiasts.', 'Ask questions and share projects', 'Community page description', 'community', 2),
('community.empty', 'text', 'No discussions yet. Be the first to ask a question!', 'No discussions yet', 'Community empty state', 'community', 3),

-- Learn
('learn.header.title', 'text', 'Learn With Us', 'Learn', 'Learn page title', 'learn', 1),
('learn.header.description', 'text', 'Hands-on courses designed to take you from beginner to builder. Start your robotics journey today.', 'Start your robotics journey', 'Learn page description', 'learn', 2),
('learn.empty', 'text', 'No courses available yet. Check back soon!', 'No courses available', 'Learn empty state', 'learn', 3),

-- Workshop
('workshop.header.title', 'text', 'Workshop', 'Workshop', 'Workshop page title', 'workshop', 1),
('workshop.header.description', 'text', 'Your personal robotics workspace. Track progress, access tools, and manage your kits.', 'Your personal workspace', 'Workshop page description', 'workshop', 2),
('workshop.no_kits', 'text', 'You don''t have any kits yet. Purchase a kit to get started!', 'No kits yet', 'Workshop no kits state', 'workshop', 3),

-- Cart
('cart.empty.title', 'text', 'Your cart is empty', 'Your cart is empty', 'Empty cart title', 'cart', 1),
('cart.empty.description', 'text', 'Looks like you haven''t added any items yet.', 'No items in cart', 'Empty cart description', 'cart', 2),
('cart.empty.cta', 'text', 'Browse Kits', 'Browse Kits', 'Empty cart CTA button', 'cart', 3);
