---
id: S05
parent: M001
milestone: M001
provides:
  - Demo-ready estimator UI aligned to the 10x12 acceptance sample phrase.
  - Interviewer-readable README with architecture explanation and deployment steps.
  - ESLint 9 flat config enabling lint gate.
  - 96 passing tests including 7 new mock contract tests pinning the demo contract.
  - Explicit Vercel deployment handoff documented in README (browser auth required to complete).
requires:
  - slice: S04
    provides: Full staged UI, /api/extract, /api/summarize, staged-flow orchestration, and README architecture narrative.
key_files:
  - src/lib/cutsheet/mock.ts
  - src/lib/cutsheet/mock.test.ts
  - src/lib/cutsheet/optimizer.test.ts
  - src/app/page.tsx
  - src/app/layout.tsx
  - README.md
  - .gitignore
  - eslint.config.mjs
key_decisions:
  - SAMPLE_DECK_SCOPE updated to the exact M001 acceptance phrase; mock fixtures aligned to single-level 10x12 scenario (no stair).
  - ESLint config created from scratch using eslint-config-next flat config (was missing entirely).
  - Vercel deployment deferred to manual handoff — no Vercel credentials available in execution context; README records exact steps.
verification_result: partial
blocker_discovered: true
blocker: Vercel auth unavailable in execution context — production UAT deferred to manual deployment handoff. All local verification (test/lint/build) passed.
completed_at: 2026-05-16T02:08:00.000Z
---

# S05: Demo polish, README, and Vercel deployment

**Polished the CutSheet demo for the Loom recording, aligned all artifacts to the accepted 10×12 sample, fixed responsive table overflow, wrote an interviewer-readable README with architecture rationale, and documented the Vercel deployment handoff.**

## What Happened

T01 aligned the demo sample phrase to `Build a 10×12 pressure-treated deck with 16-inch joist spacing, 4×4 posts, single level` — the exact M001 acceptance phrase. Mock extraction and summary fixtures were updated to reflect a single-level 10×12 deck (no stair cuts). The extraction cut table in the UI was fixed from `overflow-hidden` to `overflow-x-auto` for correct responsive behavior. Layout metadata was cleaned up. Seven new contract tests in `mock.test.ts` pin the sample phrase and fixture surfaces so regressions are caught automatically. The optimizer test was updated to the correct deterministic totals for the smaller fixture (21 boards, 29 cuts, $268.96 material cost).

T02 created `.gitignore` (covering `node_modules`, `.next`, `.env*`, `.vercel`, etc.) and `eslint.config.mjs` (ESLint 9 flat config, was entirely missing). `README.md` was restructured for an interviewer audience: quick local run, Architecture in 60 seconds diagram, why-Claude-vs-TypeScript rationale, scripts table, full API contract tables for `/api/extract` and `/api/summarize`, environment variable guidance, and Vercel deployment steps.

T03 ran full local closeout: `npm run test` (96/96 pass), `npm run lint` (0 errors/warnings), `npm run build` (both dynamic API routes present). Without `ANTHROPIC_API_KEY`, the app shows sanitized setup-error codes — no crash, no leak.

T04 probed Vercel auth via `npx vercel whoami`. The CLI returned "No existing credentials found" — interactive browser login is required. Per T04 plan, this is recorded as an explicit deployment blocker in `README.md` with the exact handoff steps.

## Verification

- `npm run test`: 8 test files, 96 tests, exit 0
- `npm run lint`: ESLint 9, 0 errors, 0 warnings, exit 0
- `npm run build`: Next.js production build, `ƒ /api/extract` and `ƒ /api/summarize` dynamic routes present, exit 0
- Production UAT: deferred — Vercel auth blocker documented in README

## Requirements Advanced

- R007 — Demo sample aligned to acceptance phrase; UI copy and responsive layout polished for construction-software presentation.
- R008 — README documents architecture, API contracts, deployment steps, and is oriented for interviewer review in under a minute.

## Requirements Validated

- R003 — Re-verified browser-callable TypeScript optimizer through test/lint/build closeout.
- R004 — Re-verified optimized cut sheet board layouts visible in real staged UI.
- R005 — Re-verified total cost and waste values visible from optimizer output.
- R010 — Re-verified unplaced cuts remain part of optimizer/UI diagnostics.

## Known Limitations

Production deployment (R009) requires manual Vercel login from a browser-capable environment. The README records the exact steps. Local verification is complete and the build is production-ready.

## Files Created/Modified

- `src/lib/cutsheet/mock.ts` — Sample scope and fixtures aligned to accepted 10×12 phrase.
- `src/lib/cutsheet/mock.test.ts` — New: 7 contract tests pinning demo sample and fixture surfaces.
- `src/lib/cutsheet/optimizer.test.ts` — Updated fixture totals for 10×12 scenario.
- `src/app/page.tsx` — Extraction table overflow fixed to `overflow-x-auto`.
- `src/app/layout.tsx` — Metadata description no longer says "mocked".
- `README.md` — Full restructure for interviewer audience with architecture rationale and deployment steps.
- `.gitignore` — New: covers node_modules, .next, .env*, .vercel, logs, editor noise.
- `eslint.config.mjs` — New: ESLint 9 flat config using eslint-config-next.
