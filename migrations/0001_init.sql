CREATE TABLE IF NOT EXISTS requests (
  id TEXT PRIMARY KEY,
  kind TEXT NOT NULL CHECK(kind IN ('booking','model')),
  data TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'new',
  archived INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_requests_kind_created ON requests(kind, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_requests_archived_created ON requests(archived, created_at DESC);

CREATE TABLE IF NOT EXISTS blocks (
  id TEXT PRIMARY KEY,
  event_date TEXT NOT NULL,
  event_time TEXT NOT NULL,
  note TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_blocks_date_time ON blocks(event_date, event_time);

CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS slot_locks (
  slot_key TEXT PRIMARY KEY,
  booking_id TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS rate_limits (
  rate_key TEXT PRIMARY KEY,
  count INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL
);
