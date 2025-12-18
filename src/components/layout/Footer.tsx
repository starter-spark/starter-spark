import { Button } from "@/components/ui/button"
import { GithubIcon, InstagramIcon, YoutubeIcon } from "@/components/icons/brand-icons"
import { Heart } from "lucide-react"
import Link from "next/link"
import { NewsletterForm } from "./NewsletterForm"
import { createClient } from "@/lib/supabase/server"
import { getContents } from "@/lib/content"

// Custom X (Twitter) icon since simple-icons doesn't have it as "X"
function XIcon({ className }: { className?: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className={className} fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  )
}

interface FooterProduct {
  slug: string
  name: string
  status: string
}

export async function Footer() {
  const supabase = await createClient()

  // Fetch dynamic content
  const content = await getContents(
    [
      "footer.copyright",
      "footer.charity.percentage",
      "footer.charity.text",
      "footer.brand.tagline",
      "footer.newsletter.title",
      "footer.newsletter.description",
    ],
    {
      "footer.copyright": "© 2025 StarterSpark Robotics. All rights reserved.",
      "footer.charity.percentage": "70%",
      "footer.charity.text": "of every purchase goes directly to Hawaii STEM charities",
      "footer.brand.tagline": "Open-source robotics education designed by students, for students. Building the next generation of Hawaii's engineers.",
      "footer.newsletter.title": "Stay Updated",
      "footer.newsletter.description": "Get notified about new kits and workshops.",
    }
  )

  // Fetch active products for the footer links
  const { data: products, error } = await supabase
    .from("products")
    .select("slug, name, status")
    .in("status", ["active", "coming_soon"])
    .order("created_at", { ascending: true })
    .limit(5)

  if (error) {
    console.error("Failed to fetch products for footer:", error.message)
  }

  const footerProducts: FooterProduct[] = products || []
  return (
    <footer className="bg-white border-t border-slate-200">
      {/* Charity Banner */}
      <div className="bg-amber-50 border-b border-amber-200 py-4 px-6 lg:px-20">
        <div className="max-w-7xl mx-auto flex items-center justify-center gap-2 text-sm">
          <Heart className="w-4 h-4 text-amber-600" />
          <span className="text-slate-600">
            <span className="font-mono text-amber-700 font-semibold">{content["footer.charity.percentage"]}</span> {content["footer.charity.text"]}
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
            <p className="text-slate-600 max-w-sm mb-6 leading-relaxed text-sm">
              {content["footer.brand.tagline"]}
            </p>
            <div className="flex gap-3">
              <Link href="https://github.com/normalday843812" target="_blank" rel="noopener noreferrer">
                <Button variant="ghost" size="icon" aria-label="GitHub" className="text-slate-500 hover:text-cyan-700 hover:bg-slate-100">
                  <GithubIcon className="w-4 h-4" />
                </Button>
              </Link>
              <Link href="https://x.com/AlQaholic00" target="_blank" rel="noopener noreferrer">
                <Button variant="ghost" size="icon" aria-label="X" className="text-slate-500 hover:text-cyan-700 hover:bg-slate-100">
                  <XIcon className="w-4 h-4" />
                </Button>
              </Link>
              <div className="relative group">
                <Button variant="ghost" size="icon" aria-label="Instagram" className="text-slate-500 cursor-not-allowed" disabled>
                  <InstagramIcon className="w-4 h-4" />
                </Button>
                <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[10px] text-slate-500 font-mono whitespace-nowrap">
                  Coming Soon
                </span>
              </div>
              <Link href="https://www.youtube.com/@CrustySofa" target="_blank" rel="noopener noreferrer">
                <Button variant="ghost" size="icon" aria-label="YouTube" className="text-slate-500 hover:text-cyan-700 hover:bg-slate-100">
                  <YoutubeIcon className="w-4 h-4" />
                </Button>
              </Link>
            </div>
          </div>

          {/* Products Column */}
          <nav aria-label="Products">
            <p className="font-mono text-sm text-cyan-700 mb-4 uppercase tracking-wider">Products</p>
            <ul className="space-y-3 text-sm text-slate-600">
              {footerProducts.map((product) => (
                <li key={product.slug}>
                  {product.status === "coming_soon" ? (
                    <span className="text-slate-400 flex items-center gap-2">
                      {product.name}
                      <span className="text-[10px] font-mono text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                        Soon
                      </span>
                    </span>
                  ) : (
                    <Link
                      href={`/shop/${product.slug}`}
                      className="hover:text-slate-900 transition-colors rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-700 focus-visible:ring-offset-2"
                    >
                      {product.name}
                    </Link>
                  )}
                </li>
              ))}
              <li>
                <Link href="/shop" className="hover:text-slate-900 transition-colors rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-700 focus-visible:ring-offset-2">
                  All Kits
                </Link>
              </li>
            </ul>
          </nav>

          {/* Learn Column */}
          <nav aria-label="Learning resources">
            <p className="font-mono text-sm text-cyan-700 mb-4 uppercase tracking-wider">Learn</p>
            <ul className="space-y-3 text-sm text-slate-600">
              <li>
                <Link href="/learn" className="hover:text-slate-900 transition-colors rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-700 focus-visible:ring-offset-2">
                  Documentation
                </Link>
              </li>
              <li>
                <Link href="/community" className="hover:text-slate-900 transition-colors rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-700 focus-visible:ring-offset-2">
                  The Lab (Q&A)
                </Link>
              </li>
              <li>
                <Link href="/events" className="hover:text-slate-900 transition-colors rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-700 focus-visible:ring-offset-2">
                  Workshops
                </Link>
              </li>
              <li>
                <Link href="/support" className="hover:text-slate-900 transition-colors rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-700 focus-visible:ring-offset-2">
                  Troubleshooting
                </Link>
              </li>
            </ul>
          </nav>

          {/* Company Column */}
          <nav aria-label="Company">
            <p className="font-mono text-sm text-cyan-700 mb-4 uppercase tracking-wider">Company</p>
            <ul className="space-y-3 text-sm text-slate-600">
              <li>
                <Link href="/about" className="hover:text-slate-900 transition-colors rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-700 focus-visible:ring-offset-2">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-slate-900 transition-colors rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-700 focus-visible:ring-offset-2">
                  Contact
                </Link>
              </li>
              <li>
                <a href="mailto:kstewart27@punahou.edu" className="hover:text-slate-900 transition-colors rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-700 focus-visible:ring-offset-2">
                  kstewart27@punahou.edu
                </a>
              </li>
            </ul>
          </nav>

          {/* Newsletter Column */}
          <div>
            <p className="font-mono text-sm text-cyan-700 mb-4 uppercase tracking-wider">{content["footer.newsletter.title"]}</p>
            <p className="text-sm text-slate-600 mb-4">
              {content["footer.newsletter.description"]}
            </p>
            <NewsletterForm />
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-slate-200 py-6 px-6 lg:px-20">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-slate-500">
          <p className="font-mono">{content["footer.copyright"]}</p>
          <nav aria-label="Legal">
            <div className="flex gap-6">
              <Link href="/privacy" className="hover:text-slate-900 transition-colors rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-700 focus-visible:ring-offset-2">
                Privacy
              </Link>
              <Link href="/terms" className="hover:text-slate-900 transition-colors rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-700 focus-visible:ring-offset-2">
                Terms
              </Link>
              <Link href="/contact" className="hover:text-slate-900 transition-colors rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-700 focus-visible:ring-offset-2">
                Contact
              </Link>
            </div>
          </nav>
        </div>
      </div>
    </footer>
  )
}
