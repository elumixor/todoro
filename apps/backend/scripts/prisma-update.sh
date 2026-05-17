#!/bin/bash
set -e

NAME=${1:-"update_$(date +%Y%m%d%H%M%S)"}

BEFORE=$(ls prisma/migrations | grep -v migration_lock | tail -1)

bun prisma migrate dev --name "$NAME"

AFTER=$(ls prisma/migrations | grep -v migration_lock | tail -1)

if [ "$AFTER" != "$BEFORE" ]; then
    turso db shell todoro-todoro < "prisma/migrations/$AFTER/migration.sql"
fi

bun prisma generate
