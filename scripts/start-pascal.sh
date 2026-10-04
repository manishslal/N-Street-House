#!/bin/bash
# Starts the official Pascal editor locally (npm CLI; downloads the web runtime on first run) with data kept in ./.pascal-data,
# and the small server that provides the custom furniture models (without it those pieces show as red wireframe boxes).
HERE="$(cd "$(dirname "$0")/.." && pwd)"
export PASCAL_HOME="$HERE/.pascal-data"
if ! curl -s -o /dev/null -m 2 http://localhost:8765/thumb.png; then
  nohup node "$HERE/scripts/serve-models.cjs" 8765 >"$HERE/.pascal-data-models.log" 2>&1 &
  sleep 1
fi
curl -s -o /dev/null -m 2 http://localhost:8765/thumb.png && echo "custom models: http://localhost:8765 OK" || echo "WARNING: model server did not start (run scripts/serve-models.sh)"
npx -y @pascal-app/cli@1.0.3 start --no-open
npx -y @pascal-app/cli@1.0.3 status
