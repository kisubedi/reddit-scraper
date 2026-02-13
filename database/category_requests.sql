-- Category Requests Table
-- Stores user-submitted category suggestions

CREATE TABLE IF NOT EXISTS category_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_name VARCHAR(100) NOT NULL,
  description TEXT,
  status VARCHAR(20) DEFAULT 'pending', -- pending, approved, rejected
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ,
  reviewed_by VARCHAR(100),
  notes TEXT
);

-- Index for querying by status
CREATE INDEX idx_category_requests_status ON category_requests(status);

-- Index for sorting by submission date
CREATE INDEX idx_category_requests_submitted_at ON category_requests(submitted_at DESC);

-- View for pending requests
CREATE OR REPLACE VIEW pending_category_requests AS
SELECT
  id,
  topic_name,
  description,
  submitted_at
FROM category_requests
WHERE status = 'pending'
ORDER BY submitted_at DESC;
