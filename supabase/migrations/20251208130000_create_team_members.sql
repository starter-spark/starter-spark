-- Phase 15.2: Admin-Editable About Page
-- Create team_members table for managing team profiles

CREATE TABLE IF NOT EXISTS public.team_members (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  role text NOT NULL,
  bio text,
  image_url text,
  social_links jsonb DEFAULT '{}', -- {"github": "...", "linkedin": "...", "twitter": "..."}
  sort_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
-- Enable RLS
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
-- Public can read active team members
CREATE POLICY "Public can read active team members"
  ON public.team_members
  FOR SELECT
  USING (is_active = true);
-- Admin/staff can manage team members
CREATE POLICY "Admin can manage team members"
  ON public.team_members
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'staff')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'staff')
    )
  );
-- Index for sorting
CREATE INDEX idx_team_members_sort ON public.team_members (sort_order, created_at);
-- Add about page content entries to page_content table
INSERT INTO public.page_content (page_key, title, content, published_at)
VALUES
  ('about_hero', 'About Hero', '{"headline": "Our Mission: Ignite STEM Curiosity", "description": "We''re a Honolulu-based nonprofit dedicated to making hands-on robotics education accessible to every student. Through our kits, workshops, and community programs, we''re building the next generation of engineers, makers, and problem-solvers."}', now()),
  ('about_story', 'Our Story', '## The Beginning

StarterSpark was born from a simple observation: too many students think robotics and engineering are "too hard" or "not for them." We set out to change that.

## Our Approach

We believe the best way to learn is by doing. Our kits aren''t just tutorials—they''re hands-on projects that teach real engineering skills. Every component, every lesson, every challenge is designed to build confidence and competence.

## Our Impact

Since 2023, we''ve reached over 500 students across Hawaii, partnered with 12 schools, and donated over $125,000 to local STEM programs. But we''re just getting started.', now())
ON CONFLICT (page_key) DO NOTHING;
-- Seed initial team members (will be replaced with real data)
INSERT INTO public.team_members (name, role, bio, sort_order, is_active)
VALUES
  ('Kai Stewart', 'Founder & Lead Engineer', 'Kai founded StarterSpark after years of teaching robotics to underserved communities. With a background in mechanical engineering and a passion for education, he leads our product development and workshop programs.', 1, true),
  ('Josh Zhang', 'Software Lead', 'Josh brings extensive experience in embedded systems and web development. He designs our curriculum''s software components and maintains our digital learning platform.', 2, true),
  ('Vincent Lau', 'Hardware Engineer', 'Vincent is responsible for kit design and quality assurance. His attention to detail ensures every StarterSpark kit meets our high standards for durability and educational value.', 3, true),
  ('Ryder Kawachika', 'Community Manager', 'Ryder coordinates our workshop programs and school partnerships. She''s the bridge between StarterSpark and the Hawaii STEM community.', 4, true)
ON CONFLICT DO NOTHING;
