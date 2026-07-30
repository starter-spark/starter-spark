'use server'

import { getCollection } from '@/cms/content'

/**
 * Docs search over the cached CMS collections: every whitespace-separated
 * term must appear somewhere in the article, and matches rank by where the
 * terms hit (title over excerpt over body). At documentation scale this
 * replaces the old Postgres full-text function without a database round
 * trip per keystroke.
 */

export interface DocSearchResult {
  key: string
  title: string
  excerpt: string
  categorySlug: string
  categoryName: string
}

export async function searchDocs(query: string): Promise<DocSearchResult[]> {
  const terms = query.trim().toLowerCase().split(/\s+/).filter(Boolean)
  if (terms.length === 0) return []

  const [pages, categories] = await Promise.all([
    getCollection('doc_page'),
    getCollection('doc_category'),
  ])
  const categoriesByKey = new Map(categories.map((c) => [c.key, c]))

  const scored = pages.flatMap((page) => {
    // Articles whose category is unpublished are unreachable — hide them
    const category = categoriesByKey.get(page.data.category)
    if (!category) return []

    const title = page.data.title.toLowerCase()
    const excerpt = page.data.excerpt.toLowerCase()
    const body = page.data.body.toLowerCase()

    let score = 0
    for (const term of terms) {
      if (title.includes(term)) score += 100
      else if (excerpt.includes(term)) score += 20
      else if (body.includes(term)) score += 5
      else return []
    }

    return [
      {
        score,
        result: {
          key: page.key,
          title: page.data.title,
          excerpt: page.data.excerpt || page.data.body.slice(0, 200),
          categorySlug: category.key,
          categoryName: category.data.name,
        },
      },
    ]
  })

  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, 10)
    .map((s) => s.result)
}
