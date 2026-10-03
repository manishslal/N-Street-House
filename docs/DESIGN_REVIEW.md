# Interior-design review of the model

Method: `generator/audit.cjs` (re-runnable: `node audit.cjs prop` or `exist`) measures door swings, hall widths, furniture clearances and room sizes from the generated scene. The rest is judgement from the walkthrough photos and standard residential practice (IRC / common design guides: 36" minimum hall and stair width, 21" in front of a toilet, 30" door preferred, 42-48" kitchen aisle, 70 sq ft minimum bedroom with no side under 7'). Everything labelled "model number" comes from the original three.js artifact and has never been measured on site.

## A. Flat-out mistakes

| # | Problem | Evidence | Status |
|---|---|---|---|
| 1 | **Main hall is 1'8" wide** (zone is 0.5 m). Nobody can walk it with a door open, and a 1'5" pantry door sits on it. | audit; photos 25-26 show roughly 3'+ | Open. Needs the real width. Doors now hang toward free space so they don't swing into it |
| 2 | **Existing stair is 2'3" wide** (below the 36" minimum). | audit; the stair in photo 30 looks wider | Open. Measure it |
| 3 | **Every door was hung the same way** (swing in, hinge left), so some hit walls, furniture or beds. | audit | **Fixed.** `swing.cjs` picks swing side and hinge for each door so the open leaf is clear of walls and furniture. 0 hits on both layouts except the items below |
| 4 | **Bed blocked a closet door** (two beds). | audit | **Fixed** (beds moved 0.7 ft) |
| 5 | **Doors are narrow.** Five non-closet doors are 24-26" (standard is 28-30"; photos show ordinary 2'6" doors). | door list | Open. Use real widths |
| 6 | **Bedroom 3 is 64 sq ft** (code minimum 70). Bedroom 2 extended is 97 sq ft but only 7'0" in its narrow direction. The beds in these rooms are 5.0 x 4.6 ft, which is not a real bed (a full is 4.6 x 6.3 ft). | audit | Open: sizes come from the original. Beds are stand-ins |
| 7 | **Upstairs bath fixtures are tight**: toilet has 10" and 16" in front (21" needed), vanity 17", tub 16". | audit; Pascal's checker flags the same | Open. Depends on real bath sizes |
| 8 | **Stair headroom**: about 5'6" proposed / 4'3" existing at the stairwell edge (6'8" needed). | see FINDINGS.md | Open. Needs real floor-to-floor |
| 9 | **Laundry**: model has a single washer; the photos show a **stacked** washer/dryer in a closet (frames 20-21). | photos | Fix when we have the closet size |
| 10 | **Flat 8 ft ceilings everywhere**; photos show sloped/vaulted ceilings in some upstairs rooms (frames 2, 12, 38). | photos | Open. Need heights and where the slope is |

## B. Things you would expect to see that are missing

* **Lighting**: ceiling fixtures (photos: flush mounts in the halls, a brass chandelier in the dining room), pendants over the kitchen, vanity lights, recessed lights. The model has none, so rooms read as unlit boxes.
* **Trim**: baseboards (about 4"), door casings, window casings and sills, crown. These are what make the walls look finished.
* **Door hardware** (brass knobs in the photos), hinges, door stops. Handles are default.
* **Mechanical and utility**: louvered closet doors, water heater and furnace (frames 17-19), electrical panel under the stair (frame 7), supply/return vents, smoke and CO detectors. Mechanical closets matter because they eat floor area.
* **Closets**: rods and shelves (frames 6, 33-34, 42, 50), not just empty boxes.
* **Bath details**: mirrors/medicine cabinets, towel bars, shower curtain or glass door, toilet-paper holder, exhaust fan.
* **Kitchen**: range hood duct path (the east wall is a party wall and the shower bath is upstairs), under-cabinet lighting, toe-kick, trash/recycling, upper cabinets on the north wall (modelled) and any pantry storage.
* **Windows**: blinds or curtains, plus the egress-window size for bedrooms.
* **Entry**: coat hooks, a bench or console, a mat. The entry is only 3'0" x 3'4".
* **Outdoor**: front porch/stoop, mailbox, gate, rear door glazing, exterior lighting and siding.

## C. Improvements that should be easy once we have dimensions

1. **Door schedule**: one row per door with width, height, swing and hinge, driven from measurements (the swing chooser then re-checks it).
2. **Per-room contents** sized to real furniture. Candidates: 5'-wide queen in the primary bedroom, a twin or full in Bedroom 3, 36" nightstands, a 60" bath vanity, standard 30"/60"/32" tub, a 30" range, a 33" fridge.
3. **Lighting and trim pass**: add as nodes (Pascal has lights and trim fields) so the walkthrough looks finished.
4. **Kitchen aisle**: with 24" cabinets on both sides the aisle is 3'8". If measurement shows 7'8" is real, consider 18" shallow uppers only and no base cabinets on one side, or accept the galley.
5. **Colour and material schedule** per room (wall paint, floor, trim, cabinet), as in `finish.cjs`, so the existing and proposed looks differ only where the design changes.
6. **Phone view**: a standalone page with a room list and thumbnails, existing/proposed toggle, and a minimap. Pascal itself works on phone but the controls are dense.

## D. Polish checklist (visual)

Consistent wall colour per room, baseboard colour = door colour, one floor material per room with thresholds at doorways, ceiling lights centred in rooms, a single accent per room (as in your renders), rug under the coffee table and dining table, art/mirrors on blank walls, plants, window treatments, matching hardware metal (brass in the house, brass in the new kitchen).

## E. What I still cannot judge

Whether the textures look right (they load from Pascal's servers, which I cannot reach), furniture orientation in a real browser, real room sizes, sun and view, and structure (which walls are load-bearing). The architect should confirm any wall move.
