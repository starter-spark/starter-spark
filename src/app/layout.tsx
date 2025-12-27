import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { SpeedInsights } from '@vercel/speed-insights/next'
import { Toaster } from '@/components/ui/sonner'
import { KonamiCode } from '@/components/KonamiCode'
import { Providers } from './providers'
import { siteConfig } from '@/config/site'
import { headers } from 'next/headers'
import './globals.css'
import 'photoswipe/style.css'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: {
    default: `${siteConfig.name} | ${siteConfig.tagline}`,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  metadataBase: new URL(siteConfig.url),
  openGraph: {
    title: siteConfig.name,
    description: siteConfig.description,
    url: siteConfig.url,
    siteName: siteConfig.name,
    locale: 'en_US',
    type: 'website',
    images: [
      {
        url: '/og.png',
        width: 1200,
        height: 630,
        alt: siteConfig.name,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: siteConfig.name,
    description: siteConfig.description,
    images: ['/og.png'],
  },
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const nonce = (await headers()).get('x-nonce') ?? undefined

  return (
    <html lang="en">
      {/* ASCII art (static, avoids hydration issues) */}
      {/*
   ______________    ____  ________________  _____ ____  ___    ____  __ __
  / ___/_  __/   |  / __ \/_  __/ ____/ __ \/ ___// __ \/   |  / __ \/ //_/
  \__ \ / / / /| | / /_/ / / / / __/ / /_/ /\__ \/ /_/ / /| | / /_/ / ,<
 ___/ // / / ___ |/ _, _/ / / / /___/ _, _/___/ / ____/ ___ |/ _, _/ /| |
/____//_/ /_/  |_/_/ |_| /_/ /_____/_/ |_|/____/_/   /_/  |_/_/ |_/_/ |_|

Made by Kai Stewart (normalday843812), https://github.com/normalday843812
      */}
      <head>{nonce && <meta name="csp-nonce" content={nonce} />}</head>
      <body
        data-csp-nonce={nonce}
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Providers>{children}</Providers>
        <Toaster position="top-right" richColors closeButton />
        <KonamiCode />
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  )
}
