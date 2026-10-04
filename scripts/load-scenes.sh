#!/bin/bash
# Loads both generated scenes into a running local Pascal editor through its scene API.
# usage: scripts/load-scenes.sh <port>      (port printed by `npx @pascal-app/cli status`)
# Custom model URLs in the scene files point at :8765; here they are rewritten to this editor's own /custom-models folder (see start-pascal.sh).
# Needs a hosts entry or the Host header below; the sandbox the spike was built in cannot resolve *.localhost, so we send the header explicitly.
HERE="$(cd "$(dirname "$0")/.." && pwd)"
# No argument: ask the running editor for its port (the "Pascal ... is running at" port, NOT the "MCP is ready on port" one).
if [ -z "$1" ]; then PORT=$(PASCAL_HOME="$HERE/.pascal-data" npx -y @pascal-app/cli@1.0.3 status 2>&1 | grep -oE "pascal.localhost:[0-9]+" | head -1 | cut -d: -f2); else PORT=$1; fi
if [ -z "$PORT" ]; then echo "usage: load-scenes.sh [editor-port]   (start the editor first: scripts/start-pascal.sh)"; exit 1; fi
if ! curl -s -m 3 -H "Host: pascal.localhost:$PORT" "http://127.0.0.1:$PORT/api/scenes" | grep -q '"scenes"\|\[' ; then echo "Port $PORT is not the editor (the status line 'MCP is ready on port' is a different port). Use the port after 'Pascal 1.0.3 is running at'."; exit 1; fi
load(){ id=$1; name=$2; file=$3
  curl -s -o /dev/null -X DELETE -H "Host: pascal.localhost:$PORT" "http://127.0.0.1:$PORT/api/scenes/$id"
  node -e "const g=JSON.parse(require('fs').readFileSync('$file','utf8'));process.stdout.write(JSON.stringify({id:'$id',name:'$name',graph:g}).split('http://localhost:8765').join('http://localhost:$PORT/custom-models'))" > /tmp/house-spike-body.json
  curl -s -w "\n$id -> HTTP %{http_code}\n" -X POST -H "Host: pascal.localhost:$PORT" -H 'content-type: application/json' --data @/tmp/house-spike-body.json "http://127.0.0.1:$PORT/api/scenes" | tail -1
}
load house-existing "House - Existing" "$HERE/scenes/house-existing.json"
load house-proposed "House - Proposed (L stair)" "$HERE/scenes/house-proposed.json"
echo "Open: http://localhost:$PORT/scene/house-proposed   (use localhost, not pascal.localhost, if the page errors)"
