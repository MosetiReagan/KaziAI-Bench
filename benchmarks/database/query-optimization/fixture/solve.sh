#!/usr/bin/env bash
# Apply initial setup
sqlite3 bench.db < setup.sql

# Solution: create composite index
sqlite3 bench.db "CREATE INDEX IF NOT EXISTS idx_events_user_status ON events(user_id, status);"
