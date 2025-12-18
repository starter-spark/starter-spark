-- Remove the subject CHECK constraint to allow free text subjects
-- The old constraint only allowed: 'general', 'technical', 'educator', 'partnership', 'press'
-- The new contact form uses a free text subject field

ALTER TABLE contact_submissions
DROP CONSTRAINT IF EXISTS contact_submissions_subject_check;
