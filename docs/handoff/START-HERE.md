# Start Here — Atreyus CutSheet Demo Transfer

This folder contains the important progress from the current/possibly messy repository so a fresh repository can continue the project without inheriting the broken state.

## Current situation

- The current repo has GSD planning/progress artifacts, but the actual app source files are not present in the project root anymore.
- The useful progress to preserve is the product brief, requirements, roadmap, architecture decisions, and S01 implementation summary.
- The new repo should be treated as a fresh implementation using these artifacts as the source of truth.

## What you are building

A focused Next.js demo for an Atreyus AI internship application:

Natural-language construction scope → Claude extraction → deterministic browser-side lumber optimizer → Claude estimator summary.

Core sample input:

> Build a 10×12 pressure-treated deck with 16-inch joist spacing, 4×4 posts, single level.

## Recommended new repo setup

In the new folder/repository:

1. Create a fresh Next.js TypeScript app with Tailwind.
2. Add Vitest.
3. Recreate the S01 modules described below:
   - `src/lib/cutsheet/types.ts`
   - `src/lib/cutsheet/stock.ts`
   - `src/lib/cutsheet/optimizer.ts`
   - `src/lib/cutsheet/optimizer.test.ts`
   - `src/lib/cutsheet/format.ts`
   - `src/lib/cutsheet/format.test.ts`
   - `src/lib/cutsheet/mock.ts`
   - `src/app/page.tsx`
4. Continue from S02: add optimizer contract tests, harden optimizer if tests reveal gaps, then run quality gates.

## Current active work

Active milestone: `M001 — Atreyus CutSheet Demo`

Completed:

- `S01 — Thin mocked CutSheet flow with real optimizer`

Next:

- `S02 — Optimizer hardening with Vitest`
- First task: `T01 — Add optimizer contract tests`

## Architecture decisions to preserve

- Use two Claude endpoints:
  - `POST /api/extract`
  - `POST /api/summarize`
- Run optimization in pure browser-safe TypeScript.
- Use First Fit Decreasing for 1D lumber bin packing.
- Use inches internally everywhere; feet/feet-inches are display-only.
- Return impossible/unsupported cuts as `unplacedCuts`/`unplaced_cuts` diagnostics rather than crashing or silently dropping them.
- Use Vitest, not Jest.
- Build a mocked vertical slice before real Claude integration.

## Hard scope boundaries

Do not add:

- Auth/accounts/projects/saving.
- Database.
- PDF/image upload.
- Real supplier pricing integration.
- 2D sheet optimization.
- Marketing landing page, theme toggle, or fancy animation system.

## Verification targets

For S02:

```bash
npm run test -- --run src/lib/cutsheet/optimizer.test.ts
npm run lint
npm run build
```

For final milestone:

- Local app accepts the sample scope and renders extraction, optimization, and summary stages.
- Production Vercel URL works with `ANTHROPIC_API_KEY` configured.
- README explains: Claude handles ambiguous extraction/summary; TypeScript handles exact optimization.

## Source artifacts copied into this folder

- `PROJECT-SNAPSHOT.md` — high-level current project state.
- `M001-CONTEXT.md` — full milestone brief / PRD.
- `M001-ROADMAP.md` — slice roadmap.
- `S01-SUMMARY.md` — what was completed in the mocked vertical slice.
- `S02-PLAN.md` — next slice plan.
- `REQUIREMENTS.md` — capability contract.
- `DECISIONS.md` — architecture decisions.
