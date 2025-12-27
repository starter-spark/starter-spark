import { createPublicClient } from '@/lib/supabase/public'

export async function getContent(
  key: string,
  defaultValue = '',
): Promise<string> {
  const supabase = createPublicClient()
  const { data, error } = await supabase
    .from('site_content')
    .select('content')
    .eq('content_key', key)
    .maybeSingle()

  if (error) {
    console.error(`Error fetching site_content for key "${key}":`, error)
    return defaultValue
  }

  return data?.content || defaultValue
}

export async function getContents(
  keys: string[],
  defaults?: Record<string, string>,
): Promise<Record<string, string>> {
  const result: Record<string, string> = { ...defaults }
  if (keys.length === 0) return result

  const supabase = createPublicClient()
  const { data, error } = await supabase
    .from('site_content')
    .select('content_key, content')
    .in('content_key', keys)

  if (error) {
    console.error('Error fetching site_content keys:', { keys, error })
    return result
  }

  for (const item of data) {
    result[item.content_key] = item.content
  }
  return result
}

export async function getContentsByCategory(
  category: string,
): Promise<Record<string, string>> {
  const supabase = createPublicClient()
  const { data } = await supabase
    .from('site_content')
    .select('content_key, content')
    .eq('category', category)
    .order('sort_order', { ascending: true })

  const result: Record<string, string> = {}
  for (const item of data ?? []) {
    result[item.content_key] = item.content
  }
  return result
}

export interface ContentItem {
  id: string
  content_key: string
  content_type: string
  content: string
  default_value: string | null
  description: string | null
  category: string
  sort_order: number | null
  updated_at: string | null
}

export async function getAllContent(): Promise<ContentItem[]> {
  const supabase = createPublicClient()
  const { data } = await supabase
    .from('site_content')
    .select('*')
    .order('category', { ascending: true })
    .order('sort_order', { ascending: true })

  return (data || []) as ContentItem[]
}

export async function getContentByCategory(
  category: string,
): Promise<ContentItem[]> {
  const supabase = createPublicClient()
  const { data } = await supabase
    .from('site_content')
    .select('*')
    .eq('category', category)
    .order('sort_order', { ascending: true })

  return (data || []) as ContentItem[]
}
