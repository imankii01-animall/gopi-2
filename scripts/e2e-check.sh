#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
TARGET_THEME_DIR="${1:-}"

if [[ -z "$TARGET_THEME_DIR" ]]; then
  echo "Usage: $0 /absolute/path/to/dawn-theme"
  exit 1
fi

if [[ ! -d "$TARGET_THEME_DIR" ]]; then
  echo "Target theme directory does not exist: $TARGET_THEME_DIR"
  exit 1
fi

"$ROOT_DIR/scripts/validate-theme-pack.sh"

declare -a files=(
  "assets/animall-gopi.css"
  "assets/animall-gopi.js"
  "sections/animall-gopi-marketplace.liquid"
  "sections/animall-gopi-order-flow.liquid"
  "templates/page.animall-gopi.json"
  "templates/product.animall-gopi-order.json"
)

for rel in "${files[@]}"; do
  src="$ROOT_DIR/$rel"
  dst="$TARGET_THEME_DIR/$rel"

  if [[ ! -f "$dst" ]]; then
    echo "Missing in target: $rel"
    exit 1
  fi

  if ! cmp -s "$src" "$dst"; then
    echo "Mismatch in target file: $rel"
    exit 1
  fi

  echo "OK: $rel"
done

if command -v shopify >/dev/null 2>&1; then
  echo ""
  echo "Shopify CLI detected. Running optional theme check..."
  (
    cd "$TARGET_THEME_DIR"
    shopify theme check || true
  )
else
  echo ""
  echo "Shopify CLI not found. Skipping theme check command."
fi

echo ""
echo "E2E local check passed for target theme: $TARGET_THEME_DIR"
