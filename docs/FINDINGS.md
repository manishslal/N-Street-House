# Findings — Pascal Editor spike

**Verdict: Pascal is a good base for the "browse and move through the rooms" tool.**
Out of the box it gave us a first-person walkthrough with a room-name HUD, a stacked/exploded dollhouse,
a 2D plan with door swings and stair annotations, saved per-room cameras, and a layout-clearance checker.
It is MIT-licensed and actively developed. The costs are real, though: stairs need care, textures/models
come from its CDN, and "existing vs proposed" is two scenes rather than a toggle. Details below.

## What was built

Both layouts of the original model were reproduced as Pascal scenes (`scenes/house-existing.json`,
`scenes/house-proposed.json`) by a generator that reads the original model's own code:

| | Existing | Proposed |
| --- | --- | --- |
| Walls | 37 | 35 |
| Doors / cased openings | 17 | 18 |
| Windows | 9 | 9 |
| Stair nodes | 1 (14 steps, straight) | 3 (11-step run + landing + 3-step run) |
| Rooms (zones, each with a saved camera) | 24 | 23 |
| Furniture items (Pascal catalog) | 25 | 25 |

## What was verified, and how

| Check | Method | Result |
| --- | --- | --- |
| Walls and openings match the original | `generator/verify.cjs`: both models sampled on a 2 cm grid at 4 heights, compared | 99.94–100 % overlap (48 stray samples in total; all trace to the verifier's corner approximation). Door leaves the original drew flat on solid walls are masked because they became real openings on purpose. **Walls and openings only — not stairs, floors, rooms or furniture.** |
| Scenes are valid Pascal data | Pascal's own `validateBuildJson` run on both files | 0 errors, 0 warnings |
| Stair geometry | Independent reviewer (separate agent) recomputed riser/tread/landing/turn numbers from the original code and from the scene | Match: 15 risers of 7.47 in; lower run 10 treads at 10.5 in plus the landing riser; 3 ft × 3 ft landing at the 11th riser; 3 upper treads; same turn direction. Existing stair also matches (14 treads, 15 risers of 7.47 in, 2.23 ft wide). |
| Stairwell holes | Same reviewer | Match the original floor pieces and cover the stair path in both layouts |
| Windows, doors | Same reviewer | All 9 windows and every door/opening present with matching width, sill, head, position (after the fixes listed below) |
| Looks right in the editor | Rendered in headless Chromium (software GL): overviews, 2D plans, eye-level views, every room camera | See `screenshots/`. Walkthrough starts at the front door facing the stair; walking forward moved the character and the HUD moved from "Entry" to "Stairs up". |
| The editor won't rescale the stair | Read Pascal's source (`stair-rise-query.ts`) | An explicit `totalRise` is used as-is and never re-synced |

Things the independent review caught and that were then fixed: a missing findings doc, an over-claim in the
README, furniture poking a few cm into walls, furniture that wasn't in the original, a stub wall, a doorway that
should have been an open archway, and gaps between room polygons.

### What was NOT verified (be aware)

* **Climbing the whole stair in the walkthrough.** The software renderer is too slow and its synthetic mouse
  input fights the walkthrough controls. Start pose, forward movement and the HUD were confirmed; reaching the
  upper floor was not. Please try this in a real browser first.
* **Furniture and textures.** The runtime fetches models and textures from `editor.pascal.app`, which was not
  reachable from the build sandbox, so items showed as outline boxes (correct footprint, no model). Furniture
  orientation follows Pascal's documented convention but is unconfirmed visually.
* **The hosted editor.** Everything was exercised against Pascal 1.0.3 run locally. Loading via the hosted
  editor's "Load build" / `/import` was read from source, not tried.
* Rendered colours in the screenshots are flat grey for the same CDN reason, and a few hatched boxes float in
  stair views: those are upper-floor furniture placeholders that ignore level hiding while models can't load.

## Design observations (these come from the original model, not from Pascal)

1. **Stair headroom looks tight at the start of the run.** The original assumes 9'4" floor-to-floor and a
   1'4" floor build-up, so the upper-floor underside is about 8'0" above the main floor. The stairwell hole
   begins 6'4" back from the front wall; by then the proposed stair has risen 4 steps (2.5 ft), leaving about
   **5'6"** of vertical clearance at the edge (existing stair: about 4'3"). Code usually wants 6'8".
   Roughly, the opening would need to start about 1'4" earlier (around tread 2), or the floor build-up or
   ceiling height would need to differ from the assumed numbers. Worth confirming with the architect.
2. **Pascal's clearance checker (`verify_scene`) flags tight spots** under default door swings: the fridge sits
   in the swing of the two pantry/closet doors beside it; the en suite door swing vs the vanity and tub; the
   shower base vs the shower-bath door; the washer vs the (4'2") laundry door. Several of these use furniture
   positions that are approximate, so treat them as "go look", not as errors.
3. The original has no ceilings, roof or handrails. We added ceilings (at the 8 ft wall height; the main-floor
   ceiling is open over the stairwell) and stair handrails (west side of the lower run and landing, open south
   side of the upper run). There is still no roof.

## Limitations and judgement calls in the scenes

* The proposed stair is **three stair nodes**, not one: Pascal chains a side flight at the middle of the
  previous landing, which can't express the original's exact 3 ft × 3 ft landing. They line up exactly, but
  moving the stair means selecting all three.
* **Furniture is illustrative.** It uses Pascal's built-in catalog (only 23 pieces have known dimensions),
  scaled to the original's footprints where sensible: the sofa is generic (not the L-shaped sectional), beds
  take the original's footprint (the original's Bedroom 2 "bed" is only 4.6 ft long), and the original's
  upper kitchen cabinets, drawer fronts and linen shelves are not modelled.
* Where the original drew a closet/pantry/laundry door as a flat panel on a solid wall, the scene has a real
  opening (the original's walls are solid there). The existing coat-closet doorway is left as an open gap
  (the original has a door leaf but no wall around it); the proposed under-stair bifold doors are not modelled.
* Walls on the upper floor stop at 8 ft as in the original; main-floor exterior and party walls run full storey
  height so the floor build-up is hidden.
* Room polygons are hand-drawn from the original's labels and walls (a few small slivers are unassigned).

## Pascal: strengths, risks

**Strengths** — MIT; real walkthrough with collision, door interaction and room-name HUD; stacked / exploded
/ solo level views; 2D plan with door swings and stair dimensions; layout clearance checks; JSON scene format
that is easy to generate and diff; embeddable viewer packages; agent/MCP tooling (the generator approach worked
without any of it, but it is there).

**Risks / costs**
* Young, fast-moving project (v1.0.3): schemas and UI will keep changing; scenes load through migrations.
* Textures, furniture models and icons load from `editor.pascal.app` — needs internet, and a self-hosted copy
  would need those assets mirrored.
* Needs a WebGPU-capable browser for best results (falls back otherwise); software rendering is slow.
* Existing/Proposed is two scenes. A toggle would need a small custom layer or Pascal's scene "variants".
* Stair authoring is fiddly (see above); the editor UI is dense for non-technical users.
* The monorepo's `bun install` pulls plugin tarballs from GitHub; the published CLI is the practical route.

## Recommendation

Keep going with Pascal, in this order:
1. **Try this spike in a normal browser** and tell us what feels wrong (walk the stair, room cameras, 2D plan).
2. **Replace the guessed numbers with real ones**: floor-to-floor, floor build-up, stair width, door swings,
   and your real furniture dimensions — the generator makes that a data edit, not a rebuild.
3. **Settle the headroom question** above with the architect — this tool is good at making that visible.
4. Add: ceilings, handrails, upper kitchen cabinets, measurement/tape tools, paint and floor finishes, sun study.
5. Decide hosting: local only, or a small self-hosted build that bundles Pascal's assets and adds an
   Existing/Proposed toggle and a "room list" panel.

If Pascal's UI proves too heavy for casual browsing, its viewer packages can be embedded in a slimmer page
without redoing any of this — the scenes are the asset that carries over.
