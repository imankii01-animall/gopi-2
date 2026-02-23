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

for dir in assets sections templates; do
  if [[ ! -d "$TARGET_THEME_DIR/$dir" ]]; then
    echo "Target does not look like a Shopify theme (missing $dir/): $TARGET_THEME_DIR"
    exit 1
  fi
done

"$ROOT_DIR/scripts/validate-theme-pack.sh"

timestamp="$(date +%Y%m%d-%H%M%S)"
backup_dir="$TARGET_THEME_DIR/.animall-gopi-backups/$timestamp"
mkdir -p "$backup_dir/assets" "$backup_dir/sections" "$backup_dir/templates"

copy_with_backup() {
  local src="$1"
  local rel="$2"
  local dst="$TARGET_THEME_DIR/$rel"
  local bkp="$backup_dir/$rel"

  if [[ -f "$dst" ]]; then
    cp "$dst" "$bkp"
    echo "Backed up: $rel"
  fi

  cp "$src" "$dst"
  echo "Installed: $rel"
}

copy_with_backup "$ROOT_DIR/assets/animall-gopi.css" "assets/animall-gopi.css"
copy_with_backup "$ROOT_DIR/assets/animall-gopi.js" "assets/animall-gopi.js"
copy_with_backup "$ROOT_DIR/sections/animall-gopi-marketplace.liquid" "sections/animall-gopi-marketplace.liquid"
copy_with_backup "$ROOT_DIR/sections/animall-gopi-order-flow.liquid" "sections/animall-gopi-order-flow.liquid"
copy_with_backup "$ROOT_DIR/templates/page.animall-gopi.json" "templates/page.animall-gopi.json"
copy_with_backup "$ROOT_DIR/templates/product.animall-gopi-order.json" "templates/product.animall-gopi-order.json"

echo ""
echo "Install complete."
echo "Backup location: $backup_dir"
echo ""
echo "Next:"
echo "1) Assign page template: page.animall-gopi"
echo "2) Assign product template: product.animall-gopi-order"
echo "3) Push theme: cd '$TARGET_THEME_DIR' && shopify theme push"
