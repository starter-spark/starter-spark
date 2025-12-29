-- Add content blocks and display options to page_content table
-- This enables rich documentation-style pages with structured content blocks

-- Add new columns for enhanced page content
ALTER TABLE page_content
ADD COLUMN IF NOT EXISTS content_blocks jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS toc_enabled boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS show_last_updated boolean DEFAULT true;

-- Add comment explaining the content_blocks structure
COMMENT ON COLUMN page_content.content_blocks IS 'JSON array of content blocks: heading, text, image, callout, code, video, faq, cta_button, divider, stat_counter';
COMMENT ON COLUMN page_content.toc_enabled IS 'Whether to show a table of contents sidebar';
COMMENT ON COLUMN page_content.show_last_updated IS 'Whether to display the last updated timestamp on the page';
