import { type Database, type Json } from './database.types'

type VercelSpeedInsightsEventRow = {
  event_id: string
  received_at: string
  timestamp: string
  metric_type: string
  value: number
  project_id: string | null
  owner_id: string | null
  device_id: string | null
  origin: string | null
  path: string | null
  route: string | null
  country: string | null
  region: string | null
  city: string | null
  os_name: string | null
  os_version: string | null
  client_name: string | null
  client_type: string | null
  client_version: string | null
  device_type: string | null
  device_brand: string | null
  connection_speed: string | null
  browser_engine: string | null
  browser_engine_version: string | null
  sdk_name: string | null
  sdk_version: string | null
  vercel_environment: string | null
  vercel_url: string | null
  deployment_id: string | null
  raw: Json
}

type VercelSpeedInsightsEventInsert = {
  event_id: string
  received_at?: string
  timestamp: string
  metric_type: string
  value: number
  project_id?: string | null
  owner_id?: string | null
  device_id?: string | null
  origin?: string | null
  path?: string | null
  route?: string | null
  country?: string | null
  region?: string | null
  city?: string | null
  os_name?: string | null
  os_version?: string | null
  client_name?: string | null
  client_type?: string | null
  client_version?: string | null
  device_type?: string | null
  device_brand?: string | null
  connection_speed?: string | null
  browser_engine?: string | null
  browser_engine_version?: string | null
  sdk_name?: string | null
  sdk_version?: string | null
  vercel_environment?: string | null
  vercel_url?: string | null
  deployment_id?: string | null
  raw: Json
}

type VercelWebAnalyticsEventRow = {
  event_id: string
  received_at: string
  schema: string | null
  event_type: string
  event_name: string | null
  event_data: string | null
  event_data_json: Json | null
  timestamp: string
  project_id: string | null
  owner_id: string | null
  data_source_name: string | null
  session_id: string | null
  device_id: string | null
  origin: string | null
  path: string
  referrer: string | null
  query_params: string | null
  route: string | null
  country: string | null
  region: string | null
  city: string | null
  os_name: string | null
  os_version: string | null
  client_name: string | null
  client_type: string | null
  client_version: string | null
  device_type: string | null
  device_brand: string | null
  device_model: string | null
  browser_engine: string | null
  browser_engine_version: string | null
  sdk_name: string | null
  sdk_version: string | null
  sdk_version_full: string | null
  vercel_environment: string | null
  vercel_url: string | null
  flags: Json | null
  deployment: string | null
  raw: Json
}

type VercelWebAnalyticsEventInsert = {
  event_id: string
  received_at?: string
  schema?: string | null
  event_type: string
  event_name?: string | null
  event_data?: string | null
  event_data_json?: Json | null
  timestamp: string
  project_id?: string | null
  owner_id?: string | null
  data_source_name?: string | null
  session_id?: string | null
  device_id?: string | null
  origin?: string | null
  path: string
  referrer?: string | null
  query_params?: string | null
  route?: string | null
  country?: string | null
  region?: string | null
  city?: string | null
  os_name?: string | null
  os_version?: string | null
  client_name?: string | null
  client_type?: string | null
  client_version?: string | null
  device_type?: string | null
  device_brand?: string | null
  device_model?: string | null
  browser_engine?: string | null
  browser_engine_version?: string | null
  sdk_name?: string | null
  sdk_version?: string | null
  sdk_version_full?: string | null
  vercel_environment?: string | null
  vercel_url?: string | null
  flags?: Json | null
  deployment?: string | null
  raw: Json
}

type VercelLogEntryRow = {
  id: string
  received_at: string
  deployment_id: string | null
  source: string
  host: string | null
  timestamp: string
  project_id: string | null
  level: string
  message: string | null
  build_id: string | null
  entrypoint: string | null
  destination: string | null
  path: string | null
  type: string | null
  status_code: number | null
  request_id: string | null
  environment: string | null
  branch: string | null
  ja3_digest: string | null
  ja4_digest: string | null
  edge_type: string | null
  project_name: string | null
  execution_region: string | null
  trace_id: string | null
  span_id: string | null
  proxy: Json | null
  raw: Json
}

type VercelLogEntryInsert = {
  id: string
  received_at?: string
  deployment_id?: string | null
  source: string
  host?: string | null
  timestamp: string
  project_id?: string | null
  level: string
  message?: string | null
  build_id?: string | null
  entrypoint?: string | null
  destination?: string | null
  path?: string | null
  type?: string | null
  status_code?: number | null
  request_id?: string | null
  environment?: string | null
  branch?: string | null
  ja3_digest?: string | null
  ja4_digest?: string | null
  edge_type?: string | null
  project_name?: string | null
  execution_region?: string | null
  trace_id?: string | null
  span_id?: string | null
  proxy?: Json | null
  raw: Json
}

type VercelTraceEventRow = {
  event_id: string
  received_at: string
  content_type: string
  body_json: Json | null
  body_base64: string | null
}

type VercelTraceEventInsert = {
  event_id: string
  received_at?: string
  content_type: string
  body_json?: Json | null
  body_base64?: string | null
}

export type AnalyticsDatabase = Database & {
  public: Database['public'] & {
    Tables: Database['public']['Tables'] & {
      vercel_speed_insights_events: {
        Row: VercelSpeedInsightsEventRow
        Insert: VercelSpeedInsightsEventInsert
        Update: Partial<VercelSpeedInsightsEventInsert>
        Relationships: []
      }
      vercel_web_analytics_events: {
        Row: VercelWebAnalyticsEventRow
        Insert: VercelWebAnalyticsEventInsert
        Update: Partial<VercelWebAnalyticsEventInsert>
        Relationships: []
      }
      vercel_log_entries: {
        Row: VercelLogEntryRow
        Insert: VercelLogEntryInsert
        Update: Partial<VercelLogEntryInsert>
        Relationships: []
      }
      vercel_trace_events: {
        Row: VercelTraceEventRow
        Insert: VercelTraceEventInsert
        Update: Partial<VercelTraceEventInsert>
        Relationships: []
      }
    }
    Functions: Database['public']['Functions'] & {
      analytics_speed_insights_p75: {
        Args: { start_ts: string; end_ts: string }
        Returns: Array<{ metric_type: string; p75: number; sample_count: number }>
      }
      analytics_web_analytics_overview: {
        Args: { start_ts: string; end_ts: string }
        Returns: Json
      }
      analytics_logs_overview: {
        Args: { start_ts: string; end_ts: string }
        Returns: Json
      }
    }
  }
}

