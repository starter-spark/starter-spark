-- Fix award_achievement function - remove broken JWT check
-- The GRANT statements already restrict access to service_role
-- Problem: current_setting('request.jwt.claim.role', true) returns NULL for service_role
-- connections since they use API key auth, not JWT. NULL IS DISTINCT FROM 'service_role'
-- evaluates to TRUE, causing 42501 Forbidden error.

CREATE OR REPLACE FUNCTION award_achievement(
  p_user_id uuid,
  p_achievement_key text,
  p_metadata jsonb DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_achievement_id uuid;
  v_already_earned boolean;
BEGIN
  -- Look up achievement by key
  SELECT id INTO v_achievement_id FROM achievements WHERE key = p_achievement_key;
  IF v_achievement_id IS NULL THEN RETURN false; END IF;

  -- Check if already earned
  SELECT EXISTS(
    SELECT 1 FROM user_achievements
    WHERE user_id = p_user_id AND achievement_id = v_achievement_id
  ) INTO v_already_earned;
  IF v_already_earned THEN RETURN false; END IF;

  -- Award the achievement
  INSERT INTO user_achievements (user_id, achievement_id, metadata)
  VALUES (p_user_id, v_achievement_id, p_metadata)
  ON CONFLICT (user_id, achievement_id) DO NOTHING;

  RETURN true;
END;
$$;

-- Lock down to service_role only (redo grants to ensure consistency)
REVOKE ALL ON FUNCTION award_achievement(uuid, text, jsonb) FROM PUBLIC;
REVOKE ALL ON FUNCTION award_achievement(uuid, text, jsonb) FROM anon;
REVOKE ALL ON FUNCTION award_achievement(uuid, text, jsonb) FROM authenticated;
GRANT EXECUTE ON FUNCTION award_achievement(uuid, text, jsonb) TO service_role;

-- Add unlock_hint column to achievements table
ALTER TABLE achievements ADD COLUMN IF NOT EXISTS unlock_hint text;

-- Update existing achievements with hints
UPDATE achievements SET unlock_hint = CASE key
  WHEN 'first_kit' THEN 'Claim your first StarterSpark kit'
  WHEN 'early_adopter' THEN 'Join during our launch month'
  WHEN 'first_lesson' THEN 'Complete your first lesson'
  WHEN 'five_lessons' THEN 'Complete 5 lessons total'
  WHEN 'ten_lessons' THEN 'Complete 10 lessons total'
  WHEN 'module_complete' THEN 'Complete all lessons in a module'
  WHEN 'course_complete' THEN 'Complete an entire course'
  WHEN 'speed_learner' THEN 'Complete 3 lessons in one day'
  WHEN 'night_owl' THEN 'Complete a lesson after midnight'
  WHEN 'first_question' THEN 'Ask your first question in the community'
  WHEN 'first_answer' THEN 'Answer a community question'
  WHEN 'helpful_answer' THEN 'Have your answer marked as helpful'
  WHEN 'five_posts' THEN 'Create 5 community posts'
  ELSE unlock_hint -- Keep existing hint if not in list
END
WHERE unlock_hint IS NULL OR unlock_hint = '';
