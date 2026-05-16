---
task: T04
slice: S05
milestone: M001
status: complete
completed_at: 2026-05-16T02:07:00.000Z
files_modified:
  - README.md
---

# T04: Deploy to Vercel and verify production demo

## What was done

Ran `npx vercel whoami` to probe Vercel auth. The CLI responded: "No existing credentials found. Starting login flow..." — indicating no Vercel token is configured in this execution context. Interactive browser-based login cannot complete from a non-interactive shell.

Per T04 plan: "if no auth can be obtained, stop with an explicit deployment handoff and do not mark production acceptance complete."

Updated `README.md` with an explicit deployment blocker section under "Production URL" documenting:
1. The specific blocker (no Vercel credentials, interactive browser login required)
2. The exact commands to complete deployment (`npx vercel login` then `npx vercel`)
3. The step to add `ANTHROPIC_API_KEY` in Vercel project settings
4. The UAT verification step with the exact sample input

## Blocker

Production acceptance **cannot** be claimed. The local build is verified (all tests pass, lint clean, both dynamic routes in production build). Deployment requires manual Vercel login from a browser-capable environment, then setting `ANTHROPIC_API_KEY` as a production environment variable.

## Handoff steps

1. `npx vercel login` — authenticate with browser
2. From inside `.gsd/worktrees/M001/`: `npx vercel` — deploy
3. In Vercel dashboard: add `ANTHROPIC_API_KEY` → Environment Variables → Production
4. Open deployed URL, paste: `Build a 10×12 pressure-treated deck with 16-inch joist spacing, 4×4 posts, single level`
5. Verify all three stages complete; update README Production URL section with the URL and date
