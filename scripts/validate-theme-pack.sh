#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"

required_files=(
  "$ROOT_DIR/assets/animall-gopi.css"
  "$ROOT_DIR/assets/animall-gopi.js"
  "$ROOT_DIR/sections/animall-gopi-marketplace.liquid"
  "$ROOT_DIR/sections/animall-gopi-order-flow.liquid"
  "$ROOT_DIR/templates/page.animall-gopi.json"
  "$ROOT_DIR/templates/product.animall-gopi-order.json"
)

for file in "${required_files[@]}"; do
  if [[ ! -f "$file" ]]; then
    echo "Missing required file: $file"
    exit 1
  fi
done

echo "Required files: OK"

if command -v node >/dev/null 2>&1; then
  node --check "$ROOT_DIR/assets/animall-gopi.js"
  echo "JavaScript syntax: OK"
else
  echo "Skipping JS check (node not found)"
fi

ROOT_DIR="$ROOT_DIR" python3 - <<'PY'
import json
import os
import pathlib
import re

root = pathlib.Path(os.environ["ROOT_DIR"])
section_paths = [
    root / "sections" / "animall-gopi-marketplace.liquid",
    root / "sections" / "animall-gopi-order-flow.liquid",
]

for path in section_paths:
    text = path.read_text(encoding="utf-8")
    match = re.search(r"\{% schema %\}(.*?)\{% endschema %\}", text, re.S)
    if not match:
        raise SystemExit(f"Schema block missing: {path}")
    schema = json.loads(match.group(1).strip())
    ids = {s.get("id") for s in schema.get("settings", []) if isinstance(s, dict) and s.get("id")}
    used = set(re.findall(r"section\.settings\.([a-zA-Z0-9_]+)", text))
    missing = sorted(used - ids)
    if missing:
        raise SystemExit(f"Section settings used but not in schema for {path}: {missing}")

for template_path in [
    root / "templates" / "page.animall-gopi.json",
    root / "templates" / "product.animall-gopi-order.json",
]:
    json.loads(template_path.read_text(encoding="utf-8"))

print("Schema and template JSON: OK")
PY

echo "Validation complete."
