import { createClient } from '@/lib/supabase/server'
import { Suspense } from 'react'
import Link from 'next/link'
import type { Metadata } from 'next'
import { SupportArticles } from './SupportArticles'
import { MessageCircle, BookOpen, Mail } from 'lucide-react'
import { LoadingBlock } from '@/components/loading'

export const metadata: Metadata = {
  title: 'Support & Troubleshooting',
  description:
    'Find answers to common questions and troubleshooting guides for your StarterSpark robotics kit.',
  openGraph: {
    title: 'Support & Troubleshooting | StarterSpark',
    description: 'Find answers to common questions and troubleshooting guides.',
  },
}

const CATEGORIES = [
  { key: 'assembly', label: 'Assembly', icon: 'wrench' },
  { key: 'electronics', label: 'Electronics', icon: 'cpu' },
  { key: 'software', label: 'Software', icon: 'code' },
  { key: 'account', label: 'Account', icon: 'user' },
  { key: 'shipping', label: 'Shipping', icon: 'truck' },
  { key: 'general', label: 'General', icon: 'help-circle' },
] as const

async function getArticles() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('troubleshooting_articles')
    .select('*')
    .eq('is_published', true)
    .order('category')
    .order('sort_order')

  return data || []
}

function ArticlesSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3, 4, 5].map((i) => (
        <div
          key={i}
          className="bg-white border border-slate-200 rounded-lg p-4 animate-pulse"
        >
          <LoadingBlock className="h-5 w-2/3 rounded mb-2 animate-none" tone="strong" />
          <LoadingBlock className="h-4 w-1/2 rounded animate-none" tone="soft" />
        </div>
      ))}
    </div>
  )
}

export default async function SupportPage() {
  const articles = await getArticles()

  // Group articles by category
  const articlesByCategory = articles.reduce<Record<string, typeof articles>>(
    (acc, article) => {
      if (!acc[article.category]) {
        acc[article.category] = []
      }
      acc[article.category].push(article)
      return acc
    },
    {},
  )

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <header className="px-6 lg:px-8 pt-8 pb-6">
          {/* Breadcrumb */}
          <nav aria-label="Breadcrumb" className="mb-6">
            <ol className="flex items-center gap-2 text-sm text-slate-500">
              <li>
                <Link href="/" className="hover:text-cyan-700 transition-colors">
                  Home
                </Link>
              </li>
              <li aria-hidden="true">/</li>
              <li className="text-slate-900 font-medium">Support</li>
            </ol>
          </nav>

          {/* Title block with left accent */}
          <div className="border-l-4 border-cyan-600 pl-4">
            <h1 className="font-mono text-2xl sm:text-3xl font-bold text-slate-900">
              How Can We Help?
            </h1>
            <p className="mt-2 text-slate-600">
              Find answers to common questions, troubleshooting guides, and
              helpful resources for your StarterSpark robotics kit.
            </p>
          </div>
        </header>

        {/* Main Content */}
        <main className="px-6 lg:px-8 pb-16">
          {/* Quick Links */}
          <nav aria-label="Quick links" className="mb-10">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Link
                href="/docs"
                className="bg-white border border-slate-200 rounded p-5 hover:border-cyan-300 transition-all group"
              >
                <div className="w-10 h-10 bg-cyan-50 rounded flex items-center justify-center mb-3 group-hover:bg-cyan-100 transition-colors">
                  <BookOpen className="w-5 h-5 text-cyan-700" />
                </div>
                <h3 className="font-semibold text-slate-900 mb-1">
                  Documentation
                </h3>
                <p className="text-sm text-slate-600">
                  Complete guides and API reference
                </p>
              </Link>

              <Link
                href="/community"
                className="bg-white border border-slate-200 rounded p-5 hover:border-cyan-300 transition-all group"
              >
                <div className="w-10 h-10 bg-cyan-50 rounded flex items-center justify-center mb-3 group-hover:bg-cyan-100 transition-colors">
                  <MessageCircle className="w-5 h-5 text-cyan-700" />
                </div>
                <h3 className="font-semibold text-slate-900 mb-1">
                  Community Forum
                </h3>
                <p className="text-sm text-slate-600">
                  Ask questions and share projects
                </p>
              </Link>

              <Link
                href="/contact"
                className="bg-white border border-slate-200 rounded p-5 hover:border-cyan-300 transition-all group"
              >
                <div className="w-10 h-10 bg-cyan-50 rounded flex items-center justify-center mb-3 group-hover:bg-cyan-100 transition-colors">
                  <Mail className="w-5 h-5 text-cyan-700" />
                </div>
                <h3 className="font-semibold text-slate-900 mb-1">
                  Contact Support
                </h3>
                <p className="text-sm text-slate-600">
                  Get help from our team directly
                </p>
              </Link>
            </div>
          </nav>

          {/* Troubleshooting Articles */}
          <section aria-labelledby="troubleshooting-heading">
            <h2 id="troubleshooting-heading" className="font-mono text-xl font-bold text-slate-900 mb-6">
              Troubleshooting Guides
            </h2>

            <Suspense fallback={<ArticlesSkeleton />}>
              <SupportArticles
                articlesByCategory={articlesByCategory}
                categories={CATEGORIES}
              />
            </Suspense>

            {/* Can't find answer */}
            <div className="mt-12 bg-cyan-50 border border-cyan-200 rounded p-6 text-center">
              <h3 className="text-lg font-semibold text-slate-900 mb-2">
                Can&apos;t find what you&apos;re looking for?
              </h3>
              <p className="text-slate-600 mb-4">
                Our team is here to help. Reach out and we&apos;ll get back to you
                within 24-48 hours.
              </p>
              <Link
                href="/contact?subject=technical"
                className="inline-flex items-center gap-2 bg-cyan-700 text-white px-4 py-2 rounded hover:bg-cyan-600 transition-colors"
              >
                <Mail className="w-4 h-4" />
                Contact Support
              </Link>
            </div>
          </section>
        </main>
      </div>
    </div>
  )
}
