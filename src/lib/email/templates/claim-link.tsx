import {
  Button,
  Heading,
  Hr,
  Link,
  Section,
  Text,
} from '@react-email/components'
import * as React from 'react'
import { BaseLayout } from './base-layout'
import { maskLicenseCode as maskLicenseCodeValue } from '@/lib/masks'

interface ClaimLinkEmailProps {
  readonly productName: string
  readonly licenseCode: string
  readonly claimToken: string
  readonly siteUrl: string
}

export function ClaimLinkEmail({
  productName,
  licenseCode,
  claimToken,
  siteUrl,
}: ClaimLinkEmailProps) {
  const claimUrl = `${siteUrl}/claim/${claimToken}`
  const previewText = `Claim your ${productName} license to access tutorials and resources`

  return (
    <BaseLayout preview={previewText}>
      <Heading style={heading}>Claim Your License</Heading>

      <Text style={paragraph}>
        You recently purchased a {productName} from StarterSpark. To access your
        kit&apos;s tutorials, assembly guides, and community features, please
        claim your license by clicking the button below.
      </Text>

      {/* License Info */}
      <Section style={licenseSection}>
        <Text style={label}>Product</Text>
        <Text style={value}>{productName}</Text>
        <Text style={label}>License Code</Text>
        <Text style={codeValue}>{maskLicenseCode(licenseCode)}</Text>
      </Section>

      {/* CTA */}
      <Section style={ctaSection}>
        <Button style={primaryButton} href={claimUrl}>
          Claim Your License
        </Button>
        <Text style={smallText}>
          Or copy this link:{' '}
          <Link href={claimUrl} style={link}>
            {claimUrl}
          </Link>
        </Text>
      </Section>

      <Hr style={divider} />

      {/* What you get */}
      <Section style={benefitsSection}>
        <Text style={sectionHeading}>What You&apos;ll Get Access To</Text>
        <Text style={benefitItem}>✓ Step-by-step assembly tutorials</Text>
        <Text style={benefitItem}>✓ Interactive wiring diagrams</Text>
        <Text style={benefitItem}>✓ Arduino programming guides</Text>
        <Text style={benefitItem}>✓ Community forum support</Text>
        <Text style={benefitItem}>
          ✓ Quick tools (Servo Calculator, Pinout Reference)
        </Text>
      </Section>

      <Hr style={divider} />

      <Text style={expirationText}>
        This claim link expires in 30 days. If you have any questions, reply to
        this email or visit our{' '}
        <Link href={`${siteUrl}/community`} style={link}>
          community forum
        </Link>
        .
      </Text>

      <Text style={manualClaimText}>
        Alternatively, you can claim your license manually by logging in to{' '}
        <Link href={`${siteUrl}/workshop`} style={link}>
          your Workshop
        </Link>{' '}
        and entering your full license code.
      </Text>
    </BaseLayout>
  )
}

// Helper to mask license code for display
function maskLicenseCode(code: string): string {
  return maskLicenseCodeValue(code, { mode: 'hyphenated' })
}

// Styles
const heading = {
  fontSize: '24px',
  fontWeight: '700',
  color: '#0f172a',
  marginBottom: '24px',
  fontFamily: '"Geist Mono", monospace',
}

const paragraph = {
  fontSize: '16px',
  lineHeight: '26px',
  color: '#475569',
  marginBottom: '24px',
}

const licenseSection = {
  backgroundColor: '#f8fafc',
  borderRadius: '4px',
  padding: '20px',
  marginBottom: '24px',
}

const label = {
  fontSize: '12px',
  fontWeight: '600',
  color: '#94a3b8',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.05em',
  margin: '0 0 4px 0',
}

const value = {
  fontSize: '16px',
  fontWeight: '600',
  color: '#0f172a',
  margin: '0 0 16px 0',
}

const codeValue = {
  fontSize: '16px',
  fontFamily: '"Geist Mono", "Courier New", monospace',
  color: '#0f172a',
  backgroundColor: '#ffffff',
  padding: '8px 12px',
  borderRadius: '4px',
  border: '1px solid #e2e8f0',
  display: 'inline-block',
  margin: '0',
}

const ctaSection = {
  textAlign: 'center' as const,
  marginBottom: '24px',
}

const primaryButton = {
  backgroundColor: '#0e7490',
  color: '#ffffff',
  fontSize: '16px',
  fontWeight: '600',
  padding: '14px 32px',
  borderRadius: '4px',
  textDecoration: 'none',
  display: 'inline-block',
  marginBottom: '16px',
}

const smallText = {
  fontSize: '13px',
  color: '#94a3b8',
  lineHeight: '20px',
  wordBreak: 'break-all' as const,
}

const link = {
  color: '#0e7490',
  textDecoration: 'none',
}

const divider = {
  borderColor: '#e2e8f0',
  margin: '24px 0',
}

const sectionHeading = {
  fontSize: '14px',
  fontWeight: '600',
  color: '#0f172a',
  marginBottom: '12px',
}

const benefitsSection = {
  marginBottom: '0',
}

const benefitItem = {
  fontSize: '14px',
  color: '#475569',
  margin: '8px 0',
  lineHeight: '20px',
}

const expirationText = {
  fontSize: '13px',
  color: '#94a3b8',
  lineHeight: '20px',
  marginBottom: '12px',
}

const manualClaimText = {
  fontSize: '13px',
  color: '#94a3b8',
  lineHeight: '20px',
}
