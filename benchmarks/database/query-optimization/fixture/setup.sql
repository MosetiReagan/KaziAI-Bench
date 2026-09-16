-- Setup script to populate bench.db with events table
DROP TABLE IF EXISTS events;
CREATE TABLE events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  status TEXT NOT NULL,
  payload TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Populate rows
WITH RECURSIVE cnt(x) AS (
  SELECT 1 UNION ALL SELECT x+1 FROM cnt WHERE x < 200
)
INSERT INTO events (user_id, status, payload)
SELECT (x % 20) + 1, CASE WHEN x % 2 = 0 THEN 'active' ELSE 'pending' END, 'data_' || x FROM cnt;
