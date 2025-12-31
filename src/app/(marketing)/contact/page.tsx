import { Suspense } from 'react'
import { ContactForm } from './ContactForm'
import {
  Mail,
  Clock,
  MessageSquare,
  Github,
  Instagram,
  Youtube,
  Linkedin,
} from 'lucide-react'
import Link from 'next/link'
import type { Metadata } from 'next'
import { LoadingBlock } from '@/components/loading'

export const metadata: Metadata = {
  title: 'Contact Us',
  description:
    "Get in touch with the StarterSpark team. We're here to help with technical support, educator inquiries, partnerships, and more.",
  openGraph: {
    title: 'Contact Us | StarterSpark',
    description:
      'Get in touch with the StarterSpark team for support, inquiries, and partnerships.',
  },
}

const SOCIAL_LINKS = [
  { icon: Github, href: 'https://github.com/starterspark', label: 'GitHub' },
  {
    icon: Instagram,
    href: 'https://instagram.com/starterspark',
    label: 'Instagram',
  },
  {
    icon: Youtube,
    href: 'https://youtube.com/@starterspark',
    label: 'YouTube',
  },
  {
    icon: Linkedin,
    href: 'https://linkedin.com/company/starterspark',
    label: 'LinkedIn',
  },
]

function ContactFormSkeleton() {
  return (
    <div className="bg-white border border-slate-200 rounded-lg p-6 md:p-8 space-y-6 animate-pulse">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <LoadingBlock className="h-4 w-16 rounded animate-none" tone="strong" />
          <LoadingBlock className="h-10 rounded animate-none" tone="soft" />
        </div>
        <div className="space-y-2">
          <LoadingBlock className="h-4 w-16 rounded animate-none" tone="strong" />
          <LoadingBlock className="h-10 rounded animate-none" tone="soft" />
        </div>
      </div>
      <div className="space-y-2">
        <LoadingBlock className="h-4 w-20 rounded animate-none" tone="strong" />
        <LoadingBlock className="h-10 rounded animate-none" tone="soft" />
      </div>
      <div className="space-y-2">
        <LoadingBlock className="h-4 w-20 rounded animate-none" tone="strong" />
        <LoadingBlock className="h-32 rounded animate-none" tone="soft" />
      </div>
      <LoadingBlock className="h-10 w-32 rounded animate-none" tone="strong" />
    </div>
  )
}

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-6xl mx-auto">
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
              <li className="text-slate-900 font-medium">Contact</li>
            </ol>
          </nav>

          {/* Title block with left accent */}
          <div className="border-l-4 border-cyan-600 pl-4">
            <h1 className="font-mono text-2xl sm:text-3xl font-bold text-slate-900">
              Get in Touch
            </h1>
            <p className="mt-2 text-slate-600 max-w-xl">
              Have a question, feedback, or want to collaborate? Fill out the
              form below and we&apos;ll get back to you as soon as possible.
            </p>
          </div>
        </header>

        {/* Main Content */}
        <main className="px-6 lg:px-8 pb-16">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
            {/* Contact Form */}
            <div className="lg:col-span-2">
              <Suspense fallback={<ContactFormSkeleton />}>
                <ContactForm />
              </Suspense>
            </div>

            {/* Sidebar */}
            <aside className="space-y-6">
              {/* Quick Contact Info */}
              <div className="bg-white border border-slate-200 rounded p-6">
                <h2 className="text-lg font-semibold text-slate-900 mb-4">
                  Other Ways to Reach Us
                </h2>

                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-cyan-50 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Mail className="w-5 h-5 text-cyan-700" />
                    </div>
                    <div>
                      <p className="font-medium text-slate-900">Email</p>
                      <a
                        href="mailto:support@starterspark.org"
                        className="text-sm text-cyan-700 hover:text-cyan-800"
                      >
                        support@starterspark.org
                      </a>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-cyan-50 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Clock className="w-5 h-5 text-cyan-700" />
                    </div>
                    <div>
                      <p className="font-medium text-slate-900">
                        Response Time
                      </p>
                      <p className="text-sm text-slate-600">
                        We typically respond within 24-48 hours
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-cyan-50 rounded-lg flex items-center justify-center flex-shrink-0">
                      <MessageSquare className="w-5 h-5 text-cyan-700" />
                    </div>
                    <div>
                      <p className="font-medium text-slate-900">Community</p>
                      <Link
                        href="/community"
                        className="text-sm text-cyan-700 hover:text-cyan-800"
                      >
                        Join our community forum
                      </Link>
                    </div>
                  </div>
                </div>
              </div>

              {/* Social Links */}
              <div className="bg-white border border-slate-200 rounded p-6">
                <h2 className="text-lg font-semibold text-slate-900 mb-4">
                  Follow Us
                </h2>
                <div className="flex gap-3">
                  {SOCIAL_LINKS.map((social) => (
                    <a
                      key={social.label}
                      href={social.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center text-slate-600 hover:bg-cyan-50 hover:text-cyan-700 transition-colors"
                      aria-label={social.label}
                    >
                      <social.icon className="w-5 h-5" />
                    </a>
                  ))}
                </div>
              </div>

              {/* Support Link */}
              <div className="bg-cyan-50 border border-cyan-200 rounded p-6">
                <h2 className="text-lg font-semibold text-slate-900 mb-2">
                  Need Technical Help?
                </h2>
                <p className="text-sm text-slate-600 mb-4">
                  Check our troubleshooting guide for common issues and
                  solutions.
                </p>
                <Link
                  href="/support"
                  className="text-sm font-medium text-cyan-700 hover:text-cyan-800"
                >
                  View Support Articles &rarr;
                </Link>
              </div>
            </aside>
          </div>
        </main>
      </div>
    </div>
  )
}
