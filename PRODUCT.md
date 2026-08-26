# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

delegated: single-page static HTML/CSS/JavaScript dashboard, chosen to avoid installing dependencies and to keep the first competition demo fast, portable, and read-only.

## Users

Primary users are competition judges, teachers, and teammates reviewing a web demo of MedShield-AI during a project presentation.

## Product Purpose

The product turns the completed MedShield-AI backend experiment into a clear one-page dashboard that explains the system, shows formal results, and supports a live presentation.

## Positioning

MedShield-AI is presented as a lightweight, auditable privacy protection and active defense system for grassroots hospital data, combining baseline protection, UFN-SAR + LightGBM risk detection, policy response, integrity checking, recovery, and event feedback.

## Operating Context

The frontend reads already-generated backend artifacts from `C:\Users\18950843148\Desktop\作品赛\MedShield-AI\outputs\formal_competition\run_20260826_153334`. It must not retrain models, rerun experiments, or recompute security decisions.

## Capabilities and Constraints

The dashboard may display formal experiment metrics, event samples, asset and behavior counts, Step01-Step14 architecture, policy levels, integrity states, recovery outcomes, and explicit capability boundaries. It must label Permission/Network as simulated, Key enforcement as partial, DICOM and EMR embedded watermark runtime as unavailable, TTD/TTC as pipeline latency, and data as synthetic/public experimental data.

## Brand Commitments

Use the name MedShield-AI. The product should feel medical, secure, credible, and competition-ready.

## Evidence on Hand

Key evidence includes the frontend handoff document, dashboard contract, system capability notes, and final formal run artifacts under `C:\Users\18950843148\Desktop\作品赛\MedShield-AI\outputs\formal_competition\run_20260826_153334`.

## Product Principles

Show evidence before claims.
Keep backend outputs read-only.
Make system boundaries visible.
Let judges understand the full chain within one page.
Prefer concise, presentation-ready explanations over raw technical exhaust.

