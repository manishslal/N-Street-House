# N Street House — Pascal Editor spike

A spike that rebuilds the two-floor house model (originally a hand-coded three.js
artifact) as a real, editable scene in [Pascal Editor](https://github.com/pascalorg/editor)
(MIT, React Three Fiber): walls with real door/window openings, floors with a
stairwell hole, the existing and proposed stairs, labelled rooms with saved
cameras, furniture, and a first-person walkthrough start point.

This folder is self-contained: it lives in `house-spike/` in the repo but can be copied anywhere
(e.g. `~/Desktop/Coding-Projects/N-Street-House/`).

## What is here

| Path | What |
| --- | --- |
| `scenes/house-existing.json`, `scenes/house-proposed.json` | Ready-to-load Pascal scenes (the two layouts). |
| `generator/` | Node scripts that turn the original model into those scenes (see "How it was built"). |
| `reference/bethan-original.html` | Untouched copy of the original artifact — the single source of truth the generator reads. |
| `scripts/` | Start a local Pascal editor and load the scenes. |
| `docs/FINDINGS.md` | Research, what was verified and how, what was not, limitations, recommendation. |
| `docs/ROOMS.md` | The room list and what each room's saved camera shows. |
| `docs/PASCAL_NOTES.md` | Pascal authoring notes (schemas, conventions, gotchas) learned while building this. |
| `screenshots/` | Renders from the verification runs. |

## Try it

Requires Node 22.13+ and network access (the editor runtime, textures and
furniture models are fetched from npm / `editor.pascal.app`).

```bash
scripts/start-pascal.sh          # prints the editor URL/port
scripts/serve-models.sh          # leave running: serves the custom furniture models on :8765
scripts/load-scenes.sh <port>    # loads both scenes
# open http://localhost:<port>/scene/house-proposed   (or house-existing)
```

Alternative with no scripts: open any Pascal editor (local, or the hosted one),
then **Settings → Save and load → Load build** and pick one of the JSON files in
`scenes/`.

### Using it

* **Preview** (top right) hides the editing UI; the footsteps button starts the
  **walkthrough**. It starts just inside the front door facing the stair.
  WASD / arrows move, Shift runs, Space jumps, `E` opens doors, `Esc` exits.
  The HUD shows the room you are in.
* **Upper floor / Main floor** (top-left level list) switches floors; **Stack**
  and the layers button in Preview switch stacked / exploded / solo.
* **2D** and **Split** show the plan; stairs, door swings and room names are drawn.
* Every room has a saved camera: Site tree → Zones tab → hover a room →
  camera icon → **View snapshot**.
* The proposed new walls are tinted light blue and named "New wall (proposed)".

## How it was built

1. `generator/capture.cjs` runs the original model's own plan-building functions
   (`mainShell`, `upperProposed`, …) against a recording harness, so the **walls, door
   and window openings and floor pieces** come straight from the original numbers.
   The stair dimensions, room outlines and furniture positions are hand-authored in
   `emit.cjs` / `furniture.cjs` from the original's geometry and labels.
2. `walls.cjs` / `plan.cjs` merge wall fragments into wall runs, detect door and
   window openings from the gaps, snap corners onto centre-lines, and convert to metres.
3. `emit.cjs` writes Pascal nodes (site → building → 2 levels → walls / doors /
   windows / slabs / zones / stairs / items / spawn). `furniture.cjs` places
   catalog items from the original furniture footprints.
4. `verify.cjs` re-samples both models' **walls and openings** on a 2 cm grid and compares them
   (stairs, floors, rooms and furniture are checked separately — see `docs/FINDINGS.md`).

```bash
cd generator
node capture.cjs && node emit.cjs   # regenerates ../scenes/*.json
node verify.cjs                     # wall/opening diff vs the original
```

To change the layout, edit the original-style data or the generator, then
regenerate; to hand-tune in the editor, export with **Save build**.

## Screenshots

`screenshots/` — renders from a headless, offline sandbox (flat grey, furniture as outline boxes; real
browsers load textures/models from `editor.pascal.app`). `original-artifact-*.png` show the model we started from.
