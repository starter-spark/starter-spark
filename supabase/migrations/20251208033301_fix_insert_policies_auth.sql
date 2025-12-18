-- Fix INSERT policies that should require authenticated role

-- comment_votes
DROP POLICY IF EXISTS "Authenticated users can vote on comments" ON comment_votes;
CREATE POLICY "Authenticated users can vote on comments" ON comment_votes
  FOR INSERT TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id);

-- post_votes (check if same issue)
DROP POLICY IF EXISTS "Authenticated users can vote on posts" ON post_votes;
CREATE POLICY "Authenticated users can vote on posts" ON post_votes
  FOR INSERT TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id);

-- posts
DROP POLICY IF EXISTS "Authenticated users can create posts" ON posts;
CREATE POLICY "Authenticated users can create posts" ON posts
  FOR INSERT TO authenticated
  WITH CHECK ((SELECT auth.uid()) = author_id);

-- comments  
DROP POLICY IF EXISTS "Authenticated users can comment" ON comments;
CREATE POLICY "Authenticated users can comment" ON comments
  FOR INSERT TO authenticated
  WITH CHECK ((SELECT auth.uid()) = author_id);

-- lesson_progress
DROP POLICY IF EXISTS "Users can insert their own progress" ON lesson_progress;
CREATE POLICY "Users can insert their own progress" ON lesson_progress
  FOR INSERT TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id);;
