#!/bin/bash
# Run this once (leave it running) next to the Pascal editor so the custom furniture models load.
cd "$(dirname "$0")/.." && exec node scripts/serve-models.cjs 8765
