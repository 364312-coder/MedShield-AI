Evidence Proof V5.1

Installer fix: replaced PowerShell String.Split substring validation with Regex.Matches, because String.Split was validating characters rather than the literal function signature. The previous V5 installer restored the original files before exiting, so this package can be installed directly.

MedShield-AI · Evidence Proof V5

Purpose
- Rebuild only the Experiment Verification view around the actual MedShield-AI method chain.
- Patch the real dynamic renderer: public/medshield-app-shell.js -> moveEvidence(view).
- Do not modify Plety background, Risk page, Defense page, Simulation logic, Worker/D1/Wrangler/backend, or global font declarations.

Evidence structure
U/F/N -> AE + LightGBM -> R/A -> Policy Engine(R,D,A,C,Trap) -> P0-P3 -> Containment -> Integrity -> Conditional Recovery -> Confirmed Event Pool -> Offline Optimization

Formal figures used
- 50,000 events; 15,000 attack events
- Accuracy 98.44%; Precision 98.66%; Recall 96.10%; F1 97.36%; AUC 98.61%
- Containment 14,415/15,000 = 96.10%; failed 585; false blocking 1.28%
- Scenario detection: Image Leakage ~99.96%; EMR 99.50%; Data Exfiltration ~99.79%; Multi-source ~99.92%; Slow Exfiltration 100%; Account Abuse 76.46% (current limitation)
- Policy: P0=33,854; P1=698; P2=407; P3=15,041
- Integrity: NORMAL 49,998; high-confidence anomaly 2; expected/detected 2/2
- Recovery requested/attempted/success/cold backup 2; mean recovery pipeline latency ~9.05 ms
- 3,000 unseen attack events: 100% detection rate in this formal experiment only

Boundary wording
- Permission/Network actions: SIMULATED
- Key enforcement: PARTIAL
- DICOM embedded watermark runtime: UNAVAILABLE
- EMR embedded watermark runtime: UNAVAILABLE
- Unknown leaked-image blind attribution: UNAVAILABLE
- Real HIS/PACS production control: NOT IMPLEMENTED

Installer behavior
- Creates timestamped backup before editing.
- Refuses to continue unless exactly one real moveEvidence(view) renderer is found.
- Replaces only that renderer and one isolated Evidence V5 CSS block.
- Updates App Shell cache version in public/index.html.
- Validates DOM sentinel, CSS braces, and JS syntax when Node is available.
- On failure, automatically restores original files.
