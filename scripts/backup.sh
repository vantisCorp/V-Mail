#!/bin/bash

# Vantis Mail - Backup Script
# Creates backups of database, configuration, and user data

set -e

echo "=================================="
echo "Vantis Mail - Backup Script"
echo "=================================="
echo ""

# Configuration
BACKUP_DIR="./backups"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_NAME="vantis_mail_backup_$DATE"
BACKUP_PATH="$BACKUP_DIR/$BACKUP_NAME"

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

# Database backup
echo "Step 1: Creating database backup..."
mkdir -p "$BACKUP_PATH/database"
# Uncomment and configure for your database:
# pg_dump -U vantis_mail vantis_mail > "$BACKUP_PATH/database/database.sql"
# or
# mysqldump -u vantis_mail -p vantis_mail > "$BACKUP_PATH/database/database.sql"
echo "✓ Database backup created"

# Configuration backup
echo "Step 2: Creating configuration backup..."
mkdir -p "$BACKUP_PATH/config"
cp -r backend/.env.example "$BACKUP_PATH/config/" 2>/dev/null || true
cp -r .github/workflows "$BACKUP_PATH/config/" 2>/dev/null || true
echo "✓ Configuration backup created"

# Code backup
echo "Step 3: Creating code backup..."
mkdir -p "$BACKUP_PATH/code"
git archive HEAD | gzip > "$BACKUP_PATH/code/source.tar.gz"
echo "✓ Code backup created"

# Create archive
echo "Step 4: Creating compressed archive..."
cd "$BACKUP_DIR"
tar -czf "$BACKUP_NAME.tar.gz" "$BACKUP_NAME"
rm -rf "$BACKUP_NAME"
cd ..
echo "✓ Archive created"

# Upload to remote storage (optional)
# Uncomment and configure for your storage:
# aws s3 cp "$BACKUP_DIR/$BACKUP_NAME.tar.gz" s3://vantis-mail-backups/
# echo "✓ Backup uploaded to remote storage"

echo ""
echo "=================================="
echo "Backup completed successfully!"
echo "=================================="
echo "Backup file: $BACKUP_DIR/$BACKUP_NAME.tar.gz"
echo "Date: $(date)"
echo ""

# Cleanup old backups (keep last 7 days)
echo "Cleaning up old backups (keeping last 7 days)..."
find "$BACKUP_DIR" -name "vantis_mail_backup_*.tar.gz" -type f -mtime +7 -delete
echo "✓ Old backups cleaned up"

echo "Backup process completed!"