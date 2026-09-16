#!/usr/bin/env bash
# Solution: remove old rotated logs and debug dumps, keep active app.log
rm -f logs/*.dump logs/app.log.*
echo "Rotated logs cleaned"
