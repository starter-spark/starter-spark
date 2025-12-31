import { Button } from '@/components/ui/button'
import {
  GithubIcon,
  InstagramIcon,
  YoutubeIcon,
} from '@/components/icons/brand-icons'
import { Heart } from 'lucide-react'
import Link from 'next/link'
import { NewsletterForm } from './NewsletterForm'
import { createPublicClient } from '@/lib/supabase/public'
import { getContents } from '@/lib/content'
import { cn } from '@/lib/utils'

// Custom X (Twitter) icon since simple-icons doesn't have it as "X"
function XIcon({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className={className}
      fill="currentColor"
    >
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  )
}

interface FooterProduct {
  slug: string
  name: string
  status: string
}

const socialButtonClass =
  'text-slate-500 hover:text-cyan-700 hover:bg-slate-100'
const footerLinkClass =
  'hover:text-slate-900 transition-colors rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-700 focus-visible:ring-offset-2'
const footerHeadingClass =
  'font-mono text-sm text-cyan-700 mb-4 uppercase tracking-wider'

export async function Footer() {
  // Fetch dynamic content (using unified global charity keys)
  const content = await getContents(
    [
      'footer.copyright',
      'global.charity.percentage',
      'global.charity.short',
      'footer.brand.tagline',
      'footer.newsletter.title',
      'footer.newsletter.description',
    ],
    {
      'footer.copyright': '© 2025 StarterSpark Robotics. All rights reserved.',
      'global.charity.percentage': '67%',
      'global.charity.short': 'of every purchase goes to Hawaii STEM education',
      'footer.brand.tagline':
        "Open-source robotics education designed by students, for students. Building the next generation of Hawaii's engineers.",
      'footer.newsletter.title': 'Stay Updated',
      'footer.newsletter.description':
        'Get notified about new kits and workshops.',
    },
  )

  let footerProducts: FooterProduct[] = []
  try {
    const supabase = createPublicClient()
    const { data: products, error } = await supabase
      .from('products')
      .select('slug, name, status')
      .in('status', ['active', 'coming_soon'])
      .order('created_at', { ascending: true })
      .limit(5)

    if (error) {
      console.error('Failed to fetch products for footer:', error.message)
    }
    footerProducts = products || []
  } catch (error) {
    console.error('Failed to fetch products for footer:', error)
  }
  return (
    <footer className="bg-white border-t border-slate-200">
      {/* Charity Banner */}
      <div className="bg-amber-50 border-b border-amber-200 py-4 px-6 lg:px-20">
        <div className="max-w-7xl mx-auto flex items-center justify-center gap-2 text-sm">
          <Heart className="w-4 h-4 text-amber-600" />
          <span className="text-slate-600 break-words">
            <span className="font-mono text-amber-700 font-semibold">
              {content['global.charity.percentage']}
            </span>{' '}
            {content['global.charity.short']}
          </span>
        </div>
      </div>

      <div className="py-16 px-6 lg:px-20">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-12">
          {/* Brand Column */}
          <div className="lg:col-span-2">
            <p className="text-2xl font-bold text-slate-900 mb-4 tracking-tighter font-mono">
              STARTER<span className="text-cyan-700">SPARK</span>
            </p>
            <p className="text-slate-600 max-w-sm mb-6 leading-relaxed text-sm break-words">
              {content['footer.brand.tagline']}
            </p>
            <div className="flex gap-3">
              <Button
                asChild
                variant="ghost"
                size="icon"
                aria-label="GitHub"
                className={socialButtonClass}
              >
                <a
                  href="https://github.com/normalday843812"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <GithubIcon className="w-4 h-4" />
                </a>
              </Button>
              <Button
                asChild
                variant="ghost"
                size="icon"
                aria-label="X"
                className={socialButtonClass}
              >
                <a
                  href="https://x.com/AlQaholic00"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <XIcon className="w-4 h-4" />
                </a>
              </Button>
              <div className="relative group">
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Instagram (Coming Soon)"
                  className="text-slate-500 cursor-not-allowed"
                  disabled
                >
                  <InstagramIcon className="w-4 h-4" />
                </Button>
                <span
                  aria-hidden="true"
                  className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[10px] text-slate-500 font-mono whitespace-nowrap"
                >
                  Coming Soon
                </span>
              </div>
              <Button
                asChild
                variant="ghost"
                size="icon"
                aria-label="YouTube"
                className={socialButtonClass}
              >
                <a
                  href="https://www.youtube.com/@CrustySofa"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <YoutubeIcon className="w-4 h-4" />
                </a>
              </Button>
            </div>
          </div>

          {/* Products Column */}
          <nav aria-label="Products">
            <p className={footerHeadingClass}>Products</p>
            <ul className="space-y-3 text-sm text-slate-600">
              {footerProducts.map((product) => (
                <li key={product.slug}>
                  {product.status === 'coming_soon' ? (
                    <span className="text-slate-400 flex items-center gap-2">
                      {product.name}
                      <span className="text-[10px] font-mono text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                        Soon
                      </span>
                    </span>
                  ) : (
                    <Link
                      href={`/shop/${product.slug}`}
                      className={footerLinkClass}
                    >
                      {product.name}
                    </Link>
                  )}
                </li>
              ))}
              <li>
                <Link
                  href="/shop"
                  className={footerLinkClass}
                >
                  All Kits
                </Link>
              </li>
            </ul>
          </nav>

          {/* Learn Column */}
          <nav aria-label="Learning resources">
            <p className={footerHeadingClass}>Learn</p>
            <ul className="space-y-3 text-sm text-slate-600">
              <li>
                <Link
                  href="/learn"
                  className={footerLinkClass}
                >
                  Documentation
                </Link>
              </li>
              <li>
                <Link
                  href="/community"
                  className={footerLinkClass}
                >
                  The Lab (Q&A)
                </Link>
              </li>
              <li>
                <Link
                  href="/events"
                  className={footerLinkClass}
                >
                  Workshops
                </Link>
              </li>
              <li>
                <Link
                  href="/support"
                  className={footerLinkClass}
                >
                  Troubleshooting
                </Link>
              </li>
            </ul>
          </nav>

          {/* Company Column */}
          <nav aria-label="Company">
            <p className={footerHeadingClass}>Company</p>
            <ul className="space-y-3 text-sm text-slate-600">
              <li>
                <Link
                  href="/about"
                  className={footerLinkClass}
                >
                  About Us
                </Link>
              </li>
              <li>
                <Link
                  href="/contact"
                  className={footerLinkClass}
                >
                  Contact
                </Link>
              </li>
              <li>
                <a
                  href="mailto:support@starterspark.org"
                  className={footerLinkClass}
                >
                  support@starterspark.org
                </a>
              </li>
            </ul>
          </nav>

          {/* Newsletter Column */}
          <div>
            <p className={cn(footerHeadingClass, 'break-words')}>
              {content['footer.newsletter.title']}
            </p>
            <p className="text-sm text-slate-600 mb-4 break-words">
              {content['footer.newsletter.description']}
            </p>
            <NewsletterForm />
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-slate-200 py-6 px-6 lg:px-20">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-slate-500">
          <p className="font-mono break-words">{content['footer.copyright']}</p>
          <nav aria-label="Legal">
            <div className="flex gap-6">
              <Link
                href="/privacy"
                className={footerLinkClass}
              >
                Privacy
              </Link>
              <Link
                href="/terms"
                className={footerLinkClass}
              >
                Terms
              </Link>
              <Link
                href="/contact"
                className={footerLinkClass}
              >
                Contact
              </Link>
            </div>
          </nav>
        </div>
      </div>
    </footer>
  )
}
