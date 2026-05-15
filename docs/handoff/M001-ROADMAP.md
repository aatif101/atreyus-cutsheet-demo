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
  > After this: A basic page accepts the sample deck scope, uses mock extraction and summary data, runs the real optimizer in the browser, and renders all three stages end to end.

- [ ] **S02: S02** `risk:high` `depends:[]`
  > After this: The optimizer is covered by Vitest for multi-material packing, inches-only internals, waste and cost math, and unplaced cuts.

- [ ] **S03: Claude extraction endpoint** `risk:high` `depends:[S01]`
  > After this: `POST /api/extract` converts the sample construction scope into validated structured cuts and assumptions using Claude structured output.

- [ ] **S04: Claude summary endpoint and real staged UI** `risk:medium` `depends:[S02,S03]`
  > After this: The UI performs the real sequence: extraction call, instant browser optimization, summary call, then displays tables, board layouts, waste, cost, assumptions, and any unplaced cuts.

- [ ] **S05: Demo polish, README, and Vercel deployment** `risk:medium` `depends:[S04]`
  > After this: The app looks credible for a construction-software Loom, the README explains the architecture, and the production Vercel URL is verified with the sample input.

## Boundary Map

### S01 → S02

Produces:
- Working Next.js/Vitest project skeleton.
- Shared domain types and stock catalog module shape.
- Browser-callable optimizer interface used by the mocked UI.

Consumes:
- nothing (first slice)

### S01,S02 → S03

Produces:
- `RequiredCut`, `ExtractionResult`, stock catalog, optimizer result types, and tested optimizer expectations.

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
