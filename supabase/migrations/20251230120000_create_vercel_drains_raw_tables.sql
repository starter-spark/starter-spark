-- Raw Vercel Drains ingestion tables (Logs, Speed Insights, Web Analytics, Traces)
-- These tables store raw events for flexible queries and accurate percentile calculations.

-- Speed Insights (web vitals)
CREATE TABLE IF NOT EXISTS vercel_speed_insights_events (
  event_id text PRIMARY KEY,
  received_at timestamptz NOT NULL DEFAULT now(),
  timestamp timestamptz NOT NULL,
  metric_type text NOT NULL,
  value double precision NOT NULL,
  project_id text,
  owner_id text,
  device_id text,
  origin text,
  path text,
  route text,
  country text,
  region text,
  city text,
  os_name text,
  os_version text,
  client_name text,
  client_type text,
  client_version text,
  device_type text,
  device_brand text,
  connection_speed text,
  browser_engine text,
  browser_engine_version text,
  sdk_name text,
  sdk_version text,
  vercel_environment text,
  vercel_url text,
  deployment_id text,
  raw jsonb NOT NULL
);

-- Web Analytics (page views + custom events)
CREATE TABLE IF NOT EXISTS vercel_web_analytics_events (
  event_id text PRIMARY KEY,
  received_at timestamptz NOT NULL DEFAULT now(),
  schema text,
  event_type text NOT NULL,
  event_name text,
  event_data text,
  event_data_json jsonb,
  timestamp timestamptz NOT NULL,
  project_id text,
  owner_id text,
  data_source_name text,
  session_id text,
  device_id text,
  origin text,
  path text NOT NULL,
  referrer text,
  query_params text,
  route text,
  country text,
  region text,
  city text,
  os_name text,
  os_version text,
  client_name text,
  client_type text,
  client_version text,
  device_type text,
  device_brand text,
  device_model text,
  browser_engine text,
  browser_engine_version text,
  sdk_name text,
  sdk_version text,
  sdk_version_full text,
  vercel_environment text,
  vercel_url text,
  flags jsonb,
  deployment text,
  raw jsonb NOT NULL
);

-- Logs (build/runtime/static)
CREATE TABLE IF NOT EXISTS vercel_log_entries (
  id text PRIMARY KEY,
  received_at timestamptz NOT NULL DEFAULT now(),
  deployment_id text,
  source text NOT NULL,
  host text,
  timestamp timestamptz NOT NULL,
  project_id text,
  level text NOT NULL,
  message text,
  build_id text,
  entrypoint text,
  destination text,
  path text,
  type text,
  status_code integer,
  request_id text,
  environment text,
  branch text,
  ja3_digest text,
  ja4_digest text,
  edge_type text,
  project_name text,
  execution_region text,
  trace_id text,
  span_id text,
  proxy jsonb,
  raw jsonb NOT NULL
);

-- Traces (OpenTelemetry over JSON or Protobuf)
CREATE TABLE IF NOT EXISTS vercel_trace_events (
  event_id text PRIMARY KEY,
  received_at timestamptz NOT NULL DEFAULT now(),
  content_type text NOT NULL,
  body_json jsonb,
  body_base64 text
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_vercel_speed_ts ON vercel_speed_insights_events(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_vercel_speed_metric_ts ON vercel_speed_insights_events(metric_type, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_vercel_speed_path ON vercel_speed_insights_events(path);

CREATE INDEX IF NOT EXISTS idx_vercel_web_ts ON vercel_web_analytics_events(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_vercel_web_type_ts ON vercel_web_analytics_events(event_type, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_vercel_web_path ON vercel_web_analytics_events(path);

CREATE INDEX IF NOT EXISTS idx_vercel_logs_ts ON vercel_log_entries(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_vercel_logs_level_ts ON vercel_log_entries(level, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_vercel_logs_source_ts ON vercel_log_entries(source, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_vercel_logs_path ON vercel_log_entries(path);

CREATE INDEX IF NOT EXISTS idx_vercel_traces_received ON vercel_trace_events(received_at DESC);

-- RLS: allow admin/staff reads, block client writes (service_role bypasses RLS).
ALTER TABLE vercel_speed_insights_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE vercel_web_analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE vercel_log_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE vercel_trace_events ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  DROP POLICY IF EXISTS "Admin read vercel speed insights" ON vercel_speed_insights_events;
  DROP POLICY IF EXISTS "Admin read vercel web analytics" ON vercel_web_analytics_events;
  DROP POLICY IF EXISTS "Admin read vercel logs" ON vercel_log_entries;
  DROP POLICY IF EXISTS "Admin read vercel traces" ON vercel_trace_events;
EXCEPTION WHEN undefined_object THEN
  NULL;
END $$;

CREATE POLICY "Admin read vercel speed insights" ON vercel_speed_insights_events
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'staff')
    )
  );

CREATE POLICY "Admin read vercel web analytics" ON vercel_web_analytics_events
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'staff')
    )
  );

CREATE POLICY "Admin read vercel logs" ON vercel_log_entries
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'staff')
    )
  );

CREATE POLICY "Admin read vercel traces" ON vercel_trace_events
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'staff')
    )
  );

-- Grants
GRANT SELECT ON vercel_speed_insights_events TO authenticated;
GRANT SELECT ON vercel_web_analytics_events TO authenticated;
GRANT SELECT ON vercel_log_entries TO authenticated;
GRANT SELECT ON vercel_trace_events TO authenticated;

GRANT ALL ON vercel_speed_insights_events TO service_role;
GRANT ALL ON vercel_web_analytics_events TO service_role;
GRANT ALL ON vercel_log_entries TO service_role;
GRANT ALL ON vercel_trace_events TO service_role;

-- Helper functions for the admin dashboard.

CREATE OR REPLACE FUNCTION analytics_speed_insights_p75(
  start_ts timestamptz,
  end_ts timestamptz
)
RETURNS TABLE (
  metric_type text,
  p75 double precision,
  sample_count bigint
)
LANGUAGE sql
SET search_path = public
AS $$
  SELECT
    metric_type,
    percentile_cont(0.75) WITHIN GROUP (ORDER BY value) AS p75,
    COUNT(*)::bigint AS sample_count
  FROM vercel_speed_insights_events
  WHERE timestamp >= start_ts
    AND timestamp < end_ts
  GROUP BY metric_type
  ORDER BY metric_type;
$$;

CREATE OR REPLACE FUNCTION analytics_web_analytics_overview(
  start_ts timestamptz,
  end_ts timestamptz
)
RETURNS jsonb
LANGUAGE sql
SET search_path = public
AS $$
  SELECT jsonb_build_object(
    'pageviews', COALESCE((
      SELECT COUNT(*)::bigint
      FROM vercel_web_analytics_events
      WHERE timestamp >= start_ts AND timestamp < end_ts
        AND event_type = 'pageview'
    ), 0),
    'events', COALESCE((
      SELECT COUNT(*)::bigint
      FROM vercel_web_analytics_events
      WHERE timestamp >= start_ts AND timestamp < end_ts
        AND event_type = 'event'
    ), 0),
    'unique_sessions', COALESCE((
      SELECT COUNT(DISTINCT session_id)::bigint
      FROM vercel_web_analytics_events
      WHERE timestamp >= start_ts AND timestamp < end_ts
        AND session_id IS NOT NULL
    ), 0),
    'top_pages', COALESCE((
      SELECT jsonb_agg(
        jsonb_build_object('path', path, 'views', views)
        ORDER BY views DESC
      )
      FROM (
        SELECT path, COUNT(*)::bigint AS views
        FROM vercel_web_analytics_events
        WHERE timestamp >= start_ts AND timestamp < end_ts
          AND event_type = 'pageview'
        GROUP BY path
        ORDER BY views DESC
        LIMIT 10
      ) t
    ), '[]'::jsonb)
  );
$$;

CREATE OR REPLACE FUNCTION analytics_logs_overview(
  start_ts timestamptz,
  end_ts timestamptz
)
RETURNS jsonb
LANGUAGE sql
SET search_path = public
AS $$
  SELECT jsonb_build_object(
    'errors', COALESCE((
      SELECT COUNT(*)::bigint
      FROM vercel_log_entries
      WHERE timestamp >= start_ts AND timestamp < end_ts
        AND level IN ('error', 'fatal')
    ), 0),
    'warnings', COALESCE((
      SELECT COUNT(*)::bigint
      FROM vercel_log_entries
      WHERE timestamp >= start_ts AND timestamp < end_ts
        AND level = 'warning'
    ), 0),
    'top_errors', COALESCE((
      SELECT jsonb_agg(
        jsonb_build_object('message', message, 'count', c)
        ORDER BY c DESC
      )
      FROM (
        SELECT message, COUNT(*)::bigint AS c
        FROM vercel_log_entries
        WHERE timestamp >= start_ts AND timestamp < end_ts
          AND level IN ('error', 'fatal')
          AND message IS NOT NULL
        GROUP BY message
        ORDER BY c DESC
        LIMIT 10
      ) t
    ), '[]'::jsonb)
  );
$$;

REVOKE EXECUTE ON FUNCTION analytics_speed_insights_p75(timestamptz, timestamptz) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION analytics_web_analytics_overview(timestamptz, timestamptz) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION analytics_logs_overview(timestamptz, timestamptz) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION analytics_speed_insights_p75(timestamptz, timestamptz) TO authenticated;
GRANT EXECUTE ON FUNCTION analytics_web_analytics_overview(timestamptz, timestamptz) TO authenticated;
GRANT EXECUTE ON FUNCTION analytics_logs_overview(timestamptz, timestamptz) TO authenticated;

