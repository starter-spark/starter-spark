-- Phase 15.1: Admin-Editable Page Content
-- Creates page_content table for Privacy, Terms, and other editable pages

-- Create page_content table
CREATE TABLE IF NOT EXISTS page_content (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  page_key text UNIQUE NOT NULL, -- 'privacy', 'terms', 'about_hero', etc.
  title text NOT NULL,
  content text NOT NULL, -- Markdown content
  last_updated_by uuid REFERENCES auth.users(id),
  updated_at timestamptz DEFAULT now(),
  published_at timestamptz, -- NULL = draft, NOT NULL = published
  version integer DEFAULT 1,
  created_at timestamptz DEFAULT now()
);
-- Enable RLS
ALTER TABLE page_content ENABLE ROW LEVEL SECURITY;
-- Public can read published content
CREATE POLICY "Public can read published page content"
  ON page_content
  FOR SELECT
  USING (published_at IS NOT NULL);
-- Admin/staff can manage all content
CREATE POLICY "Admin can manage page content"
  ON page_content
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'staff')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'staff')
    )
  );
-- Index for fast page lookups
CREATE INDEX IF NOT EXISTS idx_page_content_page_key ON page_content(page_key);
-- Seed initial content for Privacy and Terms pages
INSERT INTO page_content (page_key, title, content, published_at)
VALUES
  ('privacy', 'Privacy Policy', '# Privacy Policy

**Last Updated:** December 2025

## Introduction

StarterSpark Robotics ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website and purchase our products.

## Information We Collect

### Personal Information
When you make a purchase or create an account, we may collect:
- Name and email address
- Billing and shipping address
- Payment information (processed securely through Stripe)
- Order history

### Automatically Collected Information
We automatically collect certain information when you visit our site:
- Browser type and version
- Operating system
- IP address
- Pages visited and time spent
- Referring website

## How We Use Your Information

We use the information we collect to:
- Process and fulfill your orders
- Send order confirmations and updates
- Provide customer support
- Improve our products and services
- Send marketing communications (with your consent)
- Comply with legal obligations

## Data Security

We implement appropriate technical and organizational security measures to protect your personal information. Payment processing is handled securely by Stripe, and we never store your full credit card details.

## Third-Party Services

We use the following third-party services:
- **Stripe** for payment processing
- **Resend** for email communications
- **PostHog** for analytics (anonymized)

## Your Rights

You have the right to:
- Access your personal data
- Correct inaccurate data
- Request deletion of your data
- Opt-out of marketing communications

## Contact Us

If you have questions about this Privacy Policy, please contact us at:
**Email:** privacy@starterspark.com

## Changes to This Policy

We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page.', now()),

  ('terms', 'Terms of Service', '# Terms of Service

**Last Updated:** December 2025

## Agreement to Terms

By accessing or using StarterSpark Robotics'' website and purchasing our products, you agree to be bound by these Terms of Service.

## Products and Orders

### Product Descriptions
We strive to provide accurate product descriptions and images. However, we do not warrant that product descriptions or other content is accurate, complete, or error-free.

### Pricing
All prices are in USD and subject to change without notice. We reserve the right to correct pricing errors.

### Orders
We reserve the right to refuse or cancel any order for any reason, including but not limited to product availability, errors in product or pricing information, or fraud.

## Licenses

### License Codes
Each purchase includes a unique license code that grants you access to:
- Workshop materials and tutorials
- Software downloads
- Community features

License codes are non-transferable and for personal/educational use only.

### Restrictions
You may not:
- Share or distribute your license code
- Use products for commercial purposes without authorization
- Reverse engineer our products or software

## Intellectual Property

All content, including but not limited to designs, text, graphics, logos, and software, is the property of StarterSpark Robotics and protected by intellectual property laws.

## Disclaimer of Warranties

Products are provided "as is" without warranties of any kind. We do not warrant that products will meet your requirements or expectations.

## Limitation of Liability

StarterSpark Robotics shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of our products or services.

## Educational Use

Our products are designed for educational purposes. Adult supervision is recommended for users under 13 years of age. We are not responsible for any injuries or damages resulting from improper use.

## Returns and Refunds

We offer a 30-day return policy for unused products in original packaging. Digital products and opened items are non-refundable.

## Governing Law

These Terms shall be governed by the laws of the State of Hawaii, without regard to conflict of law principles.

## Contact

For questions about these Terms, contact us at:
**Email:** legal@starterspark.com

## Changes to Terms

We reserve the right to modify these Terms at any time. Continued use of our services after changes constitutes acceptance of the new Terms.', now())
ON CONFLICT (page_key) DO NOTHING;
-- Add comment for documentation
COMMENT ON TABLE page_content IS 'Admin-editable page content for Privacy, Terms, and other static pages';
COMMENT ON COLUMN page_content.page_key IS 'Unique identifier for the page (e.g., privacy, terms, about_hero)';
COMMENT ON COLUMN page_content.published_at IS 'NULL means draft, NOT NULL means published';
