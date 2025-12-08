-- Add more content keys for Workshop page

INSERT INTO site_content (content_key, content_type, content, default_value, description, category, sort_order) VALUES
-- Sign in required state
('workshop.signIn.title', 'text', 'Sign In Required', 'Sign In Required', 'Sign-in required section title', 'workshop', 10),
('workshop.signIn.description', 'text', 'Sign in to view your kits, track your learning progress, and claim new kit codes.', 'Sign in to view your kits, track your learning progress, and claim new kit codes.', 'Sign-in required description', 'workshop', 11),
('workshop.signIn.button', 'text', 'Sign In', 'Sign In', 'Sign in button text', 'workshop', 12),
('workshop.signIn.shopButton', 'text', 'Shop Kits', 'Shop Kits', 'Shop kits button text', 'workshop', 13),

-- My Kits section
('workshop.kits.title', 'text', 'My Kits', 'My Kits', 'My kits section title', 'workshop', 20),
('workshop.kits.empty.subtitle', 'text', 'Purchase a kit or enter a code to get started.', 'Purchase a kit or enter a code to get started.', 'No kits subtitle', 'workshop', 21),
('workshop.kits.empty.cta', 'text', 'Browse Kits', 'Browse Kits', 'No kits CTA button', 'workshop', 22),

-- Claim section
('workshop.claim.title', 'text', 'Claim a Kit', 'Claim a Kit', 'Claim section title', 'workshop', 30),
('workshop.claim.description', 'text', 'Have a kit code? Enter it below to activate your kit.', 'Have a kit code? Enter it below to activate your kit.', 'Claim section description', 'workshop', 31),

-- Achievements section
('workshop.achievements.title', 'text', 'Achievements', 'Achievements', 'Achievements section title', 'workshop', 40),
('workshop.achievements.hint', 'text', 'Complete lessons to unlock badges', 'Complete lessons to unlock badges', 'Achievements hint text', 'workshop', 41)

ON CONFLICT (content_key) DO UPDATE SET
  content = EXCLUDED.content,
  default_value = EXCLUDED.default_value,
  description = EXCLUDED.description,
  sort_order = EXCLUDED.sort_order;
