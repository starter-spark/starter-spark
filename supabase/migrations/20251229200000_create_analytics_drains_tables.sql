-- Analytics Drains Storage Tables
-- Stores aggregated data from Vercel drains (Speed Insights, Web Analytics, Logs)

-- Speed Insights metrics aggregated hourly
CREATE TABLE IF NOT EXISTS analytics_speed_insights (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  -- Time bucket (hourly)
  hour_bucket timestamptz NOT NULL,
  -- Route/path info
  path text NOT NULL,
  route text, -- route pattern like /dashboard/[id]
  -- Metric aggregates (storing p75 values)
  lcp_p75 numeric, -- Largest Contentful Paint (ms)
  inp_p75 numeric, -- Interaction to Next Paint (ms)
  cls_p75 numeric, -- Cumulative Layout Shift (score)
  fcp_p75 numeric, -- First Contentful Paint (ms)
  ttfb_p75 numeric, -- Time to First Byte (ms)
  -- Sample counts for each metric
  lcp_count integer DEFAULT 0,
  inp_count integer DEFAULT 0,
  cls_count integer DEFAULT 0,
  fcp_count integer DEFAULT 0,
  ttfb_count integer DEFAULT 0,
  -- Device breakdown
  desktop_count integer DEFAULT 0,
  mobile_count integer DEFAULT 0,
  tablet_count integer DEFAULT 0,
  -- Totals
  total_samples integer DEFAULT 0,
  -- Timestamps
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  -- Unique constraint for upserts
  CONSTRAINT unique_speed_insights_bucket UNIQUE (hour_bucket, path)
);

-- Web Analytics aggregated hourly
CREATE TABLE IF NOT EXISTS analytics_web_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  -- Time bucket (hourly)
  hour_bucket timestamptz NOT NULL,
  -- Event info
  event_type text NOT NULL, -- 'pageview' or 'event'
  path text NOT NULL,
  route text,
  event_name text, -- for custom events
  -- Aggregate counts
  event_count integer DEFAULT 0,
  unique_sessions integer DEFAULT 0,
  unique_devices integer DEFAULT 0,
  -- Referrer breakdown (top referrers stored as JSONB)
  top_referrers jsonb DEFAULT '[]'::jsonb,
  -- Geo breakdown (top countries)
  top_countries jsonb DEFAULT '[]'::jsonb,
  -- Timestamps
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  -- Unique constraint for upserts
  CONSTRAINT unique_web_events_bucket UNIQUE (hour_bucket, event_type, path, event_name)
);

-- Logs aggregated hourly (error/warning counts)
CREATE TABLE IF NOT EXISTS analytics_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  -- Time bucket (hourly)
  hour_bucket timestamptz NOT NULL,
  -- Log source
  source text NOT NULL, -- 'build', 'edge', 'lambda', 'static', 'external', 'firewall', 'redirect'
  -- Severity counts
  info_count integer DEFAULT 0,
  warning_count integer DEFAULT 0,
  error_count integer DEFAULT 0,
  fatal_count integer DEFAULT 0,
  -- Path/endpoint breakdown (top paths with errors)
  error_paths jsonb DEFAULT '[]'::jsonb,
  -- Status code breakdown
  status_codes jsonb DEFAULT '{}'::jsonb,
  -- Total log count
  total_count integer DEFAULT 0,
  -- Timestamps
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  -- Unique constraint for upserts
  CONSTRAINT unique_logs_bucket UNIQUE (hour_bucket, source)
);

-- Summary table for quick dashboard queries
CREATE TABLE IF NOT EXISTS analytics_daily_summary (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  -- Date (daily granularity)
  date date NOT NULL UNIQUE,
  -- Web Analytics totals
  total_pageviews integer DEFAULT 0,
  total_custom_events integer DEFAULT 0,
  unique_sessions integer DEFAULT 0,
  unique_visitors integer DEFAULT 0,
  -- Speed Insights averages (p75)
  avg_lcp numeric,
  avg_inp numeric,
  avg_cls numeric,
  avg_fcp numeric,
  avg_ttfb numeric,
  -- Log totals
  total_errors integer DEFAULT 0,
  total_warnings integer DEFAULT 0,
  -- Top pages
  top_pages jsonb DEFAULT '[]'::jsonb,
  -- Timestamps
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_speed_insights_hour ON analytics_speed_insights(hour_bucket DESC);
CREATE INDEX IF NOT EXISTS idx_speed_insights_path ON analytics_speed_insights(path);
CREATE INDEX IF NOT EXISTS idx_web_events_hour ON analytics_web_events(hour_bucket DESC);
CREATE INDEX IF NOT EXISTS idx_web_events_path ON analytics_web_events(path);
CREATE INDEX IF NOT EXISTS idx_web_events_type ON analytics_web_events(event_type);
CREATE INDEX IF NOT EXISTS idx_logs_hour ON analytics_logs(hour_bucket DESC);
CREATE INDEX IF NOT EXISTS idx_logs_source ON analytics_logs(source);
CREATE INDEX IF NOT EXISTS idx_daily_summary_date ON analytics_daily_summary(date DESC);

-- RLS policies - only service_role can write (from webhooks), admins can read
ALTER TABLE analytics_speed_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_web_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_daily_summary ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DO $$
BEGIN
  DROP POLICY IF EXISTS "Admin read speed insights" ON analytics_speed_insights;
  DROP POLICY IF EXISTS "Admin read web events" ON analytics_web_events;
  DROP POLICY IF EXISTS "Admin read logs" ON analytics_logs;
  DROP POLICY IF EXISTS "Admin read daily summary" ON analytics_daily_summary;
EXCEPTION WHEN undefined_object THEN
  -- Policies don't exist, continue
  NULL;
END $$;

-- Read policies for admins/staff
CREATE POLICY "Admin read speed insights" ON analytics_speed_insights
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'staff')
    )
  );

CREATE POLICY "Admin read web events" ON analytics_web_events
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'staff')
    )
  );

CREATE POLICY "Admin read logs" ON analytics_logs
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'staff')
    )
  );

CREATE POLICY "Admin read daily summary" ON analytics_daily_summary
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'staff')
    )
  );

-- Grant permissions
GRANT SELECT ON analytics_speed_insights TO authenticated;
GRANT SELECT ON analytics_web_events TO authenticated;
GRANT SELECT ON analytics_logs TO authenticated;
GRANT SELECT ON analytics_daily_summary TO authenticated;

-- Function to aggregate daily summary (called by cron or after batch inserts)
CREATE OR REPLACE FUNCTION aggregate_daily_analytics(target_date date DEFAULT CURRENT_DATE)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  start_hour timestamptz;
  end_hour timestamptz;
BEGIN
  start_hour := target_date::timestamptz;
  end_hour := (target_date + interval '1 day')::timestamptz;

  INSERT INTO analytics_daily_summary (
    date,
    total_pageviews,
    total_custom_events,
    unique_sessions,
    avg_lcp,
    avg_inp,
    avg_cls,
    avg_fcp,
    avg_ttfb,
    total_errors,
    total_warnings,
    top_pages
  )
  SELECT
    target_date,
    COALESCE((
      SELECT SUM(event_count)
      FROM analytics_web_events
      WHERE hour_bucket >= start_hour AND hour_bucket < end_hour
      AND event_type = 'pageview'
    ), 0),
    COALESCE((
      SELECT SUM(event_count)
      FROM analytics_web_events
      WHERE hour_bucket >= start_hour AND hour_bucket < end_hour
      AND event_type = 'event'
    ), 0),
    COALESCE((
      SELECT SUM(unique_sessions)
      FROM analytics_web_events
      WHERE hour_bucket >= start_hour AND hour_bucket < end_hour
      AND event_type = 'pageview'
    ), 0),
    (
      SELECT AVG(lcp_p75)
      FROM analytics_speed_insights
      WHERE hour_bucket >= start_hour AND hour_bucket < end_hour
      AND lcp_count > 0
    ),
    (
      SELECT AVG(inp_p75)
      FROM analytics_speed_insights
      WHERE hour_bucket >= start_hour AND hour_bucket < end_hour
      AND inp_count > 0
    ),
    (
      SELECT AVG(cls_p75)
      FROM analytics_speed_insights
      WHERE hour_bucket >= start_hour AND hour_bucket < end_hour
      AND cls_count > 0
    ),
    (
      SELECT AVG(fcp_p75)
      FROM analytics_speed_insights
      WHERE hour_bucket >= start_hour AND hour_bucket < end_hour
      AND fcp_count > 0
    ),
    (
      SELECT AVG(ttfb_p75)
      FROM analytics_speed_insights
      WHERE hour_bucket >= start_hour AND hour_bucket < end_hour
      AND ttfb_count > 0
    ),
    COALESCE((
      SELECT SUM(error_count + fatal_count)
      FROM analytics_logs
      WHERE hour_bucket >= start_hour AND hour_bucket < end_hour
    ), 0),
    COALESCE((
      SELECT SUM(warning_count)
      FROM analytics_logs
      WHERE hour_bucket >= start_hour AND hour_bucket < end_hour
    ), 0),
    COALESCE((
      SELECT jsonb_agg(page_data ORDER BY views DESC)
      FROM (
        SELECT jsonb_build_object('path', path, 'views', SUM(event_count)) as page_data, SUM(event_count) as views
        FROM analytics_web_events
        WHERE hour_bucket >= start_hour AND hour_bucket < end_hour
        AND event_type = 'pageview'
        GROUP BY path
        ORDER BY views DESC
        LIMIT 10
      ) sub
    ), '[]'::jsonb)
  ON CONFLICT (date) DO UPDATE SET
    total_pageviews = EXCLUDED.total_pageviews,
    total_custom_events = EXCLUDED.total_custom_events,
    unique_sessions = EXCLUDED.unique_sessions,
    avg_lcp = EXCLUDED.avg_lcp,
    avg_inp = EXCLUDED.avg_inp,
    avg_cls = EXCLUDED.avg_cls,
    avg_fcp = EXCLUDED.avg_fcp,
    avg_ttfb = EXCLUDED.avg_ttfb,
    total_errors = EXCLUDED.total_errors,
    total_warnings = EXCLUDED.total_warnings,
    top_pages = EXCLUDED.top_pages,
    updated_at = now();
END;
$$;

-- Revoke execute from public, only allow service_role
REVOKE EXECUTE ON FUNCTION aggregate_daily_analytics FROM PUBLIC;
GRANT EXECUTE ON FUNCTION aggregate_daily_analytics TO service_role;
