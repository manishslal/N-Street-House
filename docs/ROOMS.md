# Room list and saved cameras

Pascal already has a room list: **left sidebar → Site tree icon → Zones tab**. Each row is a room.
Hover a row → camera icon → **View snapshot** to fly to that room's saved view. (Select the floor first
if the room is on the other level.)

Two kinds of saved view, defined in `generator/emit.cjs` (`CAM_OVERRIDE` and `cameraFor`):

* **Eye level** (5.3 ft): the main spaces and the stair. Hand-aimed at the most useful angle.
* **Dollhouse** (17 ft up, looking down from the front): small rooms where an eye-level camera would
  be jammed in a corner — closets, baths, powder room, laundry, pantry, utility, walk-in, linen.

## Proposed layout

| Floor | Room | View |
| --- | --- | --- |
| Main | Entry | eye level, from the front door toward the stair |
| Main | Living room | eye level, from the front-right window corner toward the stair wall |
| Main | Stairs up | eye level, from the entry looking up the lower run |
| Main | Stair landing | eye level, on the landing looking along the upper run |
| Main | Kitchen | eye level, from the hall side across the counters |
| Main | Dining | eye level, from the kitchen toward the rear door and window |
| Main | Hall, Powder, Pantry, Laundry, Utility, Storage closet | dollhouse |
| Upper | Hall | eye level, looking north along the hall |
| Upper | Stair opening | eye level, from the hall looking back over the stairwell |
| Upper | Primary bedroom | eye level, from the hall side across the bed |
| Upper | Bedroom 2 (extended) | eye level, from the front corner toward the rear |
| Upper | Bedroom 3 | eye level, from the hall door toward the window |
| Upper | Walk-in, En suite, Shower bath, Closet, Bedroom 2 closet, Linen | dollhouse |

The existing layout has the same rooms except the proposed-only ones (Stair landing, Storage closet
differences) and a few existing-only ones (Coat closet, Storage under stairs, Towel closet).

## Ideas that need a custom page (not in Pascal today)

A room list with thumbnails, a "you are here" minimap, a guided tour that walks the rooms in order, and
a phone-friendly standalone viewer. Pascal's viewer packages can be embedded for that.
