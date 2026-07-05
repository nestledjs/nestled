#!/usr/bin/env bash
#
# sync-release-tags.sh
#
# Fixes orphaned release tags after rebasing. When using a rebase workflow,
# tags from previous releases can become orphaned (not ancestors of HEAD).
# This script moves only the LATEST orphaned tag per project to HEAD so
# NX release can use them for conventional commits analysis.
#
# Usage:
#   pnpm sync-tags        # Sync latest orphaned tags
#   pnpm sync-tags --dry  # Preview what would be synced
#   pnpm sync-tags --all  # Sync ALL orphaned tags (not just latest)
#

set -e

DRY_RUN=false
SYNC_ALL=false

for arg in "$@"; do
  case $arg in
    --dry|--dry-run)
      DRY_RUN=true
      ;;
    --all)
      SYNC_ALL=true
      ;;
  esac
done

if [ "$DRY_RUN" = true ]; then
  echo "DRY RUN - no changes will be made"
  echo ""
fi

# Fetch latest tags from remote
echo "Fetching tags from origin..."
git fetch --tags --force

echo "Analyzing release tags..."
echo ""

# Get all orphaned tags
ORPHANED_TAGS=""
for tag in $(git tag -l '*@*'); do
  if ! git merge-base --is-ancestor "$tag" HEAD 2>/dev/null; then
    ORPHANED_TAGS="$ORPHANED_TAGS $tag"
  fi
done

if [ -z "$ORPHANED_TAGS" ]; then
  echo "All tags are already in sync"
  exit 0
fi

SYNCED_COUNT=0

if [ "$SYNC_ALL" = true ]; then
  echo "Syncing ALL orphaned tags..."
  echo ""

  for tag in $ORPHANED_TAGS; do
    if [ "$DRY_RUN" = true ]; then
      echo "  [WOULD SYNC] $tag"
    else
      echo "  [SYNCING] $tag -> HEAD"
      git tag -f "$tag" HEAD
      git push origin "$tag" --force
    fi
    SYNCED_COUNT=$((SYNCED_COUNT + 1))
  done
else
  echo "Syncing latest orphaned tag per project..."
  echo ""

  # Get unique projects and their latest orphaned tag
  # Sort tags by version, get latest per project
  LATEST_TAGS=$(echo "$ORPHANED_TAGS" | tr ' ' '\n' | sort -V | awk -F'@' '{
    project = $1
    for (i = 2; i < NF; i++) project = project "@" $i
    latest[project] = $0
  } END {
    for (p in latest) print latest[p]
  }')

  for tag in $LATEST_TAGS; do
    project="${tag%@*}"
    if [ "$DRY_RUN" = true ]; then
      echo "  [WOULD SYNC] $tag (latest for $project)"
    else
      echo "  [SYNCING] $tag -> HEAD"
      git tag -f "$tag" HEAD
      git push origin "$tag" --force
    fi
    SYNCED_COUNT=$((SYNCED_COUNT + 1))
  done
fi

echo ""
if [ "$DRY_RUN" = true ]; then
  echo "Would sync $SYNCED_COUNT tag(s)"
  echo "Run without --dry to sync them"
else
  echo "Synced $SYNCED_COUNT tag(s) to HEAD"
fi
