import { Button, Heading, Hr, Section, Text } from '@react-email/components'
import * as React from 'react'
import { BaseLayout } from './base-layout'

interface ContactNotificationEmailProps {
  readonly submissionId?: string
  readonly name: string
  readonly email: string
  readonly subject: string
  readonly message: string
  readonly attachments?: Array<{
    name: string
    size: number
    type: string
  }>
  readonly siteUrl: string
}

export function ContactNotificationEmail({
  submissionId,
  name,
  email,
  subject,
  message,
  attachments,
  siteUrl,
}: ContactNotificationEmailProps) {
  const previewText = 'New contact submission — StarterSpark'
  const adminUrl = `${siteUrl}/admin/support`

  return (
    <BaseLayout preview={previewText}>
      <Heading style={heading}>New contact submission</Heading>

      {submissionId ? (
        <Text style={smallText}>
          Submission ID: <span style={monoValue}>{submissionId}</span>
        </Text>
      ) : null}

      <Section style={card}>
        <Text style={label}>From</Text>
        <Text style={value}>
          {name} · <span style={monoValue}>{email}</span>
        </Text>

        <Text style={label}>Subject</Text>
        <Text style={value}>
          <span style={monoValue}>{subject}</span>
        </Text>

        {attachments && attachments.length > 0 ? (
          <>
            <Text style={label}>Attachments</Text>
            <Text style={value}>
              {attachments.length} file{attachments.length === 1 ? '' : 's'}
            </Text>
            {attachments.slice(0, 5).map((a) => (
              <Text key={a.name} style={attachmentLine}>
                • {a.name} ({formatBytes(a.size)}) · {a.type}
              </Text>
            ))}
            {attachments.length > 5 ? (
              <Text style={attachmentLine}>
                • …and {attachments.length - 5} more
              </Text>
            ) : null}
          </>
        ) : null}
      </Section>

      <Text style={label}>Message</Text>
      <Section style={messageBox}>
        <Text style={messageText}>{message}</Text>
      </Section>

      <Section style={ctaSection}>
        <Button style={primaryButton} href={adminUrl}>
          Open Support Inbox
        </Button>
        <Text style={smallText}>
          Tip: replying to this email should reply to the customer.
        </Text>
      </Section>

      <Hr style={divider} />

      <Text style={smallText}>— StarterSpark</Text>
    </BaseLayout>
  )
}

function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 B'
  let idx = 0
  let value = bytes
  while (value >= 1024 && idx < 3) {
    value /= 1024
    idx += 1
  }
  const rounded = idx === 0 ? Math.round(value) : Math.round(value * 10) / 10
  const unit = idx === 0 ? 'B' : idx === 1 ? 'KB' : idx === 2 ? 'MB' : 'GB'
  return `${rounded} ${unit}`
}

const heading = {
  fontSize: '24px',
  fontWeight: '700',
  color: '#0f172a',
  marginBottom: '16px',
  fontFamily: '"Geist Mono", monospace',
}

const smallText = {
  fontSize: '13px',
  color: '#94a3b8',
  lineHeight: '20px',
  marginBottom: '12px',
}

const card = {
  backgroundColor: '#f8fafc',
  borderRadius: '4px',
  padding: '20px',
  marginBottom: '16px',
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
  fontSize: '14px',
  color: '#475569',
  margin: '0 0 12px 0',
  lineHeight: '22px',
}

const monoValue = {
  fontFamily: '"Geist Mono", "Courier New", monospace',
  backgroundColor: '#f1f5f9',
  padding: '2px 6px',
  borderRadius: '2px',
  color: '#0f172a',
}

const attachmentLine = {
  fontSize: '13px',
  color: '#475569',
  margin: '0 0 6px 0',
  lineHeight: '20px',
}

const messageBox = {
  backgroundColor: '#ffffff',
  borderRadius: '4px',
  border: '1px solid #e2e8f0',
  padding: '16px',
  marginBottom: '20px',
}

const messageText = {
  fontSize: '14px',
  color: '#0f172a',
  margin: '0',
  lineHeight: '22px',
  whiteSpace: 'pre-wrap' as const,
}

const ctaSection = {
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
  marginBottom: '12px',
}

const divider = {
  borderColor: '#e2e8f0',
  margin: '24px 0',
}
