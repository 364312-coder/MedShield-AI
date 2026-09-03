MedShield-AI Simulation Lab - Central Stage Fix

Changes:
1. Replaces generic class "next" with namespaced "sim-next-cell" to prevent legacy CSS collisions.
2. Scenario and mode controls are locked while a simulation is running. Only explicit Reset can return to READY.
3. Central stage is reorganized into three compact bands: attack path, AI judgement, response/trust.
4. No new v22/v23/v24 UI layer is added. The same v2 CSS/JS remain the sole owner.
