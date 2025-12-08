-- Add 'published' to posts status constraint
ALTER TABLE posts DROP CONSTRAINT IF EXISTS posts_status_check;

ALTER TABLE posts ADD CONSTRAINT posts_status_check
  CHECK (status = ANY (ARRAY['open'::text, 'solved'::text, 'unanswered'::text, 'flagged'::text, 'approved'::text, 'rejected'::text, 'closed'::text, 'published'::text, 'draft'::text, 'archived'::text]));
