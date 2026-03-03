-- 001_initial.sql
-- Initial schema for sendmd

CREATE TABLE docs (
  id            TEXT PRIMARY KEY,
  size_bytes    INT NOT NULL,
  views         INT NOT NULL DEFAULT 0,
  ttl_hours     INT NOT NULL CHECK (ttl_hours IN (1, 24, 168, 720)),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at    TIMESTAMPTZ NOT NULL,
  upload_ip     TEXT,
  content_type  TEXT NOT NULL DEFAULT 'text/markdown',
  is_deleted    BOOLEAN NOT NULL DEFAULT FALSE,
  flagged       BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE upload_events (
  id             SERIAL PRIMARY KEY,
  doc_id         TEXT REFERENCES docs(id),
  ip             TEXT NOT NULL,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  size_bytes     INT,
  was_rejected   BOOLEAN NOT NULL DEFAULT FALSE,
  reject_reason  TEXT
);

CREATE TABLE view_events (
  id          SERIAL PRIMARY KEY,
  doc_id      TEXT NOT NULL REFERENCES docs(id),
  viewed_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  viewer_ip   TEXT,
  referer     TEXT
);

CREATE TABLE flagged_ips (
  ip          TEXT PRIMARY KEY,
  reason      TEXT,
  flagged_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_blocked  BOOLEAN NOT NULL DEFAULT TRUE
);

-- Indexes: docs
CREATE INDEX idx_docs_expires_at ON docs (expires_at);
CREATE INDEX idx_docs_upload_ip_created ON docs (upload_ip, created_at);
CREATE INDEX idx_docs_is_deleted ON docs (is_deleted);

-- Indexes: upload_events
CREATE INDEX idx_upload_events_ip_created ON upload_events (ip, created_at);
CREATE INDEX idx_upload_events_doc_id ON upload_events (doc_id);

-- Indexes: view_events
CREATE INDEX idx_view_events_doc_id ON view_events (doc_id);
CREATE INDEX idx_view_events_viewed_at ON view_events (viewed_at);

-- Indexes: flagged_ips
CREATE INDEX idx_flagged_ips_is_blocked ON flagged_ips (is_blocked);

-- Bandwidth tracking (R2 free tier: 10GB/month)
CREATE TABLE bandwidth_usage (
  month       TEXT PRIMARY KEY,
  bytes_used  BIGINT NOT NULL DEFAULT 0
);
