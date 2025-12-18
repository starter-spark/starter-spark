import { MetadataRoute } from "next"
import { createClient } from "@/lib/supabase/server"
import { siteConfig } from "@/config/site"

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = await createClient()
  const baseUrl = siteConfig.url

  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${baseUrl}/shop`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/learn`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/community`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.7,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${baseUrl}/events`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.7,
    },
    {
      url: `${baseUrl}/workshop`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.6,
    },
    {
      url: `${baseUrl}/privacy`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${baseUrl}/terms`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.3,
    },
  ]

  // Dynamic product pages
  const { data: products } = await supabase
    .from("products")
    .select("slug, created_at")

  const productPages: MetadataRoute.Sitemap = (products || []).map((product) => ({
    url: `${baseUrl}/shop/${product.slug}`,
    lastModified: product.created_at ? new Date(product.created_at) : new Date(),
    changeFrequency: "weekly",
    priority: 0.8,
  }))

  // Dynamic course pages
  const { data: courses } = await supabase
    .from("courses")
    .select("id, updated_at, products!inner(slug)")

  const coursePages: MetadataRoute.Sitemap = (courses || []).map((course) => {
    const productSlug = (course.products as unknown as { slug: string })?.slug
    return {
      url: `${baseUrl}/learn/${productSlug}`,
      lastModified: course.updated_at ? new Date(course.updated_at) : new Date(),
      changeFrequency: "weekly",
      priority: 0.7,
    }
  })

  // Dynamic community post pages
  const { data: posts } = await supabase
    .from("posts")
    .select("slug, updated_at")
    .order("created_at", { ascending: false })
    .limit(100) // Limit to most recent 100 posts

  const postPages: MetadataRoute.Sitemap = (posts || []).map((post) => ({
    url: `${baseUrl}/community/${post.slug}`,
    lastModified: post.updated_at ? new Date(post.updated_at) : new Date(),
    changeFrequency: "weekly",
    priority: 0.5,
  }))

  return [...staticPages, ...productPages, ...coursePages, ...postPages]
}
