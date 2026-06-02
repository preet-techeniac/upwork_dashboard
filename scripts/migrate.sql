-- =============================================================
-- Upwork Bidding Analytics Dashboard — Database Schema
-- Run this in pgAdmin Query Tool against "upwork_dashboard" DB
-- =============================================================

-- 1. USERS (admins)
CREATE TABLE IF NOT EXISTS users (
  id            SERIAL PRIMARY KEY,
  username      VARCHAR(50)  UNIQUE NOT NULL,
  display_name  VARCHAR(100) NOT NULL,
  password_hash TEXT         NOT NULL,
  role          VARCHAR(20)  NOT NULL DEFAULT 'admin',
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- 2. RECRUITERS
CREATE TABLE IF NOT EXISTS recruiters (
  id          SERIAL PRIMARY KEY,
  name        VARCHAR(100) NOT NULL,
  email       VARCHAR(150),
  company     VARCHAR(150),
  platform    VARCHAR(50)  NOT NULL DEFAULT 'Upwork',
  country     VARCHAR(100),
  notes       TEXT,
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- 3. BIDS (Updated for CSV structure)
CREATE TABLE IF NOT EXISTS bids (
  id               SERIAL PRIMARY KEY,
  application_date DATE,
  job_url          TEXT,
  found_by         VARCHAR(100),
  cv_used          TEXT,
  proposal_used    TEXT,
  status           VARCHAR(100),
  hires            VARCHAR(50),
  interviewing     VARCHAR(50),
  country          VARCHAR(100),
  connects         VARCHAR(50),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. EARNINGS
CREATE TABLE IF NOT EXISTS earnings (
  id            SERIAL PRIMARY KEY,
  bid_id        INTEGER REFERENCES bids(id) ON DELETE SET NULL,
  recruiter_id  INTEGER REFERENCES recruiters(id) ON DELETE SET NULL,
  amount        NUMERIC(12,2) NOT NULL,
  currency      VARCHAR(10) NOT NULL DEFAULT 'USD',
  payment_date  DATE NOT NULL,
  description   TEXT,
  created_by    INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- =============================================================
-- SEED DATA
-- Passwords:
--   preet    → preet@Company99
--   sandeep  → Sandeep#TechEniac987
-- =============================================================

INSERT INTO users (username, display_name, password_hash, role)
VALUES
  (
    'preet',
    'Preet',
    '$2b$10$h37NJ2fV8FTL.m4G/BQ.Lu.RYLFNmvKwEbkGnHaQD7i/pAaEVGCjO',
    'admin'
  ),
  (
    'sandeep',
    'Sandeep',
    '$2b$10$76fLZHSu00VLUp1VZHHamusg92STh9Krjt3Rdfhdih4.RctOW..Dy',
    'admin'
  )
ON CONFLICT (username) DO NOTHING;

-- Sample recruiters
INSERT INTO recruiters (name, email, company, platform, country)
VALUES
  ('Alice Johnson', 'alice@techcorp.com', 'TechCorp Inc.', 'Upwork', 'United States'),
  ('Bob Williams', 'bob@devstudio.io', 'DevStudio', 'Upwork', 'United Kingdom'),
  ('Carol Chen', 'carol@startupxyz.com', 'StartupXYZ', 'Upwork', 'Canada')
ON CONFLICT DO NOTHING;

-- Sample bids (removed to avoid schema conflict, import CSV instead)
