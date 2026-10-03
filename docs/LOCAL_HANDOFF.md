# Handoff notes (only needed if you move to a local agent on your Mac)

You do not have to switch: the cloud sandbox can now load real textures and models and take eye-level screenshots (`tools/eyeshot.cjs`). A local agent is
mainly useful for (a) looking at the scene in your own GPU browser, (b) editing in the Pascal UI and exporting with Save build, and (c) running the video-to-frames step.

## Project
Two-floor house model (existing vs proposed L-stair) in Pascal Editor 1.0.3, generated from `reference/bethan-original.html` by `generator/*.cjs` into `scenes/*.json`.
Read first: `docs/FINDINGS.md`, `docs/PASCAL_NOTES.md` (especially "Runtime 1.0.3 vs the source"), `docs/DESIGN_REVIEW.md`, `docs/MEASURE.md`, `docs/RENDER_MATCH.md`.

## Run it
1. `scripts/start-pascal.sh` (prints the port), `scripts/serve-models.sh` (custom furniture, leave running), `scripts/load-scenes.sh <port>`.
2. Open `http://localhost:<port>/scene/house-proposed` (use localhost, not pascal.localhost, if the page errors).
3. Regenerate after edits: `cd generator && node emit.cjs && node audit.cjs prop`. Validate with Pascal's `validateBuildJson` (needs the Pascal source checkout and bun).

## Rules learned the hard way
* The Pascal source on GitHub is newer than the 1.0.3 runtime. Test every node field by rendering it. Wall paint = `slots.interior/exterior`, not `a/b`.
* Colours: use `library:preset-*` or `scene:` materials; raw hex in a slot is ignored.
* Keep the street address out of committed files and scene names. Label guesses "(assumed)".
* Estimates in the model: hall width (`generator/hall.cjs`), floor-to-yard drop (`GROUND_DROP`), front steps, yard size, floor-to-floor 9'4". Replace with measurements (`docs/MEASURE.md`).

## Open work
Replace estimates with measurements; Bedroom 2/3 and bath sizes; ceilings that slope (photos); trim/baseboards, lights, closet rods; the living-room render (not in the repo yet);
terrazzo-lobe kitchen floor and a rounded niche arch need custom textures/geometry; a phone-friendly viewer page.
