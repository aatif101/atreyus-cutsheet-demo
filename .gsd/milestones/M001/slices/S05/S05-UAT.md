---
id: S05-UAT
slice: S05
milestone: M001
status: partial
created_at: 2026-05-16T02:08:00.000Z
updated_at: 2026-05-16T02:08:00.000Z
---

# S05 UAT — Demo polish, README, and Vercel deployment

## Automated checks (all passed)

| Check | Result |
|---|---|
| `npm run test` — 96 tests | PASS |
| `npm run lint` — ESLint 9 | PASS (0 errors, 0 warnings) |
| `npm run build` — production build | PASS (both dynamic API routes present) |
| Contract test: sample phrase exact match | PASS |
| Contract test: no stair cuts in 10×12 fixture | PASS |
| Contract test: all structural categories present | PASS |

## Manual checks (pending Vercel deployment)

| Check | Status | Notes |
|---|---|---|
| Open deployed URL — all three stage panels load | PENDING | Vercel auth blocker; see README handoff steps |
| Paste `Build a 10×12 pressure-treated deck with 16-inch joist spacing, 4×4 posts, single level` → run | PENDING | Full staged flow: extract → optimize → summarize |
| Verify extraction table visible with scrollable overflow | PENDING | `overflow-x-auto` applied locally |
| Verify optimizer totals, board layouts, purchase list, waste visible | PENDING | |
| Verify estimator summary, double-checks, disclaimer visible | PENDING | |
| Verify empty input is locally rejected (no API call) | PENDING | |
| Verify setup-error on missing API key shows sanitized code only | PENDING | Confirmed locally without key |

## Production URL

> Not yet verified. See [README.md](README.md) → "Production URL" for handoff steps.
