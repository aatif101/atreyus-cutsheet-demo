# S02: S02

**Goal:** Harden the deterministic browser-callable CutSheet optimizer with Vitest coverage proving First Fit Decreasing packing, multi-material separation, inch-only math, current catalog cost and waste totals, and explicit unplaced cut diagnostics without introducing LLM or server dependencies.
**Demo:** The optimizer is covered by Vitest for multi-material packing, inches-only internals, waste and cost math, and unplaced cuts.

## Must-Haves

- `src/lib/cutsheet/optimizer.test.ts` contains named Vitest cases for First Fit Decreasing board reuse, multi-material separation, inch-based totals, waste and cost math against `src/lib/cutsheet/stock.ts`, quantity normalization, and invalid unsupported or oversize unplaced cuts.
- `optimizeCuts` remains a pure framework-free TypeScript function under `src/lib/cutsheet/optimizer.ts` with no Next, Node-only, Anthropic, or environment-variable imports.
- `npm run test -- --run src/lib/cutsheet/optimizer.test.ts`, `npm run lint`, and `npm run build` pass from the worktree root.
- Requirements R003, R010, and R011 are verifiable by tests rather than UI behavior alone.

## Proof Level

- This slice proves: Contract proof. Real runtime required: no. Human UAT required: no. The slice proves optimizer behavior through deterministic unit tests and project quality gates, not through the full app flow.

## Integration Closure

Upstream surfaces consumed: `src/lib/cutsheet/optimizer.ts`, `src/lib/cutsheet/types.ts`, `src/lib/cutsheet/stock.ts`, and `src/lib/cutsheet/mock.ts` from S01. New wiring introduced: none; this slice intentionally hardens the browser-safe optimizer contract without adding API routes or UI composition. Remaining before the milestone is end-to-end usable: S03 must add Claude extraction, S04 must wire the real staged UI and summary endpoint, and S05 must polish and deploy.

## Verification

- No runtime observability is added because this is a pure deterministic library slice. Diagnostics are provided by focused Vitest case names and unplaced cut result assertions, giving future agents a narrow failure surface when optimizer behavior regresses.

## Tasks

- [ ] **T01: Add optimizer contract tests** `est:1h`
  Why: R011 needs executable proof of the deterministic optimizer contract before downstream extraction and UI code depend on its board layouts and totals.
  - Files: `src/lib/cutsheet/optimizer.test.ts`
  - Verify: npm run test -- --run src/lib/cutsheet/optimizer.test.ts

- [ ] **T02: Harden optimizer against contract gaps** `est:45m`
  Why: The new tests may expose small contract gaps in packing, total math, or invalid-cut handling. The production optimizer must satisfy those tests while staying browser-safe and deterministic.
  - Files: `src/lib/cutsheet/optimizer.ts`, `src/lib/cutsheet/optimizer.test.ts`
  - Verify: npm run test -- --run src/lib/cutsheet/optimizer.test.ts

- [ ] **T03: Run project quality gates** `est:30m`
  Why: S02 is library-focused, but the optimizer is imported by the Next.js page and must remain compatible with the whole project.
  - Files: `src/lib/cutsheet/optimizer.ts`, `src/lib/cutsheet/optimizer.test.ts`, `package.json`
  - Verify: npm run build

## Files Likely Touched

- src/lib/cutsheet/optimizer.test.ts
- src/lib/cutsheet/optimizer.ts
- package.json
