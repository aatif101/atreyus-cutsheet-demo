# M001: Atreyus CutSheet Demo

**Vision:** Build and deploy a credible Atreyus CutSheet demo that proves natural-language construction scope extraction, deterministic 1D lumber optimization, and estimator-facing summary using the right division of labor between Claude and TypeScript.

## Success Criteria

- Estimator can paste the sample natural-language deck scope and receive a CutSheet-style output.
- The pipeline visibly and genuinely executes extraction, browser optimization, and summary in order.
- The deterministic optimizer is tested and handles unplaced cuts without crashing.
- The UI displays cost, waste, stock board layout, assumptions, and double-check guidance.
- The README makes the LLM-versus-deterministic architecture defensible to an interviewer.
- The app is verified on a production Vercel URL.

## Slices

- [x] **S01: S01** `risk:high` `depends:[]`
  > After this: A fresh Next.js app accepts the sample deck scope, uses mock extraction and mock summary data, runs the real browser optimizer, and renders all three stages end to end.

- [x] **S02: S02** `risk:high` `depends:[]`
  > After this: The optimizer is covered by focused Vitest cases for First Fit Decreasing behavior, multi-material separation, inches-only internals, cost/waste math, quantity handling, and unplaced cuts.

- [x] **S03: S03** `risk:high` `depends:[]`
  > After this: `POST /api/extract` converts the sample construction scope into validated structured cuts and assumptions using Claude, with clear setup/error behavior.

- [x] **S04: S04** `risk:medium` `depends:[]`
  > After this: The UI performs the real sequence: extraction call, instant browser optimization, summary call, then displays cut sheet tables, board layouts, waste, cost, assumptions, and unplaced cuts.

- [x] **S05: Demo polish, README, and Vercel deployment** `risk:medium` `depends:[S04]` `completed:2026-05-16`
  > After this: The app feels like a credible construction-software demo, the README explains the architecture, and the production Vercel URL is verified with the sample input.
  > Note: Local verification complete (96 tests, lint clean, production build). Vercel deployment deferred — browser auth required; handoff steps in README.

## Boundary Map

### S01 → S02

Produces:
- Working Next.js/Vitest project skeleton.
- Shared CutSheet domain types and stock catalog module shape.
- Browser-callable optimizer interface used by the mocked UI.
- Mock staged page that downstream slices can replace with real API calls.

Consumes:
- nothing (first slice)

### S01 → S03

Produces:
- `RequiredCut`, `ExtractionResult`, stock catalog, optimizer result types, and sample deck fixtures.

Consumes:
- S03 consumes shared extraction/result types when validating Claude output.

### S02,S03 → S04

Produces:
- Tested optimizer behavior including `unplaced_cuts`.
- Real `POST /api/extract` contract and response shape.

Consumes:
- S04 consumes extraction endpoint output and optimizer output before calling summary.

### S04 → S05

Produces:
- Full user-visible CutSheet flow and UI surfaces.

Consumes:
- S05 consumes the working app for polish, README explanation, build verification, deployment, and production UAT.
