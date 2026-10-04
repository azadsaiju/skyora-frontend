#!/usr/bin/env bash
# Skyora — SQLite database backup
#   sudo scripts/backup-db.sh <db-file> [backup-dir]
# Writes <backup-dir>/skyora-<timestamp>.db.gz and prunes backups older
# than RETAIN_DAYS (default 30). Safe to run while the app is live:
# uses the SQLite Online Backup API via the sqlite3 CLI when available,
# falling back to a direct copy (WAL-safe for low-traffic windows).
set -euo pipefail

DB_FILE="${1:?usage: backup-db.sh <db-file> [backup-dir]}"
BACKUP_DIR="${2:-./backups}"
RETAIN_DAYS="${RETAIN_DAYS:-30}"
STAMP="$(date +%Y%m%d-%H%M%S)"

if [ ! -f "$DB_FILE" ]; then
  echo "[backup] ERROR: database file not found: $DB_FILE" >&2
  exit 1
fi

mkdir -p "$BACKUP_DIR"
TARGET="$BACKUP_DIR/skyora-$STAMP.db.gz"
TMP="$(mktemp "$BACKUP_DIR/.tmp-$STAMP.XXXXXX")"
trap 'rm -f "$TMP"' EXIT

# Prefer the consistent online-backup API when sqlite3 is installed.
if command -v sqlite3 >/dev/null 2>&1; then
  sqlite3 "$DB_FILE" ".backup '$TMP'"
else
  cp "$DB_FILE" "$TMP"
fi

gzip -c "$TMP" > "$TARGET"
echo "[backup] wrote $TARGET ($(du -h "$TARGET" | cut -f1))"

# Prune old backups.
find "$BACKUP_DIR" -name 'skyora-*.db.gz' -type f -mtime "+$RETAIN_DAYS" -print -delete |
  sed 's/^/[backup] pruned /'
echo "[backup] done (retention: $RETAIN_DAYS days)"
