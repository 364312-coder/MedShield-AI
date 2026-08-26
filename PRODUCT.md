# Product

## Platform

web

## Stack

single-page static HTML/CSS/JavaScript dashboard, no framework dependency.

## Users

Primary users are competition judges, teachers, and teammates reviewing a web demo of MedShield-AI during a project presentation.

## Product Purpose

The product turns the completed MedShield-AI backend experiment into a Chinese one-page competition dashboard that explains the system, shows formal results, and supports live presentation.

## Positioning

MedShield-AI is presented as a lightweight, auditable privacy protection and active defense system for grassroots hospital data, combining baseline protection, UFN-SAR + LightGBM risk detection, policy response, integrity checking, recovery, and event feedback.

## Operating Context

The frontend reads already-generated backend artifacts copied into `public/data/`. It must not retrain models, rerun experiments, or recompute security decisions.

## Capabilities and Constraints

The dashboard may display formal experiment metrics, event samples, asset and behavior counts, Step01-Step14 architecture, policy levels, integrity states, recovery outcomes, presentation storylines, and explicit capability boundaries.

It must label Permission/Network as simulated, Key enforcement as partial, DICOM native runtime as unavailable, EMR embedded watermark runtime as unavailable, TTD/TTC as pipeline latency, and data as synthetic/public experimental data.

## Product Principles

- Show evidence before claims.
- Keep backend outputs read-only.
- Make system boundaries visible.
- Let judges understand the full chain within one page.
- Prefer Chinese, presentation-ready explanations over raw technical exhaust.
