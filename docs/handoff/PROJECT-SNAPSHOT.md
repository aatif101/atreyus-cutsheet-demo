# Project

## What This Is

A focused Next.js demo for an internship application to Atreyus AI. The app demonstrates a CutSheet-style construction estimating workflow: an estimator pastes a natural-language scope, Claude extracts structured lumber cuts, deterministic TypeScript optimizes those cuts against stock boards, and Claude summarizes the result with cost, waste, and assumptions.

This is a hiring demo, not a production construction estimating platform. It is optimized for a credible 2–3 minute Loom and for an interviewer asking why the system is divided between LLM and deterministic code.

## Core Value

The one thing that must work is the credible end-to-end CutSheet pipeline: natural-language scope → structured cuts → deterministic lumber optimization → estimator-readable summary with cost and waste.

## Project Shape

- **Complexity:** complex
- **Why:** The app is small, but it crosses UI, API routes, Claude structured output, deterministic optimization, tests, and production deployment. The architecture story matters as much as the UI.

## Current State

Greenfield repository with only GSD scaffolding and `.gitignore`. No app code, tests, CI, or deployment are present yet.

## Architecture / Key Patterns

Planned stack and architecture:
- Next.js App Router with TypeScript and Tailwind CSS.
- Two server endpoints: `POST /api/extract` and `POST /api/summarize`.
- Anthropic TypeScript SDK with `claude-sonnet-4-6` for LLM extraction and summary.
- Pure browser-side TypeScript optimizer using First Fit Decreasing bin packing.
- Vitest for deterministic optimizer unit tests.
- Vercel production deployment using `ANTHROPIC_API_KEY`.

Key pattern: server-side code handles secret-bearing Claude calls; browser code handles instant deterministic optimization. This mirrors the actual division of labor between LLM reasoning and algorithmic computation.

## Capability Contract

See `.gsd/REQUIREMENTS.md` for the explicit capability contract, requirement status, and coverage mapping.

## Milestone Sequence

- [ ] M001: Atreyus CutSheet Demo — Build and deploy a credible staged CutSheet demo with Claude extraction, deterministic lumber optimization, Claude summary, tests, README, and Vercel production URL.
