# Design

## Surface

MedShield-AI is a Chinese one-page read-mode dashboard for competition presentation. It should feel like a hospital security command desk: dense enough to be credible, clean enough to explain live.

## Visual System

The page uses a clinical white surface, ink navy text, verification green, instrument blue, cyan, amber, and coral for risk or boundary states.

## Layout

The first viewport combines a large explanation headline with formal run metrics. Later sections move from presentation thesis, data assets, system chain, demo scenarios, AI evidence, policy defense, integrity recovery, event samples, speaker notes, and capability boundaries.

## Interaction

Navigation uses anchor jumps inside the single page. Event samples can be filtered by scenario and policy level. The page reads local static data only.

## Data Rules

The interface must read `dashboard-v1` outputs without recomputing security logic. It should not load the full `events.jsonl` in the browser until a pagination or sampling layer exists.

## Copy Rules

Use Chinese as the primary UI language. English may be retained only for necessary acronyms or model names such as UFN-SAR, LightGBM, Precision, Recall, F1, AUC, AES-GCM, Local, Cold, Policy.

Claims must stay tied to backend evidence. Permission and Network are simulated, Key is partial, DICOM native runtime and EMR embedded watermark runtime are unavailable, TTD/TTC is pipeline latency, and data is synthetic/public experimental data.
