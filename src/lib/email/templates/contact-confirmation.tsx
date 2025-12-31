import { Heading, Hr, Link, Text } from '@react-email/components'
import * as React from 'react'
import { BaseLayout } from './base-layout'

interface ContactConfirmationEmailProps {
  readonly name?: string
  readonly subject: string
  readonly siteUrl: string
}

export function ContactConfirmationEmail({
  name,
  subject,
  siteUrl,
}: ContactConfirmationEmailProps) {
  const previewText = 'We received your message — StarterSpark'

  return (
    <BaseLayout preview={previewText}>
      <Heading style={heading}>We received your message</Heading>

      <Text style={paragraph}>{name ? `Hi ${name},` : 'Hello,'}</Text>

      <Text style={paragraph}>
        Thanks for reaching out. Our team has received your message and will get
        back to you as soon as we can.
      </Text>

      <Text style={paragraph}>
        Subject: <span style={monoValue}>{subject}</span>
      </Text>

      <Hr style={divider} />

      <Text style={smallText}>
        While you wait, you can browse guides in our{' '}
        <Link href={`${siteUrl}/learn`} style={link}>
          Learning Hub
        </Link>{' '}
        or ask the community in{' '}
        <Link href={`${siteUrl}/community`} style={link}>
          The Lab
        </Link>
        .
      </Text>

      <Text style={smallText}>— StarterSpark</Text>
    </BaseLayout>
  )
}

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

const monoValue = {
  fontFamily: '"Geist Mono", "Courier New", monospace',
  backgroundColor: '#f1f5f9',
  padding: '2px 6px',
  borderRadius: '2px',
  color: '#0f172a',
}

const divider = {
  borderColor: '#e2e8f0',
  margin: '24px 0',
}

const smallText = {
  fontSize: '13px',
  color: '#94a3b8',
  lineHeight: '20px',
  marginBottom: '12px',
}

const link = {
  color: '#0e7490',
  textDecoration: 'none',
}

