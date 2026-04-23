#!/usr/bin/env bash
set -euo pipefail

# Regenerate build/icon.icns from build/icon.svg.
# Requires: rsvg-convert (brew install librsvg), iconutil, sips.

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_ROOT="$(cd "$HERE/.." && pwd)"
BUILD_DIR="$APP_ROOT/build"
SVG="$BUILD_DIR/icon.svg"
ICONSET="$BUILD_DIR/icon.iconset"
MASTER="$BUILD_DIR/icon_1024.png"
ICNS="$BUILD_DIR/icon.icns"

if ! command -v rsvg-convert >/dev/null 2>&1; then
  echo "rsvg-convert not found. Run: brew install librsvg" >&2
  exit 1
fi

rsvg-convert -w 1024 -h 1024 "$SVG" -o "$MASTER"

rm -rf "$ICONSET"
mkdir -p "$ICONSET"

emit() {
  local size="$1"
  local name="$2"
  sips -z "$size" "$size" "$MASTER" --out "$ICONSET/icon_${name}.png" >/dev/null
}

emit 16   16x16
emit 32   16x16@2x
emit 32   32x32
emit 64   32x32@2x
emit 128  128x128
emit 256  128x128@2x
emit 256  256x256
emit 512  256x256@2x
emit 512  512x512
emit 1024 512x512@2x

iconutil -c icns "$ICONSET" -o "$ICNS"

rm -rf "$ICONSET" "$MASTER"

ls -lh "$ICNS"
