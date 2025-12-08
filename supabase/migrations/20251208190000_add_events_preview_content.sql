-- Add content keys for the Events Preview section on homepage
-- This covers workshops, community/lab preview, empty states, and button text

INSERT INTO site_content (content_key, content_type, content, default_value, description, category, sort_order) VALUES
-- Workshops subsection
('home.community.workshops.title', 'text', 'Upcoming Workshops', 'Upcoming Workshops', 'Workshops subsection title', 'homepage', 42),
('home.community.workshops.viewAll', 'text', 'View All', 'View All', 'View all workshops button', 'homepage', 43),
('home.community.workshops.empty.title', 'text', 'No Upcoming Events', 'No Upcoming Events', 'Empty state title when no workshops', 'homepage', 44),
('home.community.workshops.empty.description', 'text', 'Check back soon for new workshops and events in your area.', 'Check back soon for new workshops and events in your area.', 'Empty state description when no workshops', 'homepage', 45),
('home.community.workshops.empty.cta', 'text', 'View Past Events', 'View Past Events', 'Empty state CTA button', 'homepage', 46),
('home.community.workshops.cta', 'text', 'Register for a Workshop', 'Register for a Workshop', 'Main workshops CTA button (has events)', 'homepage', 47),
('home.community.workshops.ctaEmpty', 'text', 'View All Events', 'View All Events', 'Main workshops CTA button (no events)', 'homepage', 48),

-- The Lab subsection
('home.community.lab.title', 'text', 'The Lab', 'The Lab', 'Lab subsection title', 'homepage', 50),
('home.community.lab.joinNow', 'text', 'Join Now', 'Join Now', 'Join now button', 'homepage', 51),
('home.community.lab.membersLabel', 'text', 'Members', 'Members', 'Members stat label', 'homepage', 52),
('home.community.lab.discussionsLabel', 'text', 'Discussions', 'Discussions', 'Discussions stat label', 'homepage', 53),
('home.community.lab.empty.title', 'text', 'Be the First to Ask', 'Be the First to Ask', 'Empty state title when no discussions', 'homepage', 54),
('home.community.lab.empty.description', 'text', 'Start a discussion and help build our community of makers.', 'Start a discussion and help build our community of makers.', 'Empty state description when no discussions', 'homepage', 55),
('home.community.lab.empty.cta', 'text', 'Ask a Question', 'Ask a Question', 'Empty state CTA button', 'homepage', 56),
('home.community.lab.cta', 'text', 'Join The Lab', 'Join The Lab', 'Main lab CTA button', 'homepage', 57)

ON CONFLICT (content_key) DO UPDATE SET
  content = EXCLUDED.content,
  default_value = EXCLUDED.default_value,
  description = EXCLUDED.description,
  sort_order = EXCLUDED.sort_order;
