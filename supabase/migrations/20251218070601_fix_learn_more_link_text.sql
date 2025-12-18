-- Fix non-descriptive "Learn More" link text for SEO
-- Lighthouse flags generic link text like "Learn More", "Click here", etc.
-- Updated to "Explore Free Courses" which describes where the link goes

UPDATE site_content
SET content = 'Explore Free Courses',
    default_value = 'Explore Free Courses'
WHERE content_key = 'home.hero.cta_secondary';
