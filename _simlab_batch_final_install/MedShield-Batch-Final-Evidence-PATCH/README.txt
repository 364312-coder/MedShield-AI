MedShield-AI Simulation Lab — Batch + Final Evidence Fix

Changes only:
1. Remove all intermediate step-result auto popups.
2. Keep only the final Complete Evidence dialog, opened explicitly after COMPLETE.
3. Add one-click processing: single event = finish current event; parallel = batch-process all eligible events.
4. Fix recurring tall cyan/blue overlay by eliminating generic current/done class collisions and hard-resetting the parallel lane / AI node dimensions.
5. Plety blue dynamic background is not included and not modified.
6. App Shell / Worker / D1 / Wrangler are not modified.

Files replaced:
- public/index.html
- public/medshield-simulation-v2.css
- public/medshield-simulation-v2.js
