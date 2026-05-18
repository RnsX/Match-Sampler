#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

cd "$ROOT_DIR"

echo "Building single-file application..."
npm run build

if [[ ! -f "dist/index.html" ]]; then
  echo "Build failed: dist/index.html was not created." >&2
  exit 1
fi

echo "Single-file app created:"
echo "  $ROOT_DIR/dist/index.html"
