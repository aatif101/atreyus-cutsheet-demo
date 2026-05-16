---
estimated_steps: 7
estimated_files: 4
skills_used: []
---

# T03: Wire the page into a real extract optimize summarize staged flow

Expected executor skills: react-best-practices, tdd, verify-before-complete.

Why: R002 is only satisfied when the visible app performs real ordered work instead of rendering mocked stages: extraction API first, browser `optimizeCuts` second, summary API third.

Do: Refactor `src/app/page.tsx` so Run validates non-empty scope text, calls `POST /api/extract`, stores and renders returned extraction assumptions/warnings/cuts, then immediately runs `optimizeCuts(extraction.cuts)` in the browser, then calls `POST /api/summarize` with the extraction and optimization result. Replace `MOCK_EXTRACTION_RESULT` and `MOCK_ESTIMATOR_SUMMARY` usage in the run path; keep only `SAMPLE_DECK_SCOPE` as sample input text if useful. Add explicit phase/status state, loading/success indicators for all three stages, and a visible error panel that includes the failed phase plus stable API error code/message when available. Preserve completed upstream data on downstream failure so a future agent can inspect what succeeded. If the orchestration logic becomes non-trivial, put pure state transition helpers in `src/lib/cutsheet/staged-flow.ts` and test them in `src/lib/cutsheet/staged-flow.test.ts`; otherwise create equivalent tests for any pure client helper added. Do not move optimization server-side and do not import server-only Claude modules into the client.

Failure Modes (Q5): extraction failure halts before optimization and summary; optimization exceptions or unplaced diagnostics are surfaced in the optimization stage; summary failure leaves extraction and optimization visible with the summary phase marked failed.
Load Profile (Q6): the browser performs one optimization over the extracted cut list and the client makes exactly two sequential API requests per run; at 10x user load the external bottleneck is Anthropic API latency/rate limits, not local optimizer CPU for the current small payload.
Negative Tests (Q7): empty input blocked locally, extraction API error path, malformed API success payload handling if helper exists, summary API error path, and successful phase order.

Done when: the Loom-visible page shows extraction -> browser optimization -> summary as real state transitions, all displayed cut sheet/cost/waste/unplaced/double-check panels are populated from real stage outputs, and failure states are visible and redacted.

## Inputs

- `src/app/page.tsx`
- `src/lib/cutsheet/mock.ts`
- `src/lib/cutsheet/optimizer.ts`
- `src/lib/cutsheet/format.ts`
- `src/lib/cutsheet/types.ts`
- `src/lib/cutsheet/summarize-handler.ts`
- `src/app/api/extract/route.ts`
- `src/app/api/summarize/route.ts`

## Expected Output

- `src/app/page.tsx`
- `src/lib/cutsheet/staged-flow.ts`
- `src/lib/cutsheet/staged-flow.test.ts`

## Verification

npm run build

## Observability Impact

Adds UI phase/state diagnostics: current phase, completed stages, failed phase, sanitized error code/message, and preservation of upstream outputs after downstream failures for browser-based debugging.
