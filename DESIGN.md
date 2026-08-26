# Design

## Surface

MedShield-AI is a one-page read-mode dashboard for competition presentation. It should feel like a hospital security command desk: dense enough to be credible, clean enough to explain live.

## Visual System

The page uses a clinical white surface, ink navy text, verification green, instrument blue, cyan, amber, and coral for risk or boundary states. Cards are used only for individual metrics, panels, event rows, and capability facts.

## Layout

The first viewport combines a large explanation headline with formal run metrics. Later sections move from system chain to AI evidence, policy defense, integrity recovery, event samples, and capability boundaries.

## Interaction

Navigation uses anchor jumps inside the single page. Event samples can be filtered by scenario and policy level. The first version reads local static data only.

## Data Rules

The interface must read `dashboard-v1` outputs without recomputing security logic. It should not load the full `events.jsonl` in the browser until a pagination or sampling layer exists.

## Copy Rules

Claims must stay tied to backend evidence. Permission and Network are simulated, Key is partial, DICOM and EMR embedded watermark runtime are unavailable, TTD/TTC is pipeline latency, and data is synthetic/public experimental data.

