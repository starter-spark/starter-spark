import { ImageResponse } from 'next/og'
import { type NextRequest } from 'next/server'
import { rateLimit } from '@/lib/rate-limit'

export const runtime = 'edge'

// OG Image dimensions
const size = {
  width: 1200,
  height: 630,
}

function getAllowedImageHosts(): Set<string> {
  const allowed = new Set<string>(['images.unsplash.com'])

  const supabaseUrl =
    process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
  if (supabaseUrl) {
    try {
      allowed.add(new URL(supabaseUrl).hostname)
    } catch {
      // Ignore invalid env.
    }
  }

  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.VERCEL_BRANCH_URL
      ? `https://${process.env.VERCEL_BRANCH_URL}`
      : null) ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null)

  if (siteUrl) {
    try {
      allowed.add(new URL(siteUrl).hostname)
    } catch {
      // Ignore invalid env.
    }
  }

  return allowed
}

function sanitizeOgImageUrl(value: string | null): string | null {
  if (!value) return null
  if (value.length > 2048) return null

  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.VERCEL_BRANCH_URL
      ? `https://${process.env.VERCEL_BRANCH_URL}`
      : null) ||
    (process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : 'http://localhost:3000')

  let url: URL
  try {
    url = value.startsWith('/') ? new URL(value, siteUrl) : new URL(value)
  } catch {
    return null
  }

  const isLocalDev =
    process.env.NODE_ENV !== 'production' &&
    (url.hostname === 'localhost' || url.hostname === '127.0.0.1')

  if (url.protocol !== 'https:' && !(isLocalDev && url.protocol === 'http:')) {
    return null
  }

  const allowedHosts = getAllowedImageHosts()
  if (!allowedHosts.has(url.hostname)) return null

  return url.toString()
}

export async function GET(request: NextRequest) {
  const rateLimitResponse = await rateLimit(request, 'ogImage')
  if (rateLimitResponse) return rateLimitResponse

  const { searchParams } = request.nextUrl

  // Get dynamic content from query params
  const title = (searchParams.get('title') || 'StarterSpark').slice(0, 140)
  const subtitle = (
    searchParams.get('subtitle') || 'Open Source Robotics Kits'
  ).slice(0, 240)
  const type = searchParams.get('type') || 'default' // default, product, event, post
  const imageUrl = sanitizeOgImageUrl(searchParams.get('image')) // Optional product/event image

  // Load fonts
  const fontOrigin = 'https://fonts.gstatic.com'
  const geistMonoFile = ['X7nN4b87', 'HvSqjb_W', 'IjL4c1vkAQ', '.woff2'].join(
    '',
  )
  const geistSansFile = ['X7ni4bMx', 'S0VlCqOW', 'fSU', '.woff2'].join('')

  const geistMono = await fetch(
    new URL(['s', 'geistmono', 'v1', geistMonoFile].join('/'), fontOrigin),
  ).then((res) => res.arrayBuffer())

  const geistSans = await fetch(
    new URL(['s', 'geist', 'v1', geistSansFile].join('/'), fontOrigin),
  ).then((res) => res.arrayBuffer())

  return new ImageResponse(
    <div
      style={{
        height: '100%',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: '#F8FAFC',
        position: 'relative',
      }}
    >
      {/* Grid pattern background */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: 'radial-gradient(#CBD5E1 1.5px, transparent 1.5px)',
          backgroundSize: '32px 32px',
        }}
      />

      {/* Content container */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          height: '100%',
          width: '100%',
          padding: '48px',
          position: 'relative',
        }}
      >
        {/* Left (text) */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            flex: 1,
            paddingRight: imageUrl ? '32px' : '0',
          }}
        >
          {/* Top section */}
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {/* Type badge */}
            {type !== 'default' && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  marginBottom: '16px',
                }}
              >
                <span
                  style={{
                    backgroundColor:
                      type === 'product'
                        ? '#0E7490'
                        : type === 'event'
                          ? '#F59E0B'
                          : '#06B6D4',
                    color: 'white',
                    padding: '6px 16px',
                    borderRadius: '9999px',
                    fontSize: '18px',
                    fontFamily: 'Geist Mono',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}
                >
                  {type === 'product'
                    ? 'Product'
                    : type === 'event'
                      ? 'Event'
                      : 'Community'}
                </span>
              </div>
            )}

            {/* Title */}
            <h1
              style={{
                fontSize: title.length > 40 ? '48px' : '64px',
                fontFamily: 'Geist Mono',
                fontWeight: 600,
                color: '#0F172A',
                lineHeight: 1.1,
                margin: 0,
                maxWidth: imageUrl ? '600px' : '100%',
              }}
            >
              {title}
            </h1>

            {/* Subtitle */}
            {subtitle && (
              <p
                style={{
                  fontSize: '24px',
                  fontFamily: 'Geist Sans',
                  color: '#475569',
                  marginTop: '16px',
                  maxWidth: imageUrl ? '550px' : '100%',
                  lineHeight: 1.4,
                }}
              >
                {subtitle.length > 120
                  ? subtitle.slice(0, 120) + '...'
                  : subtitle}
              </p>
            )}
          </div>

          {/* Bottom (brand) */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
            }}
          >
            {/* Logo placeholder (cyan square, S) */}
            <div
              style={{
                width: '48px',
                height: '48px',
                backgroundColor: '#0E7490',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <span
                style={{
                  color: 'white',
                  fontSize: '28px',
                  fontFamily: 'Geist Mono',
                  fontWeight: 700,
                }}
              >
                S
              </span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span
                style={{
                  fontSize: '24px',
                  fontFamily: 'Geist Mono',
                  fontWeight: 600,
                  color: '#0F172A',
                }}
              >
                StarterSpark
              </span>
              <span
                style={{
                  fontSize: '14px',
                  fontFamily: 'Geist Sans',
                  color: '#64748B',
                }}
              >
                starterspark.org
              </span>
            </div>
          </div>
        </div>

        {/* Right (image, optional) */}
        {imageUrl && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '450px',
              height: '100%',
            }}
          >
            <div
              style={{
                width: '400px',
                height: '400px',
                borderRadius: '16px',
                backgroundColor: 'white',
                border: '2px solid #E2E8F0',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={imageUrl}
                alt=""
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Charity banner at bottom */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: '48px',
          backgroundColor: '#0E7490',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <span
          style={{
            color: 'white',
            fontSize: '16px',
            fontFamily: 'Geist Sans',
          }}
        >
          67% of profits donated to local STEM charities in Hawaii
        </span>
      </div>
    </div>,
    {
      ...size,
      fonts: [
        {
          name: 'Geist Mono',
          data: geistMono,
          style: 'normal',
          weight: 600,
        },
        {
          name: 'Geist Sans',
          data: geistSans,
          style: 'normal',
          weight: 400,
        },
      ],
    },
  )
}
