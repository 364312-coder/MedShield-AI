MedShield-AI Risk Assessment FINAL DESIGN

Scope:
- Replaces only the Risk Assessment page's old v14-risk-story DOM.
- Adds one final scoped .app-view-risk layout block.
- Does not change font declarations or Plety dynamic-background files.
- Does not modify JS behavior, Simulation, popups, Evidence, other views, or backend.

Formal method chain:
U / F / N -> X -> AutoEncoder -> E_AE -> LightGBM -> R / A
Trap is separate Policy Context and does not enter AI features.
