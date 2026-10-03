# Pascal authoring notes

What we learned authoring a scene by hand-generated JSON against Pascal 1.0.3
(`@pascal-app/cli@1.0.3`, runtime downloaded by the CLI). Items are tagged:
**[verified]** = observed in a running editor during this spike, **[source]** =
read from Pascal's source but not exercised here.

## Coordinates and units

* Metres and radians. Plan point is `[x, z]`; Y is up. World = `(x, y, z)`, no sign flip. **[verified]**
* In this model **x = east, z = south**. The original model's plan has its front wall at z = 0
  with z growing to the rear, so the generator maps `Z = D − z_plan`. Without that flip the
  house comes out mirror-imaged. **[verified]**
* Yaw: a thing's front faces `(sin yaw, cos yaw)` in world X/Z → yaw 0 faces south (+Z),
  π/2 east, π north, −π/2 west. Holds for the walkthrough spawn **[verified]** and for
  catalog items (Pascal's own `furnish_room` uses `atan2(inX, inZ)`) **[source]**.
* Rotation is a scalar for stair / stair-segment / spawn / cabinet / column, but a 3-tuple
  for item / door / window / shelf / building.

## Scene envelope

```json
{ "nodes": { "<id>": { ... } }, "rootNodeIds": ["site_..."], "collections": {}, "materials": {}, "installedPlugins": [] }
```

Flat map; parent links go both ways (`parentId` and the parent's `children`). Ids are
`<prefix>_<anything>` where the prefix is the type (`wall_`, `door_`, `slab_`, `sseg_` for stair segments …).
Load routes: `POST /api/scenes {id,name,graph}` on the running editor **[verified]**; UI
Settings → Save and load → Load build, and `/import?src=<url>` **[source]**.

## Structure

* `site → building → level(s)`. Always set `level.height` (floor-to-floor, metres) or the
  scene is treated as legacy and 2.5 m is assumed. Levels stack: base Y = sum of lower heights. **[verified]**
* **Walls**: `start`/`end` centre-line, `thickness`, optional `height` (absent = follows the storey).
  Face `a` is left of start→end. Wall `children` must list every hosted door/window.
* **Doors/windows** are hosted: `parentId = wallId = the wall`, and `position` is
  **wall-local metres** `[distance from wall start to opening centre, height of centre, 0]`
  (not plan coordinates, not 0..1). Must fit inside the wall (1 cm tolerance). `openingKind: "opening"`
  makes a door-less cased opening. **[verified]**
* **Slabs** are manual floors: `polygon`, `holes`, `elevation` (walking surface, level-local),
  `thickness` (grows downward). A stairwell is a manual hole in the upper slab. **[verified]**
* **Zones** (rooms) need a `name` and `polygon`, may carry a saved `camera {position,target}` in world
  coordinates; the HUD in walkthrough shows the zone you are in. **[verified]**
* **Spawn**: first spawn by id sort wins; eye height +1.65 m; this is where the walkthrough starts. **[verified]**
* **Items** need a full `asset` object (`id, category, name, thumbnail, src, dimensions[w,h,d]`);
  `src` must be a root-relative path or https/localhost URL. Only 23 catalog items have
  documented dimensions in the repo (`packages/mcp/src/tools/asset-catalog.ts`). **[source]**
  The runtime resolves `/items/…` and `/material/…` against `editor.pascal.app`, so models/textures
  need network access; offline they show as hatched placeholder boxes (which still show true footprint). **[verified]**

## Stairs (the part that needs care)

* A `stair` holds `stair-segment` children (`stair` flights and `landing`s) that are **chained**:
  each segment's pose is recomputed from the previous one; stored segment `position`/`rotation` are ignored. **[source]**
* Segment local frame: origin at the middle of the start edge, spans `x ∈ [−w/2, w/2]`, `z ∈ [0, length]`, +z = travel.
* `front` continues straight (+length); `left`/`right` attach at the previous segment's side **at the middle of
  its length** and turn ±90°. y rises by the previous segment's `height`.
* A flight with `N` steps and `height H` has risers of `H/N`; the **last tread is flush with whatever follows**
  (landing or upper floor). So "10 treads then a landing one riser higher" is a flight of **11** steps.
* The landing-then-turn pattern assumes the side flight is as wide as the landing is long and centred on it.
  The original model's geometry (3 ft × 3 ft landing flush with the wall) can't be expressed as one chained
  stair, so this spike emits it as three stair nodes (lower flight + landing + upper flight) placed to
  reproduce the exact tread/riser positions. **[verified visually]**
* Set `totalRise` explicitly so Pascal does not rescale the rise from level elevations.

## Viewing / navigation

* Preview mode (top right) → footsteps button = walkthrough. Walkthrough keys: WASD/arrows, Shift run,
  Space jump, Ctrl crouch, `E` open doors, `P` free cursor, `Esc` exit. **[verified: start pose, movement, HUD]**
* Level display modes (stacked / exploded / solo) are in the Preview bottom bar. **[source]**
* Selecting a level (or a zone) in Preview flies the camera to that node's saved `camera`. The Site tree's
  Zones tab has a per-room camera menu → View snapshot. **[source + level camera verified]**

## Gotchas

* Headless/software rendering: the first walkthrough frames are not the spawn pose (it settles after a few
  seconds), and synthetic mouse moves inject look-deltas into the walkthrough. Don't script mouse clicks
  during a walkthrough test; trigger buttons with a DOM `click()`.
* `*.localhost` hostnames do not resolve in some sandboxes (Node can't), which breaks the scene page's
  server-side fetch; use `http://localhost:<port>`.
* The npm install of the monorepo needs GitHub-hosted plugin tarballs; use the published CLI instead.

## Runtime 1.0.3 vs the Pascal source on GitHub (read this before trusting the source)

The editor you run (`@pascal-app/cli@1.0.3`) is an older build than the source on `main`. Features that exist only in newer source silently
do nothing in 1.0.3. Verified by rendering:

* **Wall paint** uses slots `interior` / `exterior` (plus `skirtingInterior`, `crownInterior`, band slots `lowerInterior` / `middleInterior` /
  `upperInterior` and the `…Exterior` twins when `faceBands` is on). The `a` / `b` slots and `faceRegions` of newer source are ignored.
  The default for every wall slot is `library:concrete-drywall`, which is the grey wall with white dots.
* Which face uses which slot comes from `frontSide` / `backSide`. Mapping found by looking at renders, not by reading code: for an east-west wall
  drawn start to end with +x, `frontSide` is the **south** face (smaller plan z). For the exterior walls this generator sets them so the siding
  colour lands outside. See `wallSides()` in `generator/finish.cjs`.
* `library:preset-*` are flat colour presets (softwhite #ebe7df, terracotta, olive, sage, cream...). `scene:<id>` materials in the scene
  envelope's `materials` map **do work** on walls, slabs and ceilings in 1.0.3, so exact colours are possible (`PAINT` in `generator/finish.cjs`).
  Raw hex strings in a slot do **not** work (they fall back to the default).
* Fence style `guard` / base style `raised` are rejected by the scene API in 1.0.3.
* Door `hingesSide` / `swingDirection` work (`generator/swing.cjs` sets them).
* Library material ids that look like textures can surprise you: `flooring-terrazzo19` is a teal medallion tile, `concrete-drywall` is the dotted
  grey wall. Preview thumbnails (`/material/.../*_thumb.webp` on editor.pascal.app) are the quickest way to choose.

## Custom models
Items accept any `http://localhost:<port>/...glb` (or https) as `asset.src`. `models/build-models.cjs` writes the custom furniture and
lights (round table, bentwood and rattan chairs, curved sofa, pendants, sconce, rug, curtains, stool, plant, trellis) and
`scripts/serve-models.sh` serves them with CORS on port 8765. `generator/emit.cjs` points items with `@models/...` sources at that server
(`MODEL_BASE` overrides the origin). If the server is not running those items show as hatched boxes.

## Walkthrough camera
In the walkthrough the camera looks along (-sin yaw, -cos yaw): spawn yaw 0 faces north (into the house from the front door), yaw pi faces the
front door. This is the opposite of the item convention above. The default spawn is now yaw 0.

## Looking at it from the sandbox
The headless-browser screenshots now show real textures and models. The earlier "flat grey" screenshots were a TLS problem: Chromium needs
`ignoreHTTPSErrors` behind the sandbox proxy. `tools/eyeshot.cjs` takes eye-level shots through the walkthrough.
