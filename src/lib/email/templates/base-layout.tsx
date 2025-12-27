import {
  Body,
  Container,
  Head,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
} from '@react-email/components'
import * as React from 'react'

interface BaseLayoutProps {
  readonly preview: string
  readonly children: React.ReactNode
}

const baseUrl =
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.VERCEL_BRANCH_URL
    ? `https://${process.env.VERCEL_BRANCH_URL}`
    : null) ||
  (process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : 'http://localhost:3000')

export function BaseLayout({ preview, children }: BaseLayoutProps) {
  return (
    <Html>
      <Head />
      <Preview>{preview}</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header */}
          <Section style={header}>
            <Link href={baseUrl} style={logoLink}>
              <Img
                src={`${baseUrl}/logo.png`}
                width="40"
                height="40"
                alt="StarterSpark"
                style={logo}
              />
              <Text style={logoText}>StarterSpark</Text>
            </Link>
          </Section>

          {/* Main Content */}
          <Section style={content}>{children}</Section>

          {/* Footer */}
          <Section style={footer}>
            <Text style={footerText}>StarterSpark Robotics · Honolulu, HI</Text>
            <Text style={footerText}>
              67% of profits support local STEM education
            </Text>
            <Text style={footerLinks}>
              <Link href={`${baseUrl}/privacy`} style={footerLink}>
                Privacy Policy
              </Link>
              {' · '}
              <Link href={`${baseUrl}/terms`} style={footerLink}>
                Terms of Service
              </Link>
              {' · '}
              <Link href={`${baseUrl}/community`} style={footerLink}>
                Community
              </Link>
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

// Styles
const main = {
  backgroundColor: '#f8fafc',
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
}

const container = {
  margin: '0 auto',
  padding: '40px 20px',
  maxWidth: '600px',
}

const header = {
  textAlign: 'center' as const,
  padding: '20px 0',
}

const logoLink = {
  display: 'inline-flex',
  alignItems: 'center',
  textDecoration: 'none',
}

const logo = {
  marginRight: '8px',
}

const logoText = {
  fontSize: '20px',
  fontWeight: '700',
  color: '#0f172a',
  margin: '0',
  fontFamily: '"Geist Mono", monospace',
}

const content = {
  backgroundColor: '#ffffff',
  borderRadius: '4px',
  border: '1px solid #e2e8f0',
  padding: '32px',
}

const footer = {
  textAlign: 'center' as const,
  padding: '32px 0 16px',
}

const footerText = {
  fontSize: '12px',
  color: '#94a3b8',
  margin: '4px 0',
}

const footerLinks = {
  fontSize: '12px',
  color: '#94a3b8',
  margin: '16px 0 0',
}

const footerLink = {
  color: '#0e7490',
  textDecoration: 'none',
}
