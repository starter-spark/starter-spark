import { createClient } from '@/lib/supabase/server'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { NewQuestionForm } from './NewQuestionForm'

export const metadata = {
  title: 'Ask a Question - The Lab',
  description: 'Ask a question and get help from the StarterSpark community.',
}

export default async function NewQuestionPage() {
  const supabase = await createClient()

  // Check if user is logged in
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login?redirect=/community/new')
  }

  // Fetch products for selection
  const { data: products } = await supabase
    .from('products')
    .select('id, name, slug')
    .order('name')

  return (
    <div className="bg-slate-50">
      {/* Breadcrumb */}
      <section className="pt-24 pb-4 px-6 lg:px-20">
        <div className="max-w-3xl mx-auto">
          <Link
            href="/community"
            className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-cyan-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to The Lab
          </Link>
        </div>
      </section>

      {/* Form */}
      <section className="pb-24 px-6 lg:px-20">
        <div className="max-w-3xl mx-auto">
          <h1 className="font-mono text-3xl text-slate-900 mb-2">
            Ask a Question
          </h1>
          <p className="text-slate-600 mb-8">
            Get help from the community. Be specific and include any error
            messages or code snippets.
          </p>

          <NewQuestionForm products={products || []} />
        </div>
      </section>
    </div>
  )
}
