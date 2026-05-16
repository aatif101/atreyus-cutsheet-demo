---
task: T02
slice: S05
milestone: M001
status: complete
completed_at: 2026-05-16T02:03:00.000Z
files_modified:
  - .gitignore
  - eslint.config.mjs
  - README.md
---

# T02: Document architecture and deployment hygiene

## What was done

Created `.gitignore` covering `node_modules/`, `.next/`, `out/`, `dist/`, `build/`, `coverage/`, `.env*`, `.vercel/`, logs, and editor/OS noise. Created `eslint.config.mjs` using the `eslint-config-next` flat config (ESLint 9 format) — this was missing entirely from the project. Rewrote `README.md` with the sections specified in the plan: what the demo is, quick local run, Architecture in 60 seconds (ASCII diagram + why Claude vs TypeScript reasoning), scripts table, API contracts with request/response/error tables for both endpoints, environment variable table, Vercel deployment steps, production verification checklist, and a key source files table. All 12×16/stair references replaced with the accepted 10×12 sample phrase.

## Verification

`npm run lint` — 0 errors, 0 warnings (exit 0).
