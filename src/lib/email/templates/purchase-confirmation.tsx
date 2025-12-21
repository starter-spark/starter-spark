import {
  Button,
  Heading,
  Hr,
  Link,
  Section,
  Text,
} from "@react-email/components"
import * as React from "react"
import { BaseLayout } from "./base-layout"

interface LicenseInfo {
  code: string
  productName: string
  claimToken?: string | null
}

interface PurchaseConfirmationProps {
  readonly customerName?: string
  readonly orderTotal: string
  readonly licenses: LicenseInfo[]
  readonly isGuestPurchase: boolean
  readonly siteUrl: string
}

export function PurchaseConfirmationEmail({
  customerName,
  orderTotal,
  licenses,
  isGuestPurchase,
  siteUrl,
}: PurchaseConfirmationProps) {
  const licenseCount = licenses.length
  const licenseLabel = licenseCount === 1 ? "license" : "licenses"
  const previewText = `Your StarterSpark order is confirmed - ${String(licenseCount)} ${licenseLabel} included`

  return (
    <BaseLayout preview={previewText}>
      <Heading style={heading}>Order Confirmed!</Heading>

      <Text style={paragraph}>
        {customerName ? `Hi ${customerName},` : "Hello,"}
      </Text>

      <Text style={paragraph}>
        Thank you for your purchase! Your order has been confirmed and your
        license{licenses.length > 1 ? "s are" : " is"} ready.
      </Text>

      {/* Order Summary */}
      <Section style={orderSection}>
        <Text style={sectionHeading}>Order Summary</Text>
        {licenses.map((license, index) => (
          <Section key={index} style={licenseCard}>
            <Text style={productName}>{license.productName}</Text>
            <Text style={licenseCode}>
              License Code: <span style={codeValue}>{license.code}</span>
            </Text>
          </Section>
        ))}
        <Hr style={divider} />
        <Text style={totalText}>
          Total: <span style={totalValue}>{orderTotal}</span>
        </Text>
      </Section>

      {/* Next Steps */}
      <Section style={nextStepsSection}>
        <Text style={sectionHeading}>Next Steps</Text>

        {isGuestPurchase ? (
          <>
            <Text style={paragraph}>
              To access your kit&apos;s tutorials, tools, and community features,
              you&apos;ll need to claim your license. Click the button below to
              create your account and get started:
            </Text>

            {licenses.map((license, index) => (
              license.claimToken && (
                <Button
                  key={index}
                  style={primaryButton}
                  href={`${siteUrl}/claim/${license.claimToken}`}
                >
                  Claim Your License
                </Button>
              )
            ))}

            <Text style={smallText}>
              This claim link will work for 30 days. After claiming, you&apos;ll have
              full access to your kit&apos;s resources in your Workshop.
            </Text>
          </>
        ) : (
          <>
            <Text style={paragraph}>
              Your license has been automatically added to your account. Head to
              your Workshop to access tutorials, assembly guides, and community
              support.
            </Text>

            <Button style={primaryButton} href={`${siteUrl}/workshop`}>
              Go to Workshop
            </Button>
          </>
        )}
      </Section>

      {/* Resources */}
      <Section style={resourcesSection}>
        <Text style={sectionHeading}>Helpful Resources</Text>
        <Text style={resourceLink}>
          <Link href={`${siteUrl}/learn`} style={link}>
            📚 Learning Hub
          </Link>
          {" - "}
          Step-by-step assembly guides and tutorials
        </Text>
        <Text style={resourceLink}>
          <Link href={`${siteUrl}/community`} style={link}>
            💬 Community Forum
          </Link>
          {" - "}
          Get help and share your projects
        </Text>
        <Text style={resourceLink}>
          <Link href={`${siteUrl}/events`} style={link}>
            📅 Workshops & Events
          </Link>
          {" - "}
          Join upcoming hands-on sessions
        </Text>
      </Section>

      <Hr style={divider} />

      <Text style={helpText}>
        Need help? Reply to this email or visit our{" "}
        <Link href={`${siteUrl}/community`} style={link}>
          community forum
        </Link>
        . We&apos;re here to help you succeed!
      </Text>
    </BaseLayout>
  )
}

// Styles
const heading = {
  fontSize: "24px",
  fontWeight: "700",
  color: "#0f172a",
  marginBottom: "24px",
  fontFamily: '"Geist Mono", monospace',
}

const paragraph = {
  fontSize: "16px",
  lineHeight: "26px",
  color: "#475569",
  marginBottom: "16px",
}

const sectionHeading = {
  fontSize: "14px",
  fontWeight: "600",
  color: "#0f172a",
  textTransform: "uppercase" as const,
  letterSpacing: "0.05em",
  marginBottom: "12px",
}

const orderSection = {
  backgroundColor: "#f8fafc",
  borderRadius: "4px",
  padding: "20px",
  marginBottom: "24px",
}

const licenseCard = {
  backgroundColor: "#ffffff",
  borderRadius: "4px",
  border: "1px solid #e2e8f0",
  padding: "16px",
  marginBottom: "12px",
}

const productName = {
  fontSize: "16px",
  fontWeight: "600",
  color: "#0f172a",
  margin: "0 0 8px 0",
}

const licenseCode = {
  fontSize: "14px",
  color: "#475569",
  margin: "0",
}

const codeValue = {
  fontFamily: '"Geist Mono", "Courier New", monospace',
  backgroundColor: "#f1f5f9",
  padding: "2px 6px",
  borderRadius: "2px",
}

const divider = {
  borderColor: "#e2e8f0",
  margin: "16px 0",
}

const totalText = {
  fontSize: "16px",
  color: "#475569",
  margin: "0",
  textAlign: "right" as const,
}

const totalValue = {
  fontWeight: "700",
  color: "#0f172a",
}

const nextStepsSection = {
  marginBottom: "24px",
}

const primaryButton = {
  backgroundColor: "#0e7490",
  color: "#ffffff",
  fontSize: "16px",
  fontWeight: "600",
  padding: "12px 24px",
  borderRadius: "4px",
  textDecoration: "none",
  display: "inline-block",
  marginTop: "8px",
  marginBottom: "16px",
}

const smallText = {
  fontSize: "13px",
  color: "#94a3b8",
  lineHeight: "20px",
}

const resourcesSection = {
  backgroundColor: "#f8fafc",
  borderRadius: "4px",
  padding: "20px",
  marginBottom: "24px",
}

const resourceLink = {
  fontSize: "14px",
  color: "#475569",
  marginBottom: "8px",
  lineHeight: "22px",
}

const link = {
  color: "#0e7490",
  textDecoration: "none",
}

const helpText = {
  fontSize: "14px",
  color: "#94a3b8",
  textAlign: "center" as const,
}

export default PurchaseConfirmationEmail
