# M001: Atreyus CutSheet Demo

**Gathered:** 2026-05-15
**Status:** Ready for planning

## Project Description

Build a focused Next.js demo for an internship application to Atreyus AI, a startup building an AI platform for construction and building materials. The demo should prove understanding of their product surface, especially the idea behind a CutSheet-style workflow.

An estimator pastes a natural-language project scope such as "Build a 10×12 pressure-treated deck with 16-inch joist spacing, 4×4 posts, single level." The app extracts material cuts, optimizes those cuts against standard lumber stock, and summarizes the resulting cut sheet with illustrative cost, waste percentage, and assumptions to double-check.

This is not a production app. It is a credible 2–3 minute Loom demo for a hiring team that understands construction software.

## Why This Milestone

This milestone proves the core product surface and the architecture argument in one deployable demo. The hard problem is not just calling an LLM; it is showing the right division of labor between LLM reasoning and deterministic code. Claude handles ambiguous natural-language extraction and human-readable summary. TypeScript handles exact 1D lumber cut optimization.

## User-Visible Outcome

### When this milestone is complete, the user can:

- Open a deployed Vercel URL and paste a natural-language deck scope.
- Click "Generate Cut Sheet" and watch a real staged pipeline: extraction, instant browser optimization, then summary.
- Review extracted cuts, board-by-board stock usage, leftovers, waste percentage, illustrative total cost, assumptions, and things to double-check.

### Entry point / environment

- Entry point: Web page at the Vercel production URL, plus local `npm run dev`.
- Environment: Browser frontend with Next.js App Router API routes on Vercel.
- Live dependencies involved: Anthropic Claude API via `ANTHROPIC_API_KEY`; no database, auth, or persistence.

## Completion Class

- Contract complete means: TypeScript types, Vitest optimizer tests, API route contracts, and README setup/architecture explanation are present and verified.
- Integration complete means: The deployed web app exercises `POST /api/extract`, browser optimization, and `POST /api/summarize` in sequence against the sample input.
- Operational complete means: Local dev runs, production Vercel deployment succeeds, `ANTHROPIC_API_KEY` is configured, and the production URL is verified.

## Final Integrated Acceptance

To call this milestone complete, we must prove:

- The sample input "Build a 10×12 pressure-treated deck with 16-inch joist spacing, 4×4 posts, single level" produces a visible CutSheet-style result locally and on Vercel.
- The stages are genuinely sequential: extraction endpoint returns before browser optimization, and summary endpoint runs after optimization.
- The optimizer reports cost, waste, board layouts, and `unplaced_cuts` without using the LLM.
- A hiring-team viewer can understand the architecture decision from the UI labels and README.

## Architectural Decisions

### Split LLM work into extraction and summary endpoints

**Decision:** Use `POST /api/extract` for Claude structured extraction and `POST /api/summarize` for Claude summary.

**Rationale:** Extraction and summary need the API key and benefit from language reasoning. Splitting them creates a real staged pipeline rather than a fake reveal after one combined response.

**Alternatives Considered:**
- One combined `/api/cut-sheet` endpoint — rejected because it makes staged UI theatrical and weakens the architecture story.
- Client-side Claude calls — rejected because the API key must remain server-side.

### Run optimization in the browser

**Decision:** The First Fit Decreasing lumber optimizer runs as pure TypeScript in the browser.

**Rationale:** Optimization is deterministic, instant, and does not need secrets. Running it client-side reinforces the pitch: LLMs handle ambiguity; code handles exact computation.

**Alternatives Considered:**
- Server-side optimization — workable but less sharp; unnecessary latency and weaker topology story.
- LLM optimization — rejected because bin packing is the wrong job for an LLM and would be less reliable.

### Build a mocked vertical slice before real integrations

**Decision:** Start with a thin ugly end-to-end flow using mock LLM responses, real optimizer, and basic UI before wiring Claude.

**Rationale:** This is a one-night demo. A vertical slice keeps the app demoable even if later API integration takes longer.

**Alternatives Considered:**
- Bottom-up implementation — rejected because nothing visible appears until late in the build.

### Use Vitest for optimizer tests

**Decision:** Use Vitest rather than Jest.

**Rationale:** Vitest has lower setup friction with TypeScript and avoids the common Jest + Next.js configuration rabbit hole.

**Alternatives Considered:**
- Jest — rejected for unnecessary setup risk in a time-boxed demo.

## Error Handling Strategy

Keep failure handling intentionally light and demo-appropriate:

- Missing `ANTHROPIC_API_KEY` returns a clear setup error from the server endpoint.
- Claude extraction failure shows a simple UI error and preserves the user's input.
- Invalid or unsupported extraction returns readable validation feedback.
- Cuts longer than max available stock are returned as `unplaced_cuts`, not thrown away or treated as fatal.
- The UI surfaces unplaced cuts as needing manual review.
- Summary failure does not erase extraction or optimization results; the user can still see the cut sheet and optimization output.
- No complex retries, queues, persistence, or circuit breakers.

## Risks and Unknowns

- Claude extraction quality — if the schema or prompt is vague, the optimizer will receive unusable cuts.
- Real staged UX — if the app uses one backend response or fake timing, the Loom may look theatrical.
- Cut-length unit bugs — lumber stock is sold in feet while joist spacing and cuts are usually inches; internal code must normalize to inches.
- Deployment secrets — Vercel must receive `ANTHROPIC_API_KEY` before production verification.
- Time-box pressure — a mocked vertical slice should land early so the demo remains salvageable.

## Existing Codebase / Prior Art

- Repository is greenfield except `.gitignore` and GSD scaffolding.
- No existing Next.js app, tests, CI, or deployment configuration exists.
- Research reinforced that cut lists should itemize material pieces, 1D linear stock optimization is distinct from 2D sheet optimization, and construction estimating workflows benefit from double-check/audit surfaces.

## Relevant Requirements

- R001 — Natural-language scope extraction through Claude structured output.
- R002 — Real staged agent pipeline.
- R003 — Deterministic browser-side lumber optimization.
- R004 — Optimized cut sheet output.
- R005 — Cost and waste visibility.
- R006 — Assumptions and double-check list.
- R007 — Credible construction-software UI.
- R008 — Architecture explanation for interviewer.
- R009 — Local and production deployability.
- R010 — Optimizer edge-case handling.
- R011 — Optimizer unit test coverage.

## Scope

### In Scope

- Next.js App Router + TypeScript + Tailwind single-page app.
- Anthropic TypeScript SDK using `claude-sonnet-4-6`.
- `POST /api/extract` and `POST /api/summarize`.
- Browser-side First Fit Decreasing optimizer.
- Hardcoded pressure-treated lumber catalog with illustrative prices:
  - 2×4: 8′ $7, 10′ $9, 12′ $11, 16′ $15
  - 2×6: 8′ $10, 10′ $13, 12′ $16, 16′ $22
  - 2×8: 8′ $14, 10′ $18, 12′ $22, 16′ $30
  - 4×4: 8′ $14, 10′ $18, 12′ $22
- Hardcoded example chip text: "Build a 10×12 pressure-treated deck with 16-inch joist spacing, 4×4 posts, single level".
- Vitest unit tests for optimizer.
- README with setup and architecture explanation.
- Vercel production deployment and verification.

### Out of Scope / Non-Goals

- PDF or image upload.
- User accounts, projects, saving, database, or persistence.
- Real supplier pricing API.
- 2D cut optimization for sheet goods.
- Marketing landing page.
- Dark/light toggle.
- Fancy animations or playful UI.
- Overbuilt error handling.

## Technical Constraints

- Normalize all lengths to inches throughout the codebase; convert to feet/inches for display only.
- Do not use the LLM for deterministic optimization.
- Do not fake staged reveal after a combined server response.
- Keep API keys server-side only.
- Keep the UI readable in a short Loom.
- Use illustrative pricing copy in the UI.

## Integration Points

- Anthropic Claude API — extraction and summary only.
- Vercel — production hosting and environment variable management.
- Browser runtime — deterministic optimizer execution.
- Vitest — optimizer verification.

## Testing Requirements

- Vitest unit tests for optimizer happy path, multi-material grouping, First Fit Decreasing behavior, cost/waste math, inches-only internal units, and `unplaced_cuts`.
- Build verification with `npm run build`.
- Local browser verification with `npm run dev` and the sample input.
- Production browser verification on the Vercel URL with the sample input.

## Acceptance Criteria

- The app accepts the sample scope and renders all three stages.
- Stage 1 shows extracted material cuts and assumptions.
- Stage 2 shows board-by-board optimized layout, leftovers, waste percentage, total cost, and unplaced cuts if present.
- Stage 3 shows a 2–3 paragraph estimator-facing summary and a double-check list.
- The README explains why extraction and summary use Claude while optimization is deterministic TypeScript.
- The deployed Vercel URL works with `ANTHROPIC_API_KEY` configured.

## Open Questions

- Exact deployment/auth state for Vercel CLI — current thinking: use Vercel CLI if already authenticated; if not, collect necessary environment/deployment confirmation without exposing secrets.
