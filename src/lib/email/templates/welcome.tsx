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

interface WelcomeEmailProps {
  readonly userName?: string
  readonly siteUrl: string
}

export function WelcomeEmail({ userName, siteUrl }: WelcomeEmailProps) {
  const previewText =
    "Welcome to StarterSpark - let's build something amazing together!"

  return (
    <BaseLayout preview={previewText}>
      <Heading style={heading}>Welcome to StarterSpark!</Heading>

      <Text style={paragraph}>{userName ? `Hi ${userName},` : 'Hello,'}</Text>

      <Text style={paragraph}>
        Welcome to the StarterSpark community! We&apos;re thrilled to have you
        join us on this journey of hands-on learning and robotics exploration.
      </Text>

      <Section style={missionSection}>
        <Text style={missionText}>
          &ldquo;67% of our profits support local STEM education in Hawaii.
          Every kit you build helps inspire the next generation of engineers and
          makers.&rdquo;
        </Text>
      </Section>

      {/* Getting Started */}
      <Section style={stepsSection}>
        <Text style={sectionHeading}>Getting Started</Text>

        <Section style={stepCard}>
          <Text style={stepNumber}>1</Text>
          <Section style={stepContent}>
            <Text style={stepTitle}>Visit Your Workshop</Text>
            <Text style={stepDescription}>
              Your personal dashboard for managing kits, tracking progress, and
              accessing quick tools.
            </Text>
            <Button style={secondaryButton} href={`${siteUrl}/workshop`}>
              Open Workshop
            </Button>
          </Section>
        </Section>

        <Section style={stepCard}>
          <Text style={stepNumber}>2</Text>
          <Section style={stepContent}>
            <Text style={stepTitle}>Explore the Learning Hub</Text>
            <Text style={stepDescription}>
              Step-by-step tutorials, interactive diagrams, and video guides for
              every skill level.
            </Text>
            <Button style={secondaryButton} href={`${siteUrl}/learn`}>
              Start Learning
            </Button>
          </Section>
        </Section>

        <Section style={stepCard}>
          <Text style={stepNumber}>3</Text>
          <Section style={stepContent}>
            <Text style={stepTitle}>Join the Community</Text>
            <Text style={stepDescription}>
              Ask questions, share your builds, and connect with fellow makers
              in our forum.
            </Text>
            <Button style={secondaryButton} href={`${siteUrl}/community`}>
              Join Discussion
            </Button>
          </Section>
        </Section>
      </Section>

      <Hr style={divider} />

      {/* Have a license code? */}
      <Section style={licenseSection}>
        <Text style={sectionHeading}>Have a License Code?</Text>
        <Text style={paragraph}>
          If you purchased a kit or received a license code, head to your
          Workshop to claim it and unlock all the tutorials and resources for
          your kit.
        </Text>
        <Button style={primaryButton} href={`${siteUrl}/workshop`}>
          Claim a License
        </Button>
      </Section>

      <Hr style={divider} />

      <Text style={helpText}>
        Questions? We&apos;re here to help! Reply to this email or post in our{' '}
        <Link href={`${siteUrl}/community`} style={link}>
          community forum
        </Link>
        . Happy building!
      </Text>

      <Text style={signatureText}>— The StarterSpark Team</Text>
    </BaseLayout>
  )
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
  marginBottom: '16px',
}

const missionSection = {
  backgroundColor: '#f0fdfa',
  borderLeft: '4px solid #0e7490',
  padding: '16px 20px',
  marginBottom: '24px',
}

const missionText = {
  fontSize: '15px',
  fontStyle: 'italic',
  color: '#0e7490',
  margin: '0',
  lineHeight: '24px',
}

const sectionHeading = {
  fontSize: '14px',
  fontWeight: '600',
  color: '#0f172a',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.05em',
  marginBottom: '16px',
}

const stepsSection = {
  marginBottom: '24px',
}

const stepCard = {
  display: 'flex',
  marginBottom: '20px',
}

const stepNumber = {
  fontSize: '14px',
  fontWeight: '700',
  color: '#ffffff',
  backgroundColor: '#0e7490',
  width: '24px',
  height: '24px',
  borderRadius: '50%',
  textAlign: 'center' as const,
  lineHeight: '24px',
  marginRight: '16px',
  flexShrink: '0',
}

const stepContent = {
  flex: '1',
}

const stepTitle = {
  fontSize: '16px',
  fontWeight: '600',
  color: '#0f172a',
  margin: '0 0 4px 0',
}

const stepDescription = {
  fontSize: '14px',
  color: '#475569',
  margin: '0 0 12px 0',
  lineHeight: '22px',
}

const secondaryButton = {
  backgroundColor: '#f8fafc',
  color: '#0e7490',
  fontSize: '14px',
  fontWeight: '600',
  padding: '8px 16px',
  borderRadius: '4px',
  border: '1px solid #e2e8f0',
  textDecoration: 'none',
  display: 'inline-block',
}

const divider = {
  borderColor: '#e2e8f0',
  margin: '24px 0',
}

const licenseSection = {
  textAlign: 'center' as const,
  marginBottom: '0',
}

const primaryButton = {
  backgroundColor: '#0e7490',
  color: '#ffffff',
  fontSize: '16px',
  fontWeight: '600',
  padding: '12px 24px',
  borderRadius: '4px',
  textDecoration: 'none',
  display: 'inline-block',
  marginTop: '8px',
}

const link = {
  color: '#0e7490',
  textDecoration: 'none',
}

const helpText = {
  fontSize: '14px',
  color: '#94a3b8',
  textAlign: 'center' as const,
  marginBottom: '16px',
}

const signatureText = {
  fontSize: '14px',
  color: '#475569',
  fontStyle: 'italic',
  textAlign: 'center' as const,
}
