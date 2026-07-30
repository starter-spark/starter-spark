-- site_content's key-value copy moves into typed CMS documents (one per site
-- section), versioned and draft/publishable like everything else. Every
-- consumer moved in the same change that ships this migration.
--
-- Seeds read the live site_content values at apply time (each environment
-- keeps its own copy) and fall back to the registry defaults for keys that
-- never existed in that environment. Replay-safe: seeding is skipped for
-- documents that already exist, and the value reader degrades to fallbacks
-- once site_content is gone.

CREATE FUNCTION pg_temp.sc(k text, fallback text) RETURNS text AS $f$
DECLARE v text;
BEGIN
  IF to_regclass('public.site_content') IS NULL THEN
    RETURN fallback;
  END IF;
  EXECUTE 'SELECT content FROM public.site_content WHERE content_key = $1' INTO v USING k;
  RETURN COALESCE(NULLIF(v, ''), fallback);
END $f$ LANGUAGE plpgsql;

CREATE FUNCTION pg_temp.seed_singleton(t text, d jsonb) RETURNS void AS $f$
DECLARE
  doc_id uuid;
  ver_id uuid;
BEGIN
  IF EXISTS (SELECT 1 FROM public.cms_documents WHERE type = t AND key = 'default') THEN
    RETURN;
  END IF;
  INSERT INTO public.cms_documents (type, key, sort_order)
    VALUES (t, 'default', 0)
    RETURNING id INTO doc_id;
  INSERT INTO public.cms_versions (document_id, version, data, note)
    VALUES (doc_id, 1, d, 'Migrated from site_content')
    RETURNING id INTO ver_id;
  UPDATE public.cms_documents SET published_version_id = ver_id WHERE id = doc_id;
END $f$ LANGUAGE plpgsql;

SELECT pg_temp.seed_singleton('home_hero', jsonb_build_object(
  'taglineTop', pg_temp.sc('home.hero.tagline_top', 'Shipping only to Hawaii'),
  'headline', pg_temp.sc('home.hero.headline', E'Start here.\nFigure it out.\nWe''ll help.'),
  'subheadline', pg_temp.sc('home.hero.subheadline', 'That''s the whole point.'),
  'taglineBottom', pg_temp.sc('home.hero.tagline_bottom', 'Open Source Hardware • Affordable • For Hawaii'),
  'ctaPrimary', pg_temp.sc('home.hero.cta_primary', 'Shop Kits'),
  'ctaSecondary', pg_temp.sc('home.hero.cta_secondary', 'Explore Free Courses')
));

SELECT pg_temp.seed_singleton('home_mission', jsonb_build_object(
  'title', pg_temp.sc('home.mission.title', 'More Than a Kit'),
  'subtitle', pg_temp.sc('home.mission.subtitle', 'We built this because we wanted it to exist. Everything we make is designed for students who are just starting out.'),
  'story1', pg_temp.sc('home.mission.story1', 'A lot of testing, clogged up printers and prototypes under our desks, and eventually something that works!'),
  'story2', pg_temp.sc('home.mission.story2', 'Every kit we ship has been tested by real students. Not just us. We bring the kits to schools and run workshops to figure out what breaks and what works. The stuff that makes it into the kit is what actually survived that process.'),
  'commitmentTitle', pg_temp.sc('home.mission.commitment.title', 'Open Source'),
  'commitmentText', pg_temp.sc('home.mission.commitment.text', 'Hardware schematics, 3D print files, and curriculum are all open source. You can download everything for free on each kit''s shop page. You don''t need to buy the kit to use what we built, but it''ll save you a lot of time :)'),
  'commitmentSubtext', pg_temp.sc('home.mission.commitment.subtext', 'If you want to build it yourself, go for it.')
));

SELECT pg_temp.seed_singleton('home_differentiators', jsonb_build_object(
  'title', pg_temp.sc('home.differentiators.title', 'Why StarterSpark?'),
  'description', pg_temp.sc('home.differentiators.description', 'We built the kit we wished existed when we were kids.'),
  'card1Title', pg_temp.sc('home.differentiators.card1.title', 'Complete Package'),
  'card1Description', pg_temp.sc('home.differentiators.card1.description', 'Everything you need in one box: pre-cut parts, electronics, fasteners, and our step-by-step digital curriculum. No hunting for components or compatibility issues.'),
  'card2Title', pg_temp.sc('home.differentiators.card2.title', 'Interactive Curriculum'),
  'card2Description', pg_temp.sc('home.differentiators.card2.description', 'The platform has interactive wiring diagrams, a built-in code editor, and progress tracking across lessons. You can see where every wire goes before you touch anything, which honestly saves a lot of frustration.'),
  'card3Title', pg_temp.sc('home.differentiators.card3.title', 'Support for Schools and Clubs'),
  'card3Description', pg_temp.sc('home.differentiators.card3.description', 'We offer bulk discounts for schools and clubs, and the kits come classroom-ready so you don''t have to figure out sourcing. If you''re trying to set up a robotics program and don''t know where to start, just email us.'),
  'card4Title', pg_temp.sc('home.differentiators.card4.title', 'Hawaii Roots'),
  'card4Description', pg_temp.sc('home.differentiators.card4.description', 'We''re students from Hawaii who couldn''t find a good beginner robotics kit, so we built one. Everything was tested by real students before we shipped anything.')
));

SELECT pg_temp.seed_singleton('home_learning', jsonb_build_object(
  'title', pg_temp.sc('home.learning.title', 'How It Works'),
  'description', pg_temp.sc('home.learning.description', 'The platform walks you through the whole thing, from when you open the box all the way to running your first program.'),
  'block1Title', pg_temp.sc('home.learning.block1.title', 'Step-by-Step Digital Guides'),
  'block1Description1', pg_temp.sc('home.learning.block1.description1', 'Each lesson builds on the last, taking you from basic assembly through advanced programming. Our interactive diagrams show exactly where each wire connects, and you can hover over components to learn what they do.'),
  'block1Description2', pg_temp.sc('home.learning.block1.description2', 'The built-in code editor lets you write, test, and upload your programs directly from the browser. Real-time syntax highlighting and error checking help you learn proper coding practices from day one.'),
  'block1Cta', pg_temp.sc('home.learning.block1.cta', 'Start Learning'),
  'block2Title', pg_temp.sc('home.learning.block2.title', 'Expert Support When You Need It'),
  'block2Description1', pg_temp.sc('home.learning.block2.description1', 'Stuck on a step? Our community forum, The Lab, connects you with fellow builders and our support team. Most questions get answered within hours, not days.'),
  'block2Description2', pg_temp.sc('home.learning.block2.description2', 'Staff members check in on discussions regularly and reply to questions. Most people hear back the same day.'),
  'block2Cta', pg_temp.sc('home.learning.block2.cta', 'Visit The Lab')
));

SELECT pg_temp.seed_singleton('home_community', jsonb_build_object(
  'title', pg_temp.sc('home.community.title', 'Workshops & The Lab'),
  'description', pg_temp.sc('home.community.description', 'We run in-person workshops across Hawaii, and we have an online forum called The Lab where people ask questions and share what they''re working on.'),
  'workshopsTitle', pg_temp.sc('home.community.workshops.title', 'Upcoming Workshops'),
  'workshopsViewAll', pg_temp.sc('home.community.workshops.viewAll', 'View All'),
  'workshopsEmptyTitle', pg_temp.sc('home.community.workshops.empty.title', 'No Upcoming Events'),
  'workshopsEmptyDescription', pg_temp.sc('home.community.workshops.empty.description', 'Check back soon for new workshops and events in your area.'),
  'workshopsEmptyCta', pg_temp.sc('home.community.workshops.empty.cta', 'View Past Events'),
  'workshopsCta', pg_temp.sc('home.community.workshops.cta', 'Register for a Workshop'),
  'workshopsCtaEmpty', pg_temp.sc('home.community.workshops.ctaEmpty', 'View All Events'),
  'labTitle', pg_temp.sc('home.community.lab.title', 'The Lab'),
  'labJoinNow', pg_temp.sc('home.community.lab.joinNow', 'Join Now'),
  'labMembersLabel', pg_temp.sc('home.community.lab.membersLabel', 'Members'),
  'labDiscussionsLabel', pg_temp.sc('home.community.lab.discussionsLabel', 'Discussions'),
  'labEmptyTitle', pg_temp.sc('home.community.lab.empty.title', 'Be the First to Ask'),
  'labEmptyDescription', pg_temp.sc('home.community.lab.empty.description', 'Start a discussion and help build our community of makers.'),
  'labEmptyCta', pg_temp.sc('home.community.lab.empty.cta', 'Ask a Question'),
  'labCta', pg_temp.sc('home.community.lab.cta', 'Join The Lab')
));

SELECT pg_temp.seed_singleton('shop_page', jsonb_build_object(
  'headerTitle', pg_temp.sc('shop.header.title', 'Shop'),
  'headerDescription', pg_temp.sc('shop.header.description', 'Hardware kits you actually build yourself. No prior experience needed.'),
  'empty', pg_temp.sc('shop.empty', 'No products available at this time.')
));

SELECT pg_temp.seed_singleton('community_page', jsonb_build_object(
  'headerTitle', pg_temp.sc('community.header.title', 'The Lab'),
  'headerDescription', pg_temp.sc('community.header.description', 'Ask questions, share what you''re building, and get help when you''re stuck.'),
  'empty', pg_temp.sc('community.empty', 'No discussions yet. Be the first to ask a question!')
));

SELECT pg_temp.seed_singleton('events_page', jsonb_build_object(
  'headerTitle', pg_temp.sc('events.header.title', 'Events'),
  'headerDescription', pg_temp.sc('events.header.description', 'We run hands-on workshops and competitions across Hawaii if you want to come out and build something with other people.'),
  'empty', pg_temp.sc('events.empty', 'No upcoming events. Check back soon for new workshops and events!')
));

-- freeShippingHint: the legacy value used a ${amount} token; the CMS field
-- uses {amount}, replaced in code with a pre-formatted dollar amount.
SELECT pg_temp.seed_singleton('cart_page', jsonb_build_object(
  'title', pg_temp.sc('cart.title', 'Your Cart'),
  'continueShopping', pg_temp.sc('cart.continueShipping', 'Continue Shopping'),
  'emptyTitle', pg_temp.sc('cart.empty.title', 'Your cart is empty'),
  'emptyDescription', pg_temp.sc('cart.empty.description', 'Looks like you haven''t added anything yet. Check out the kits and see what''s inside.'),
  'emptyCta', pg_temp.sc('cart.empty.cta', 'Browse Kits'),
  'summaryTitle', pg_temp.sc('cart.summary.title', 'Order Summary'),
  'subtotalLabel', pg_temp.sc('cart.summary.subtotal', 'Subtotal'),
  'savingsLabel', pg_temp.sc('cart.summary.savings', 'Your Savings'),
  'shippingLabel', pg_temp.sc('cart.summary.shipping', 'Shipping'),
  'totalLabel', pg_temp.sc('cart.summary.total', 'Total'),
  'freeShippingHint', replace(pg_temp.sc('cart.summary.freeShippingHint', 'Add {amount} more for free shipping'), '${amount}', '{amount}'),
  'checkoutButton', pg_temp.sc('cart.checkout.button', 'Checkout'),
  'processingText', pg_temp.sc('cart.checkout.processing', 'Processing...'),
  'trustFreeShipping', pg_temp.sc('cart.trust.freeShipping', 'Free shipping on orders $75+'),
  'trustSecureCheckout', pg_temp.sc('cart.trust.secureCheckout', 'Secure checkout with Stripe')
));

-- workshop.header.description_signed_out and workshop.pending.* never had
-- site_content rows (code carried the only copy); learn.empty was only ever
-- rendered on this page, so it lands here as coursesEmpty.
SELECT pg_temp.seed_singleton('workshop_page', jsonb_build_object(
  'headerTitle', pg_temp.sc('workshop.header.title', 'Workshop'),
  'headerDescription', pg_temp.sc('workshop.header.description', 'Your personal robotics workspace. Track progress, access tools, and manage your kits.'),
  'headerDescriptionSignedOut', pg_temp.sc('workshop.header.description_signed_out', 'Sign in to access your kits and learning materials.'),
  'noKits', pg_temp.sc('workshop.no_kits', 'You don''t have any kits yet. Purchase a kit to get started!'),
  'signInTitle', pg_temp.sc('workshop.signIn.title', 'Sign In Required'),
  'signInDescription', pg_temp.sc('workshop.signIn.description', 'Sign in to view your kits, track your learning progress, and claim new kit codes.'),
  'signInButton', pg_temp.sc('workshop.signIn.button', 'Sign In'),
  'signInShopButton', pg_temp.sc('workshop.signIn.shopButton', 'Shop Kits'),
  'kitsTitle', pg_temp.sc('workshop.kits.title', 'My Kits'),
  'kitsEmptySubtitle', pg_temp.sc('workshop.kits.empty.subtitle', 'Purchase a kit or enter a code to get started.'),
  'kitsEmptyCta', pg_temp.sc('workshop.kits.empty.cta', 'Browse Kits'),
  'claimTitle', pg_temp.sc('workshop.claim.title', 'Claim a Kit'),
  'claimDescription', pg_temp.sc('workshop.claim.description', 'Have a kit code? Enter it below to activate your kit.'),
  'pendingTitle', pg_temp.sc('workshop.pending.title', 'Pending Licenses'),
  'pendingDescription', pg_temp.sc('workshop.pending.description', 'These licenses were purchased with your email. Claim to add to your account or reject if you didn''t make this purchase.'),
  'coursesEmpty', pg_temp.sc('learn.empty', 'No courses available yet. Check back soon!')
));

SELECT pg_temp.seed_singleton('footer', jsonb_build_object(
  'tagline', pg_temp.sc('footer.brand.tagline', 'Robotics kits for people who are just starting out.'),
  'copyright', pg_temp.sc('footer.copyright', '© 2025-2026 StarterSpark Robotics. All rights reserved.'),
  'newsletterTitle', pg_temp.sc('footer.newsletter.title', 'Stay Updated'),
  'newsletterDescription', pg_temp.sc('footer.newsletter.description', 'Get notified about new kits and workshops.')
));

-- Not migrated (no consumer in code): header.cta, home.events.empty,
-- learn.header.*, home.mission.headline, home.mission.description, the
-- deprecated charity rows, and global.charity.* (the charity claim lives in
-- the impact_stat collection).
DROP TABLE IF EXISTS public.site_content;

DROP FUNCTION pg_temp.seed_singleton(text, jsonb);
DROP FUNCTION pg_temp.sc(text, text);
