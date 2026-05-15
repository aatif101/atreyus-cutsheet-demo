---
id: S01
parent: M001
milestone: M001
provides:
  - Working Next.js/Vitest project skeleton.
  - Shared CutSheet domain types and stock catalog module shape.
  - Browser-callable optimizer interface used by the mocked UI.
  - Mock staged page that downstream slices can replace with real API calls.
requires:
  []
affects:
  - S02
  - S03
  - S04
  - S05
key_files:
  - package.json
  - package-lock.json
  - next.config.ts
  - tsconfig.json
  - eslint.config.mjs
  - postcss.config.mjs
  - src/app/layout.tsx
  - src/app/page.tsx
  - src/app/globals.css
  - src/lib/cutsheet/types.ts
  - src/lib/cutsheet/stock.ts
  - src/lib/cutsheet/optimizer.ts
  - src/lib/cutsheet/optimizer.test.ts
  - src/lib/cutsheet/format.ts
  - src/lib/cutsheet/format.test.ts
  - src/lib/cutsheet/mock.ts
key_decisions:
  - Use a generated Next 16 App Router project shell with Vitest for the CutSheet demo base.
  - Keep optimizer logic framework-free and browser-callable under `src/lib/cutsheet`.
  - Represent unsupported or oversize cuts as returned `unplacedCuts` diagnostics rather than exceptions.
  - Keep mock extraction and mock estimator summary data isolated in `src/lib/cutsheet/mock.ts`.
patterns_established:
  - Typed CutSheet domain modules live under `src/lib/cutsheet` and are shared by UI and future API slices.
  - Optimizer contracts use inches internally; formatting for feet/inches, currency, and percentages stays at the UI/helper layer.
  - The staged UI mirrors the future real pipeline: extraction result first, deterministic browser optimization second, estimator summary last.
observability_surfaces:
  - Package scripts: `npm run test -- --run`, `npm run lint`, and `npm run build`.
  - Browser-visible validation for empty input and unplaced-cut diagnostics.
  - Next build output, Vitest output, and local page/source-contract checks.
drill_down_paths:
  - .gsd/milestones/M001/slices/S01/tasks/T01-SUMMARY.md
  - .gsd/milestones/M001/slices/S01/tasks/T02-SUMMARY.md
  - .gsd/milestones/M001/slices/S01/tasks/T03-SUMMARY.md
  - .gsd/milestones/M001/slices/S01/tasks/T04-SUMMARY.md
duration: ""
verification_result: passed
completed_at: 2026-05-15T07:23:08.128Z
blocker_discovered: false
---

# S01: Thin mocked CutSheet flow with real optimizer

**Shipped a Next.js CutSheet demo shell where sample deck scope flows through mocked extraction, a real browser-callable TypeScript lumber optimizer, and mocked estimator summary output.**

## What Happened

S01 created the greenfield TypeScript Next.js App Router project shell with npm scripts, Tailwind styling, ESLint, Vitest, and production build support. It then added shared CutSheet domain contracts, a stock catalog, and a framework-free optimizer that expands required cuts, uses inch-based stock lengths and pricing, packs cuts deterministically into stock boards, computes cost and waste totals, and returns unplaced-cut diagnostics instead of crashing. The UI was wired as a vertical staged flow: the default sample deck scope can be generated into mock extraction data, the real optimizer runs over the extracted cuts in the browser component, and the page renders board-by-board layouts, stock purchase groups, totals, assumptions, unplaced-cut review states, and mocked estimator double-check guidance. A final regression covered the sample mock deck optimization path so the browser-flow totals are guarded by Vitest rather than only source inspection.

## Verification

Fresh closeout verification ran through gsd_exec runtime=node in this Windows-backed worktree. `npm run test -- --run` passed, `npm run lint` passed, and `npm run build` passed. The same closeout run verified the page contract from source: Generate Cut Sheet is present, Stage 01 mock extraction, Stage 02 browser optimization, and Stage 03 mock summary are rendered, `src/app/page.tsx` imports and invokes `optimizeCuts(extraction.cuts)`, board layouts and totals are rendered from `stageState.optimizer`, unplaced cuts have a visible review path, and mock sample deck fixtures are present. Prior task verification also covered local dev-page HTTP checks against the running Next server; direct browser click tooling was unavailable in the task harness, so interactive UAT is documented for a human or later browser-enabled run.

## Requirements Advanced

- R003 — Added the pure TypeScript browser-callable optimizer and wired it into the UI flow, establishing the deterministic computation path that S02 will harden.
- R004 — Rendered board-by-board stock usage, placed cuts, leftover length, cost, waste, and diagnostics in the mocked UI, establishing the estimator-facing output shape for S04.

## Requirements Validated

None.

## New Requirements Surfaced

- None.

## Requirements Invalidated or Re-scoped

None.

## Operational Readiness

None.

## Deviations

Direct interactive browser click verification was not available in the task harness. The slice used Vitest regression coverage, Next build/lint verification, local HTTP/source-contract checks, and documented human/browser UAT steps instead. `gsd_exec` bash was unreliable in the Windows-backed environment, so closeout verification used `gsd_exec` with the Node runtime spawning npm scripts.

## Known Limitations

Extraction and estimator summary are intentionally mocked for S01. Claude-backed extraction, Claude-backed summary, production deployment, and polished final demo styling remain deferred to later slices. The optimizer exists and is tested enough for S01, but broader hardening belongs to S02.

## Follow-ups

S02 should expand optimizer tests for multi-material packing, inches-only internals, cost and waste math, and unplaced cuts. S03 should consume the shared extraction/result types for the Claude extraction endpoint. S04 should replace the mocked staged UI calls with the real extraction → browser optimization → summary sequence.

## Files Created/Modified

- `package.json` — Defines the Next/Vitest project scripts and dependencies.
- `package-lock.json` — Locks the generated project dependency tree.
- `next.config.ts` — Next.js configuration for the App Router project.
- `tsconfig.json` — TypeScript configuration and path aliases.
- `eslint.config.mjs` — ESLint configuration for the Next project.
- `postcss.config.mjs` — PostCSS/Tailwind processing configuration.
- `src/app/layout.tsx` — App shell metadata and layout.
- `src/app/page.tsx` — Client-side staged CutSheet page wired to mock extraction, real optimizer, and mock summary output.
- `src/app/globals.css` — Global styling for the demo page.
- `src/lib/cutsheet/types.ts` — Shared CutSheet domain types for cuts, stock boards, optimizer results, and diagnostics.
- `src/lib/cutsheet/stock.ts` — Stock lumber catalog used by the optimizer.
- `src/lib/cutsheet/optimizer.ts` — Framework-free deterministic lumber optimizer.
- `src/lib/cutsheet/optimizer.test.ts` — Vitest coverage for optimizer behavior and sample mock-deck output.
- `src/lib/cutsheet/mock.ts` — Sample deck scope, mocked extraction result, assumptions, and summary fixture data.
- `src/lib/cutsheet/format.ts` — UI formatting helpers for currency, percentages, and feet/inches labels.
- `src/lib/cutsheet/format.test.ts` — Vitest coverage for formatting helpers.
