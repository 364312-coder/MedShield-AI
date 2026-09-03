MedShield-AI Converged Fix

Fixes only:
1. Home foreground positioning/visibility; Plety blue dynamic background unchanged.
2. Hard page load always starts at #home; internal navigation still uses hashes.
3. Removes the vertical blue overlay by fixing the sim-parallel-lanes container (historical top+bottom stretch root cause).
4. No intermediate auto popups. One final evidence/result dialog opens when single-event audit completes or when one-click batch processing finishes.
5. Keeps the one-click processing control.

Files replaced:
- public/index.html
- public/medshield-app-shell.css
- public/medshield-app-shell.js
- public/medshield-simulation-v2.css
- public/medshield-simulation-v2.js
