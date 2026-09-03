MedShield-AI Evidence Stability Fix

Scope:
- medshield-app-shell.css
- medshield-app-shell.js

Fixes:
1. Core results right side now shows formal security outcomes and experiment scale.
2. Evidence tab switching scrolls the active panel into a stable position.
3. Removes redundant previous/next Evidence navigation.
4. FAQ uses balanced two-column layout; last odd item spans both columns.
5. Evidence legacy reveal/visibility states are neutralized consistently.
6. App Shell boot now has rollback/fallback behavior so a JS initialization failure does not leave the site black.

Not modified:
- Home content
- Plety blue dynamic background
- Simulation files
- Worker / D1 / Wrangler
