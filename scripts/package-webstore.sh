#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DIST_DIR="$ROOT_DIR/dist"
VERSION="$(node -e "console.log(require('$ROOT_DIR/manifest.json').version)")"
ZIP_PATH="$DIST_DIR/cleen2-$VERSION.zip"

mkdir -p "$DIST_DIR"
rm -f "$ZIP_PATH"

TMP_DIR="$(mktemp -d)"
cleanup() {
  rm -rf "$TMP_DIR"
}
trap cleanup EXIT

rsync -a "$ROOT_DIR/" "$TMP_DIR/extension/"

rm -rf \
  "$TMP_DIR/extension/.git" \
  "$TMP_DIR/extension/.github" \
  "$TMP_DIR/extension/dist" \
  "$TMP_DIR/extension/docs" \
  "$TMP_DIR/extension/scripts"

find "$TMP_DIR/extension" -name '.DS_Store' -delete
rm -f "$TMP_DIR/extension/.gitignore" "$TMP_DIR/extension/README.md"

(
  cd "$TMP_DIR/extension"
  zip -qr "$ZIP_PATH" .
)

echo "$ZIP_PATH"
