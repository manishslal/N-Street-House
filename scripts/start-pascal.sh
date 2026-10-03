#!/bin/bash
# Starts the official Pascal editor locally (npm CLI; downloads the web runtime on first run) with data kept in ./.pascal-data
HERE="$(cd "$(dirname "$0")/.." && pwd)"
export PASCAL_HOME="$HERE/.pascal-data"
npx -y @pascal-app/cli@1.0.3 start --no-open
npx -y @pascal-app/cli@1.0.3 status
