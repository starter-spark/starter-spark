import { siteConfig } from '@/config/site'

export function getOrganizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: siteConfig.name,
    url: siteConfig.url,
    logo: `${siteConfig.url}/logo.png`,
    description: siteConfig.description,
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'Honolulu',
      addressRegion: 'HI',
      addressCountry: 'US',
    },
    sameAs: [
      siteConfig.links.github,
      siteConfig.links.twitter,
      siteConfig.links.instagram,
    ],
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'customer service',
      email: 'support@starterspark.org',
    },
  }
}

export function getProductSchema(product: {
  name: string
  description: string
  price: number
  slug: string
  sku?: string
  image?: string
  inStock?: boolean
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description,
    sku: product.sku || product.slug,
    url: `${siteConfig.url}/shop/${product.slug}`,
    image: product.image || `${siteConfig.url}/og.png`,
    brand: {
      '@type': 'Brand',
      name: siteConfig.name,
    },
    offers: {
      '@type': 'Offer',
      price: product.price,
      priceCurrency: 'USD',
      availability:
        product.inStock === false
          ? 'https://schema.org/OutOfStock'
          : 'https://schema.org/InStock',
      seller: {
        '@type': 'Organization',
        name: siteConfig.name,
      },
    },
  }
}

export function getBreadcrumbSchema(items: { name: string; url: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url.startsWith('http')
        ? item.url
        : `${siteConfig.url}${item.url}`,
    })),
  }
}

export function getFAQSchema(
  questions: { question: string; answer: string }[],
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: questions.map((q) => ({
      '@type': 'Question',
      name: q.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: q.answer,
      },
    })),
  }
}

export function getEventSchema(event: {
  name: string
  description: string
  startDate: string
  endDate?: string
  location: string
  address?: string
  url?: string
  image?: string
  organizer?: string
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: event.name,
    description: event.description,
    startDate: event.startDate,
    endDate: event.endDate || event.startDate,
    eventStatus: 'https://schema.org/EventScheduled',
    eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
    location: {
      '@type': 'Place',
      name: event.location,
      address: event.address || event.location,
    },
    organizer: {
      '@type': 'Organization',
      name: event.organizer || siteConfig.name,
      url: siteConfig.url,
    },
    image: event.image || `${siteConfig.url}/og.png`,
  }
}

export function getCourseSchema(course: {
  name: string
  description: string
  slug: string
  provider?: string
  difficulty?: string
  duration?: string
  modules?: { name: string; description?: string }[]
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Course',
    name: course.name,
    description: course.description,
    url: `${siteConfig.url}/learn/${course.slug}`,
    provider: {
      '@type': 'Organization',
      name: course.provider || siteConfig.name,
      url: siteConfig.url,
    },
    educationalLevel: course.difficulty || 'Beginner',
    timeRequired: course.duration,
    hasCourseInstance: course.modules?.map((module) => ({
      '@type': 'CourseInstance',
      name: module.name,
      description: module.description,
    })),
  }
}

export function getWebsiteSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: siteConfig.name,
    url: siteConfig.url,
    description: siteConfig.description,
    publisher: {
      '@type': 'Organization',
      name: siteConfig.name,
    },
  }
}

export function jsonLdScript(data: object): string {
  return JSON.stringify(data)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026')
    .replace(/\//g, '\\/')
}
