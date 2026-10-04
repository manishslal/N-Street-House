#!/bin/bash
# Starts the official Pascal editor locally (npm CLI; downloads the web runtime on first run) with data kept in ./.pascal-data.
# The custom furniture models are copied into the runtime's public folder (served from the same address as the editor, no second server),
# which the runtime only reads at startup, so the first run starts, copies, then restarts once.
HERE="$(cd "$(dirname "$0")/.." && pwd)"
export PASCAL_HOME="$HERE/.pascal-data"
CLI="npx -y @pascal-app/cli@1.0.3"
$CLI start --no-open >/dev/null 2>&1
PUB=$(ls -d "$PASCAL_HOME"/runtime/*/apps/editor/public 2>/dev/null | head -1)
if [ -z "$PUB" ]; then echo "Pascal runtime not found under $PASCAL_HOME"; exit 1; fi
mkdir -p "$PUB/custom-models"
if ! cmp -s "$HERE/models/round_table.glb" "$PUB/custom-models/round_table.glb" || ! cmp -s "$HERE/models/monstera.glb" "$PUB/custom-models/monstera.glb"; then
  cp "$HERE"/models/*.glb "$HERE"/models/*.png "$PUB/custom-models/"
  $CLI stop >/dev/null 2>&1; sleep 2; $CLI start --no-open >/dev/null 2>&1
  echo "custom models copied into the editor and the editor restarted"
fi
$CLI status
