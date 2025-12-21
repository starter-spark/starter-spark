import { type MetadataRoute } from "next"
import { siteConfig } from "@/config/site"

export default function robots(): MetadataRoute.Robots {
  const baseUrl = siteConfig.url

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/api/",
          "/auth/",
          "/checkout/",
          "/claim/",
          "/admin/",
          "/_next/",
          "/monitoring",
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}
