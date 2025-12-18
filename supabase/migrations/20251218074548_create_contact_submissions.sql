-- Phase 19: Contact & Support System
-- Create contact_submissions table for contact form submissions

CREATE TABLE contact_submissions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  email text NOT NULL,
  subject text NOT NULL CHECK (subject IN ('general', 'technical', 'educator', 'partnership', 'press')),
  message text NOT NULL,
  attachments jsonb DEFAULT '[]', -- [{name, url, size}]
  status text DEFAULT 'new' CHECK (status IN ('new', 'in_progress', 'resolved', 'spam')),
  assigned_to uuid REFERENCES auth.users(id),
  internal_notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  resolved_at timestamptz
);

-- Create troubleshooting_articles table for support FAQ
CREATE TABLE troubleshooting_articles (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  slug text UNIQUE NOT NULL,
  category text NOT NULL CHECK (category IN ('assembly', 'electronics', 'software', 'account', 'shipping', 'general')),
  title text NOT NULL,
  problem text NOT NULL,
  causes text[] DEFAULT '{}', -- Array of possible causes
  solutions text NOT NULL, -- Markdown with steps
  related_articles uuid[], -- Related troubleshooting articles
  view_count integer DEFAULT 0,
  helpful_count integer DEFAULT 0,
  not_helpful_count integer DEFAULT 0,
  sort_order integer DEFAULT 0,
  is_published boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Indexes for performance
CREATE INDEX idx_contact_submissions_status ON contact_submissions(status);
CREATE INDEX idx_contact_submissions_created_at ON contact_submissions(created_at DESC);
CREATE INDEX idx_contact_submissions_subject ON contact_submissions(subject);

CREATE INDEX idx_troubleshooting_category ON troubleshooting_articles(category);
CREATE INDEX idx_troubleshooting_published ON troubleshooting_articles(is_published) WHERE is_published = true;
CREATE INDEX idx_troubleshooting_sort ON troubleshooting_articles(category, sort_order);

-- Enable RLS
ALTER TABLE contact_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE troubleshooting_articles ENABLE ROW LEVEL SECURITY;

-- RLS Policies for contact_submissions (admin only)
CREATE POLICY "Admin can view all submissions"
  ON contact_submissions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'staff')
    )
  );

CREATE POLICY "Admin can update submissions"
  ON contact_submissions FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'staff')
    )
  );

CREATE POLICY "Admin can delete submissions"
  ON contact_submissions FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Anyone can insert (submit contact form) - no auth required
CREATE POLICY "Anyone can submit contact form"
  ON contact_submissions FOR INSERT
  WITH CHECK (true);

-- RLS Policies for troubleshooting_articles
CREATE POLICY "Anyone can view published articles"
  ON troubleshooting_articles FOR SELECT
  USING (is_published = true);

CREATE POLICY "Admin can view all articles"
  ON troubleshooting_articles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'staff')
    )
  );

CREATE POLICY "Admin can insert articles"
  ON troubleshooting_articles FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'staff')
    )
  );

CREATE POLICY "Admin can update articles"
  ON troubleshooting_articles FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'staff')
    )
  );

CREATE POLICY "Admin can delete articles"
  ON troubleshooting_articles FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Function to increment view count
CREATE OR REPLACE FUNCTION increment_article_view(article_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE troubleshooting_articles
  SET view_count = view_count + 1
  WHERE id = article_id;
END;
$$;

-- Function to record helpful/not helpful feedback
CREATE OR REPLACE FUNCTION record_article_feedback(article_id uuid, is_helpful boolean)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF is_helpful THEN
    UPDATE troubleshooting_articles
    SET helpful_count = helpful_count + 1
    WHERE id = article_id;
  ELSE
    UPDATE troubleshooting_articles
    SET not_helpful_count = not_helpful_count + 1
    WHERE id = article_id;
  END IF;
END;
$$;

-- Seed some initial troubleshooting articles
INSERT INTO troubleshooting_articles (slug, category, title, problem, causes, solutions, sort_order) VALUES
(
  'servo-not-moving',
  'electronics',
  'Servo Motor Not Moving',
  'My servo motor is not responding or moving when I run the code.',
  ARRAY['Loose wire connections', 'Incorrect pin assignment in code', 'Insufficient power supply', 'Damaged servo'],
  E'## Solutions\n\n1. **Check Wire Connections**\n   - Ensure the servo''s signal wire (usually orange/yellow) is connected to the correct PWM pin\n   - Verify power (red) and ground (brown/black) connections\n\n2. **Verify Code**\n   ```cpp\n   #include <Servo.h>\n   Servo myservo;\n   myservo.attach(9); // Make sure pin matches your wiring\n   ```\n\n3. **Power Supply**\n   - Servos can draw significant current\n   - Consider using external 5V power supply for multiple servos\n   - Connect grounds between Arduino and external supply\n\n4. **Test the Servo**\n   - Try a different servo to rule out hardware failure\n   - Use the Servo > Sweep example in Arduino IDE',
  1
),
(
  'code-upload-failed',
  'software',
  'Code Upload Failed',
  'I get an error when trying to upload code to my Arduino board.',
  ARRAY['Wrong board selected', 'Wrong port selected', 'Driver not installed', 'Board not connected properly'],
  E'## Solutions\n\n1. **Check Board Selection**\n   - Go to Tools > Board and select "Arduino Uno" (or your specific board)\n\n2. **Check Port Selection**\n   - Go to Tools > Port and select the COM port showing your Arduino\n   - On Mac/Linux, look for `/dev/ttyUSB0` or `/dev/ttyACM0`\n\n3. **Install Drivers**\n   - Windows may need CH340 drivers for clone boards\n   - Download from: https://sparks.gogo.co.nz/ch340.html\n\n4. **Try Different USB Cable**\n   - Some cables are charge-only and don''t support data\n   - Use the cable that came with your kit\n\n5. **Reset the Board**\n   - Press the reset button on the Arduino right before upload starts',
  1
),
(
  'arm-jerky-movement',
  'assembly',
  'Robotic Arm Has Jerky Movement',
  'The robotic arm moves in a jerky or stuttering manner instead of smoothly.',
  ARRAY['Code using delay() instead of smooth motion', 'Mechanical friction', 'Loose screws', 'Power fluctuations'],
  E'## Solutions\n\n1. **Use Smooth Motion Code**\n   ```cpp\n   // Instead of jumping directly:\n   // servo.write(90);\n   \n   // Move gradually:\n   for(int pos = 0; pos <= 90; pos++) {\n     servo.write(pos);\n     delay(15); // Adjust for speed\n   }\n   ```\n\n2. **Check Mechanical Assembly**\n   - Ensure all screws are tight but not overtightened\n   - Check for rubbing or friction between parts\n   - Apply a small amount of lubricant to joints if needed\n\n3. **Power Supply**\n   - Use a dedicated 5V 2A power supply for servos\n   - Avoid powering servos directly from Arduino 5V pin\n\n4. **Use the Servo Library Properly**\n   - Consider using `writeMicroseconds()` for finer control',
  1
),
(
  'account-login-issues',
  'account',
  'Cannot Log In to My Account',
  'I''m having trouble logging into my StarterSpark account.',
  ARRAY['Incorrect email or password', 'Email not verified', 'Account created with different method', 'Browser cache issues'],
  E'## Solutions\n\n1. **Check Your Email**\n   - Make sure you''re using the exact email you registered with\n   - Check for typos\n\n2. **Reset Password**\n   - Click "Forgot Password" on the login page\n   - Check your inbox AND spam folder for the reset email\n\n3. **Clear Browser Cache**\n   - Try logging in from an incognito/private window\n   - Clear cookies for starterspark.com\n\n4. **Different Login Method**\n   - If you signed up with Google, use "Continue with Google"\n   - If you used email, use the email/password form\n\n5. **Contact Support**\n   - If nothing works, [contact us](/contact) with your email address',
  1
),
(
  'order-not-received',
  'shipping',
  'Order Not Received',
  'I placed an order but haven''t received it yet.',
  ARRAY['Order still processing', 'Shipping delay', 'Incorrect address', 'Package lost in transit'],
  E'## Solutions\n\n1. **Check Order Status**\n   - Log into your account and go to Workshop > Orders\n   - Check the current status of your order\n\n2. **Shipping Times**\n   - Standard shipping: 5-7 business days\n   - Express shipping: 2-3 business days\n   - International: 10-21 business days\n\n3. **Track Your Package**\n   - Use the tracking number from your shipping confirmation email\n   - Check with the carrier (USPS, UPS, FedEx) directly\n\n4. **Verify Address**\n   - Check that the shipping address in your order is correct\n   - Contact us if you need to update it before shipping\n\n5. **Contact Support**\n   - If it''s been longer than expected, [contact us](/contact?subject=general)\n   - Include your order number in the message',
  1
);
