MedShield-AI Risk History Cleanup

Scope: ONLY public/medshield-app-shell.css

What this cleanup does:
- Removes the old historical risk-layout block that converted the legacy scroll story.
- Removes the old max-width:1180 risk grid override.
- Removes superseded duplicate risk typography declarations from an earlier fine-tune block.
- Keeps the latest presentation-size typography unchanged.
- Consolidates the minimum structural reset into the single final .app-view-risk section.
- Keeps all other views, JS, Plety background, Simulation, Evidence, Home and backend untouched.

This is cleanup only. It does not redesign the Risk Assessment page.
