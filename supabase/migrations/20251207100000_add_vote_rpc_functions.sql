-- RPC functions for updating vote counts

CREATE OR REPLACE FUNCTION update_post_upvotes(p_post_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE posts
  SET upvotes = COALESCE((
    SELECT SUM(vote_type)::integer
    FROM post_votes
    WHERE post_id = p_post_id
  ), 0)
  WHERE id = p_post_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

CREATE OR REPLACE FUNCTION update_comment_upvotes(p_comment_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE comments
  SET upvotes = COALESCE((
    SELECT SUM(vote_type)::integer
    FROM comment_votes
    WHERE comment_id = p_comment_id
  ), 0)
  WHERE id = p_comment_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION update_post_upvotes(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION update_comment_upvotes(uuid) TO authenticated;
