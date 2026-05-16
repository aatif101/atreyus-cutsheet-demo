---
task: T01
slice: S05
milestone: M001
status: complete
completed_at: 2026-05-16T02:00:00.000Z
files_modified:
  - src/lib/cutsheet/mock.ts
  - src/lib/cutsheet/mock.test.ts
  - src/lib/cutsheet/optimizer.test.ts
  - src/app/page.tsx
  - src/app/layout.tsx
---

# T01: Polish estimator UI and align sample scope

## What was done

Updated `SAMPLE_DECK_SCOPE` to the exact milestone acceptance phrase: `Build a 10×12 pressure-treated deck with 16-inch joist spacing, 4×4 posts, single level`. Trimmed `MOCK_EXTRACTION_RESULT` to a single-level 10×12 deck (removed stair cuts, adjusted joist count to 9, beam lengths to 120", post count to 4). Updated `MOCK_ESTIMATOR_SUMMARY` title, overview, and material cost totals to match the 10×12 scenario. Fixed `layout.tsx` metadata description to remove stale "mocked" language. Fixed the extraction cut table in `page.tsx` from `overflow-hidden` to `overflow-x-auto` so the table scrolls horizontally on small viewports instead of clipping. Updated `optimizer.test.ts` totals for the new fixture (21 boards, 29 cuts, $268.96). Created `mock.test.ts` with 7 contract tests pinning the sample phrase, verifying no stair cuts, checking all structural cut categories, and asserting mock summary surfaces are present.

## Verification

`npm run test` — 96 tests passing across 8 test files (exit 0).
