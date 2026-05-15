# Requirements

This file is the explicit capability and coverage contract for the project.

## Active

### R001 — The app must convert a natural-language construction scope into structured required cuts with material, length in inches, quantity, purpose, and assumptions.
- Class: core-capability
- Status: active
- Description: The app must convert a natural-language construction scope into structured required cuts with material, length in inches, quantity, purpose, and assumptions.
- Why it matters: This is the first half of the CutSheet demo and proves the app can bridge estimator language into data a deterministic optimizer can use.
- Source: user
- Primary owning slice: M001/S03
- Validation: mapped
- Notes: Uses Claude structured output through `POST /api/extract`.

### R002 — The UI must show a real staged flow where extraction completes first, browser optimization runs second, and summary completes third.
- Class: primary-user-loop
- Status: active
- Description: The UI must show a real staged flow where extraction completes first, browser optimization runs second, and summary completes third.
- Why it matters: The staged flow is the core Loom moment and demonstrates an agent pipeline without theatrical timing.
- Source: user
- Primary owning slice: M001/S04
- Supporting slices: M001/S03
- Validation: mapped
- Notes: No fake sequential reveal after a combined response; stages reflect actual runtime boundaries.

### R003 — The optimizer must run as pure TypeScript in the browser using First Fit Decreasing bin packing over 1D lumber stock.
- Class: core-capability
- Status: active
- Description: The optimizer must run as pure TypeScript in the browser using First Fit Decreasing bin packing over 1D lumber stock.
- Why it matters: This demonstrates the central architecture argument: deterministic computation belongs in code, not in the LLM.
- Source: user
- Primary owning slice: M001/S02
- Supporting slices: M001/S01 M001/S04
- Validation: mapped
- Notes: All internal lengths use inches; feet are display-only.

### R004 — The app must render an optimized cut sheet with board-by-board stock usage, cuts placed on each board, and leftover length.
- Class: core-capability
- Status: active
- Description: The app must render an optimized cut sheet with board-by-board stock usage, cuts placed on each board, and leftover length.
- Why it matters: This is the estimator-facing output that makes the demo recognizable as construction/materials software.
- Source: user
- Primary owning slice: M001/S04
- Supporting slices: M001/S01 M001/S02
- Validation: mapped
- Notes: The layout must be understandable in a 2–3 minute Loom.

### R005 — The app must display illustrative total material cost and waste percentage for the optimized result.
- Class: core-capability
- Status: active
- Description: The app must display illustrative total material cost and waste percentage for the optimized result.
- Why it matters: Cost and waste are the practical estimator values that make the output useful rather than just algorithmic.
- Source: user
- Primary owning slice: M001/S04
- Supporting slices: M001/S02
- Validation: mapped
- Notes: UI must state prices are illustrative and a real product would use supplier pricing.

### R006 — The app must surface assumptions and things to double-check rather than hiding uncertain interpretation.
- Class: failure-visibility
- Status: active
- Description: The app must surface assumptions and things to double-check rather than hiding uncertain interpretation.
- Why it matters: Construction estimating needs auditability and sanity checks; the demo should show where the agent made assumptions.
- Source: user research
- Primary owning slice: M001/S04
- Supporting slices: M001/S03
- Validation: mapped
- Notes: Extraction assumptions and summary double-check list should both be visible.

### R007 — The UI must feel credible to someone familiar with construction software: muted, confident, utilitarian, readable, and professional.
- Class: differentiator
- Status: active
- Description: The UI must feel credible to someone familiar with construction software: muted, confident, utilitarian, readable, and professional.
- Why it matters: The hiring audience will judge product-surface understanding quickly from the Loom.
- Source: user
- Primary owning slice: M001/S05
- Supporting slices: M001/S04
- Validation: mapped
- Notes: Think Linear-like restraint, not playful or marketing-heavy visuals.

### R008 — The README must explain the architecture decision: Claude for ambiguous extraction and summary, deterministic TypeScript for optimization.
- Class: launchability
- Status: active
- Description: The README must explain the architecture decision: Claude for ambiguous extraction and summary, deterministic TypeScript for optimization.
- Why it matters: The demo is partly an architecture argument about the right division of labor in agent systems.
- Source: user
- Primary owning slice: M001/S05
- Validation: mapped
- Notes: Written for an interviewer who may ask why the app is built this way.

### R009 — The app must run locally and deploy to a real Vercel production URL using `ANTHROPIC_API_KEY`.
- Class: launchability
- Status: active
- Description: The app must run locally and deploy to a real Vercel production URL using `ANTHROPIC_API_KEY`.
- Why it matters: The Loom needs a real working URL, not just local compatibility.
- Source: user
- Primary owning slice: M001/S05
- Validation: mapped
- Notes: The deployed URL must be verified with the sample input.

### R010 — The optimizer must explicitly return cuts that cannot fit in available stock as `unplaced_cuts` instead of crashing or silently dropping them.
- Class: failure-visibility
- Status: active
- Description: The optimizer must explicitly return cuts that cannot fit in available stock as `unplaced_cuts` instead of crashing or silently dropping them.
- Why it matters: Graceful edge-case handling is more credible than pretending the optimizer always succeeds.
- Source: user
- Primary owning slice: M001/S02
- Supporting slices: M001/S04
- Validation: mapped
- Notes: The UI must surface unplaced cuts as needing manual review.

### R011 — The deterministic optimizer must have Vitest unit coverage for core packing behavior, multiple materials, inches-only internals, cost/waste math, and unplaced cuts.
- Class: quality-attribute
- Status: active
- Description: The deterministic optimizer must have Vitest unit coverage for core packing behavior, multiple materials, inches-only internals, cost/waste math, and unplaced cuts.
- Why it matters: The optimizer is the deterministic core and should be provable independently of the LLM.
- Source: user
- Primary owning slice: M001/S02
- Validation: mapped
- Notes: Use Vitest rather than Jest to avoid unnecessary Next.js and TypeScript configuration friction.

## Validated

## Deferred

### R012 — Real supplier pricing integration should not be built for this demo.
- Class: integration
- Status: deferred
- Description: Real supplier pricing integration should not be built for this demo.
- Why it matters: It is valuable production scope, but would distract from proving the LLM/deterministic pipeline tonight.
- Source: user
- Primary owning slice: none
- Supporting slices: none
- Validation: unmapped
- Notes: Deferred because illustrative hardcoded pricing is enough for the Loom; a real product would hit supplier APIs.

### R013 — Saved projects, estimate history, and audit trail should not be built for this demo.
- Class: continuity
- Status: deferred
- Description: Saved projects, estimate history, and audit trail should not be built for this demo.
- Why it matters: History is useful in production estimating software, but not needed for the one-shot internship demo.
- Source: user research
- Primary owning slice: none
- Supporting slices: none
- Validation: unmapped
- Notes: Deferred; research suggests audit trail matters in estimating software, but this demo is stateless by design.

## Out of Scope

### R014 — PDF or image plan upload is explicitly out of scope; input is text only.
- Class: anti-feature
- Status: out-of-scope
- Description: PDF or image plan upload is explicitly out of scope; input is text only.
- Why it matters: The demo focuses on natural-language scope to CutSheet, not plan ingestion.
- Source: user
- Primary owning slice: none
- Supporting slices: none
- Validation: n/a
- Notes: Prevents scope creep into OCR, plan parsing, and file handling.

### R015 — User accounts, authentication, projects, and saving are explicitly out of scope.
- Class: anti-feature
- Status: out-of-scope
- Description: User accounts, authentication, projects, and saving are explicitly out of scope.
- Why it matters: Auth and persistence add product complexity that does not help the hiring demo.
- Source: user
- Primary owning slice: none
- Supporting slices: none
- Validation: n/a
- Notes: The app remains stateless.

### R016 — 2D sheet-goods optimization is explicitly out of scope; this demo handles 1D linear lumber only.
- Class: anti-feature
- Status: out-of-scope
- Description: 2D sheet-goods optimization is explicitly out of scope; this demo handles 1D linear lumber only.
- Why it matters: 1D lumber cutting is the correct narrow optimization problem for this demo.
- Source: user research
- Primary owning slice: none
- Supporting slices: none
- Validation: n/a
- Notes: No plywood/sheet layout optimization.

### R017 — A marketing landing page, theme system, dark/light toggle, and fancy animations are explicitly out of scope.
- Class: anti-feature
- Status: out-of-scope
- Description: A marketing landing page, theme system, dark/light toggle, and fancy animations are explicitly out of scope.
- Why it matters: The demo should feel like credible construction software, not a generic SaaS landing page.
- Source: user
- Primary owning slice: none
- Supporting slices: none
- Validation: n/a
- Notes: Use restrained staged UI only.

## Traceability

| ID | Class | Status | Primary owner | Supporting | Proof |
|---|---|---|---|---|---|
| R001 | core-capability | active | M001/S03 | none | mapped |
| R002 | primary-user-loop | active | M001/S04 | M001/S03 | mapped |
| R003 | core-capability | active | M001/S02 | M001/S01 M001/S04 | mapped |
| R004 | core-capability | active | M001/S04 | M001/S01 M001/S02 | mapped |
| R005 | core-capability | active | M001/S04 | M001/S02 | mapped |
| R006 | failure-visibility | active | M001/S04 | M001/S03 | mapped |
| R007 | differentiator | active | M001/S05 | M001/S04 | mapped |
| R008 | launchability | active | M001/S05 | none | mapped |
| R009 | launchability | active | M001/S05 | none | mapped |
| R010 | failure-visibility | active | M001/S02 | M001/S04 | mapped |
| R011 | quality-attribute | active | M001/S02 | none | mapped |
| R012 | integration | deferred | none | none | unmapped |
| R013 | continuity | deferred | none | none | unmapped |
| R014 | anti-feature | out-of-scope | none | none | n/a |
| R015 | anti-feature | out-of-scope | none | none | n/a |
| R016 | anti-feature | out-of-scope | none | none | n/a |
| R017 | anti-feature | out-of-scope | none | none | n/a |

## Coverage Summary

- Active requirements: 11
- Mapped to slices: 11
- Validated: 0
- Unmapped active requirements: 0
