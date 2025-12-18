-- Achievements System
-- Phase 20.1: Workshop Enhancements

-- Create achievements table
CREATE TABLE IF NOT EXISTS achievements (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  key text UNIQUE NOT NULL, -- 'first_lesson', 'speed_learner', etc.
  name text NOT NULL,
  description text NOT NULL,
  icon text NOT NULL, -- Lucide icon name
  points integer DEFAULT 10,
  category text DEFAULT 'general', -- 'learning', 'community', 'building', 'special'
  is_secret boolean DEFAULT false, -- Hidden until earned
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Create user_achievements junction table
CREATE TABLE IF NOT EXISTS user_achievements (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  achievement_id uuid REFERENCES achievements(id) ON DELETE CASCADE NOT NULL,
  earned_at timestamptz DEFAULT now(),
  metadata jsonb, -- Extra context (e.g., which lesson, how fast)
  UNIQUE(user_id, achievement_id)
);

-- Enable RLS
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;

-- RLS Policies for achievements (public read)
CREATE POLICY "Public can view achievements"
ON achievements FOR SELECT
USING (true);

-- Admins can manage achievements
CREATE POLICY "Admins can manage achievements"
ON achievements FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'staff')
  )
);

-- RLS Policies for user_achievements
CREATE POLICY "Users can view own achievements"
ON user_achievements FOR SELECT
USING (auth.uid() = user_id);

-- Users can view public achievement stats (for leaderboards later)
CREATE POLICY "Public can count achievements"
ON user_achievements FOR SELECT
USING (true);

-- Service role can insert achievements (via server actions)
-- Note: INSERT via service_role bypasses RLS

-- Create indexes
CREATE INDEX idx_achievements_category ON achievements(category);
CREATE INDEX idx_achievements_key ON achievements(key);
CREATE INDEX idx_user_achievements_user_id ON user_achievements(user_id);
CREATE INDEX idx_user_achievements_achievement_id ON user_achievements(achievement_id);
CREATE INDEX idx_user_achievements_earned_at ON user_achievements(earned_at DESC);

-- Insert initial achievements
INSERT INTO achievements (key, name, description, icon, points, category, sort_order, is_secret) VALUES
-- General achievements
('first_kit', 'Kit Claimed', 'Claimed your first StarterSpark kit', 'Package', 10, 'general', 1, false),
('early_adopter', 'Early Adopter', 'Joined during the first month of launch', 'Star', 50, 'special', 100, false),

-- Learning achievements
('first_lesson', 'First Steps', 'Completed your first lesson', 'BookOpen', 10, 'learning', 10, false),
('five_lessons', 'Getting the Hang of It', 'Completed 5 lessons', 'BookMarked', 20, 'learning', 11, false),
('ten_lessons', 'Dedicated Learner', 'Completed 10 lessons', 'Library', 30, 'learning', 12, false),
('module_complete', 'Module Master', 'Completed an entire module', 'Award', 25, 'learning', 20, false),
('course_complete', 'Graduate', 'Completed an entire course', 'GraduationCap', 100, 'learning', 30, false),
('speed_learner', 'Speed Learner', 'Completed 3 lessons in one day', 'Zap', 20, 'learning', 40, false),
('night_owl', 'Night Owl', 'Completed a lesson after midnight', 'Moon', 15, 'learning', 41, true),

-- Community achievements
('first_question', 'Curious Mind', 'Asked your first question in The Lab', 'HelpCircle', 10, 'community', 50, false),
('first_answer', 'Helpful Friend', 'Answered your first question in The Lab', 'MessageCircle', 10, 'community', 51, false),
('helpful_answer', 'Expert Helper', 'Your answer was marked as verified', 'ThumbsUp', 25, 'community', 52, false),
('five_posts', 'Community Regular', 'Created 5 posts in The Lab', 'Users', 20, 'community', 53, false),

-- Building achievements
('first_build', 'Builder', 'Completed your first project build', 'Hammer', 25, 'building', 60, false),
('wiring_pro', 'Wiring Pro', 'Successfully completed the wiring tutorial', 'Cable', 15, 'building', 61, false),
('code_ninja', 'Code Ninja', 'Uploaded your first custom Arduino sketch', 'Code', 30, 'building', 62, false),

-- Special/Secret achievements
('workshop_attendee', 'Workshop Warrior', 'Attended an in-person workshop event', 'CalendarCheck', 30, 'special', 90, false),
('bug_reporter', 'Bug Hunter', 'Reported a bug that was fixed', 'Bug', 20, 'special', 91, true),
('perfectionist', 'Perfectionist', 'Completed all lessons in a module without any errors', 'CheckCircle', 40, 'special', 92, true)
ON CONFLICT (key) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  icon = EXCLUDED.icon,
  points = EXCLUDED.points,
  category = EXCLUDED.category,
  sort_order = EXCLUDED.sort_order,
  is_secret = EXCLUDED.is_secret;

-- Function to award achievement (idempotent)
CREATE OR REPLACE FUNCTION award_achievement(
  p_user_id uuid,
  p_achievement_key text,
  p_metadata jsonb DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_achievement_id uuid;
  v_already_earned boolean;
BEGIN
  -- Get achievement ID
  SELECT id INTO v_achievement_id
  FROM achievements
  WHERE key = p_achievement_key;

  IF v_achievement_id IS NULL THEN
    RETURN false;
  END IF;

  -- Check if already earned
  SELECT EXISTS(
    SELECT 1 FROM user_achievements
    WHERE user_id = p_user_id AND achievement_id = v_achievement_id
  ) INTO v_already_earned;

  IF v_already_earned THEN
    RETURN false;
  END IF;

  -- Award the achievement
  INSERT INTO user_achievements (user_id, achievement_id, metadata)
  VALUES (p_user_id, v_achievement_id, p_metadata)
  ON CONFLICT (user_id, achievement_id) DO NOTHING;

  RETURN true;
END;
$$;

-- Grant execute to authenticated users (function checks permissions internally)
GRANT EXECUTE ON FUNCTION award_achievement TO authenticated;
GRANT EXECUTE ON FUNCTION award_achievement TO service_role;
