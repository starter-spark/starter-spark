-- Create admin audit log table for tracking sensitive admin actions
CREATE TABLE IF NOT EXISTS admin_audit_log (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  action text NOT NULL,
  resource_type text NOT NULL,
  resource_id text,
  details jsonb,
  ip_address text,
  user_agent text,
  created_at timestamptz DEFAULT now()
);
-- Index for common queries
CREATE INDEX idx_admin_audit_log_user_id ON admin_audit_log(user_id);
CREATE INDEX idx_admin_audit_log_action ON admin_audit_log(action);
CREATE INDEX idx_admin_audit_log_resource_type ON admin_audit_log(resource_type);
CREATE INDEX idx_admin_audit_log_created_at ON admin_audit_log(created_at DESC);
-- Enable RLS
ALTER TABLE admin_audit_log ENABLE ROW LEVEL SECURITY;
-- Only admins can read audit logs
CREATE POLICY "Admins can read audit logs" ON admin_audit_log
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );
-- Service role can insert (from server actions)
-- Note: Inserts happen via service role, not authenticated users directly
-- This prevents users from creating fake audit entries;
