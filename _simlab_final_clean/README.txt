MedShield-AI Simulation Lab — clean single-owner final baseline

This patch is built directly from the user-provided CLEAN BASELINE.
It modifies only:
  public/index.html
  public/medshield-simulation-v2.css
  public/medshield-simulation-v2.js

It does NOT modify:
  public/app.js
  src/worker.js
  wrangler.jsonc / wrangler.toml
  Hero / Risk Story / formal metrics logic / Footer source files

Final UI changes:
- Chinese-first Simulation Lab interface.
- Strong selected-attack state: deep medical-blue fill, cyan left marker, visible "selected" badge.
- Six-stage visible lifecycle: attack -> AI analysis -> policy -> defense -> integrity -> recovery/audit.
- Current stage + what is happening + next action callout.
- Larger inline Event Stream.
- Native <dialog> large Event Stream popup; open from the explicit button or any log row.
- Popup includes current attack, current phase, event ID, recorded R and P, process stages, and full logs.
- Parallel mode keeps 2–4 real formal events separate; no invented aggregate risk/correlation.
- Recorded R/A/P/containment/integrity/recovery values remain sourced from formal rows.

Local smoke tests completed in headless Chromium:
- 6 scenarios rendered.
- selected/unselected visual state differs materially.
- parallel mode selects 3 events.
- formal decision state reaches operator-decision stage.
- process strip follows state.
- normal branch: defend -> integrity -> audit -> complete.
- recovery branch: defend -> integrity anomaly -> recovery -> audit -> complete.
- Event Stream popup opens from explicit button and from log row, and closes correctly.
- no JavaScript page errors in the isolated test harness.
