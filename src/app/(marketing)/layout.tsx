import { Header } from "@/components/layout/Header"
import { Footer } from "@/components/layout/Footer"
import { CartSheet } from "@/components/commerce"
import { SiteBanner } from "@/components/layout/SiteBanner"

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      {/* Skip link for keyboard navigation - hidden until focused */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:bg-cyan-700 focus:text-white focus:rounded focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2"
      >
        Skip to main content
      </a>
      <SiteBanner />
      <Header />
      <main id="main-content" tabIndex={-1} className="outline-none">
        {children}
      </main>
      <Footer />
      <CartSheet />
    </>
  )
}
