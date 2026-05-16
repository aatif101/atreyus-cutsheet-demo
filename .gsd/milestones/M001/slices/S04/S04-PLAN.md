# S04: Claude summary endpoint and real staged UI

**Goal:** Replace the mocked downstream half of the CutSheet prototype with a real Claude-backed summary endpoint and wire the app into an observable staged flow: extract via /api/extract, optimize deterministically in the browser, then summarize via /api/summarize.
**Demo:** The UI performs the real sequence: extraction call, instant browser optimization, summary call, then displays cut sheet tables, board layouts, waste, cost, assumptions, and unplaced cuts.

## Must-Haves

- Owned/supporting requirements: R002 is owned by this slice; R006 is supported by surfacing extraction assumptions/warnings and summary double-checks; R003, R004, R005, and R010 must be re-verified because the UI still depends on browser optimization output.
- Must-haves:
- POST /api/summarize accepts the validated extraction plus browser optimization result, calls Claude server-side only, validates the returned EstimatorSummary, and maps invalid input/setup/upstream/malformed-output failures to stable sanitized errors.
- The main page no longer uses mocked extraction or mocked summary after Run; it visibly progresses through extraction, browser optimization, and summary phases with loading/success/error states and keeps assumptions, warnings, unplaced cuts, cost, waste, board layouts, and double-checks visible.
- The UI exposes failure state for each phase without leaking secrets, provider stack traces, or raw model responses.
- Threat Surface (Q3):
- Abuse: untrusted scope text and endpoint payloads can be oversized, malformed, replayed, or crafted to try to make Claude emit invalid JSON; cap request sizes and validate all API inputs before provider calls.
- Data exposure: ANTHROPIC_API_KEY and provider internals must remain server-only; browser responses must be sanitized and must not include raw Claude responses or stack traces.
- Input trust: user text reaches server API and Claude, not filesystem or DB; optimizer receives API-derived cuts and must continue returning unplaced diagnostics rather than throwing for malformed/unsupported cuts.
- Requirement Impact (Q4):
- Requirements touched: R002, R006, R003, R004, R005, R010.
- Re-verify: summary API contract tests, staged flow helper tests, lint, production build, and optimizer unit suite.
- Decisions revisited: none; D001, D002, D005, D007, and D008 remain locked-in guidance.
- Verification:
- `npm run test`
- `npm run lint`
- `npm run build`
- Negative Tests (Q7):
- Summary schema rejects missing arrays, wrong severities, non-numeric costs, empty strings, extra feet-style optimization shortcuts if introduced, and malformed double-check entries.
- Summary handler rejects invalid JSON, missing extraction/optimization payloads, oversized or malformed payloads, missing setup, upstream failures, malformed Claude JSON, and unexpected thrown errors with stable sanitized error shapes.
- Staged flow tests cover extraction failure halting before optimization/summary, summary failure preserving extraction/optimization output for inspection, and a successful extract -> optimize -> summarize order.

## Proof Level

- This slice proves: integration: real Next API boundaries and the real browser entrypoint are wired; tests use dependency injection rather than a live Anthropic key, and production build proves the client/server module boundary.

## Integration Closure

Upstream surfaces consumed: `src/app/api/extract/route.ts`, `src/lib/cutsheet/extract-handler.ts`, `src/lib/cutsheet/extraction-schema.ts`, `src/lib/cutsheet/types.ts`, `src/lib/cutsheet/optimizer.ts`, `src/lib/cutsheet/format.ts`, and `src/lib/cutsheet/stock.ts`.

New wiring introduced: `src/app/api/summarize/route.ts` plus summary handler/schema/Claude adapter modules, and `src/app/page.tsx` calling `/api/extract`, running `optimizeCuts` client-side, then calling `/api/summarize`.

What remains before milestone usable end-to-end: S05 deployment polish, Vercel environment verification, and production URL UAT.

## Verification

- Runtime signals: UI phase state (`idle`, `extracting`, `optimizing`, `summarizing`, `complete`, `error`) and sanitized API error codes for extract and summarize phases.
- Inspection surfaces: browser UI status panel, network responses from `/api/extract` and `/api/summarize`, Vitest handler tests, and production build output.
- Failure visibility: the UI should display the failed phase, stable error code/message, and preserve any completed upstream stage data for diagnosis.
- Redaction constraints: never expose `ANTHROPIC_API_KEY`, raw provider responses, stack traces, or validator internals to the browser.

## Tasks

- [ ] **T01: Define and test the summary validation boundary** `est:45m`
  Expected executor skills: tdd, api-design.
  - Files: `src/lib/cutsheet/summary-schema.ts`, `src/lib/cutsheet/summary-schema.test.ts`, `src/lib/cutsheet/types.ts`
  - Verify: npm run test -- src/lib/cutsheet/summary-schema.test.ts

- [ ] **T02: Implement the Claude summary API endpoint with sanitized failures** `est:1h 15m`
  Expected executor skills: api-design, tdd, observability.
  - Files: `src/lib/cutsheet/summarize-handler.ts`, `src/lib/cutsheet/summarize-handler.test.ts`, `src/lib/cutsheet/claude-summarize.ts`, `src/app/api/summarize/route.ts`, `README.md`
  - Verify: npm run test -- src/lib/cutsheet/summarize-handler.test.ts

- [ ] **T03: Wire the page into a real extract optimize summarize staged flow** `est:1h 30m`
  Expected executor skills: react-best-practices, tdd, verify-before-complete.
  - Files: `src/app/page.tsx`, `src/lib/cutsheet/staged-flow.ts`, `src/lib/cutsheet/staged-flow.test.ts`, `src/lib/cutsheet/mock.ts`
  - Verify: npm run build

- [ ] **T04: Re-verify the integrated CutSheet demo contract** `est:30m`
  Expected executor skills: verify-before-complete, test.
  - Files: `README.md`, `src/app/page.tsx`, `src/lib/cutsheet/summary-schema.ts`, `src/lib/cutsheet/summarize-handler.ts`, `src/lib/cutsheet/staged-flow.ts`
  - Verify: npm run test

## Files Likely Touched

- src/lib/cutsheet/summary-schema.ts
- src/lib/cutsheet/summary-schema.test.ts
- src/lib/cutsheet/types.ts
- src/lib/cutsheet/summarize-handler.ts
- src/lib/cutsheet/summarize-handler.test.ts
- src/lib/cutsheet/claude-summarize.ts
- src/app/api/summarize/route.ts
- README.md
- src/app/page.tsx
- src/lib/cutsheet/staged-flow.ts
- src/lib/cutsheet/staged-flow.test.ts
- src/lib/cutsheet/mock.ts
