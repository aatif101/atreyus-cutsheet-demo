# S05: Demo polish, README, and Vercel deployment

**Goal:** Polish the final Atreyus CutSheet demo, align docs and sample input with milestone acceptance, and deploy/verify the real staged flow on Vercel without weakening the existing LLM extraction -> deterministic browser optimization -> LLM summary architecture.
**Demo:** After this: The app feels like a credible construction-software demo, the README explains the architecture, and the production Vercel URL is verified with the sample input.

## Tasks
- [ ] **T01: Polish estimator UI and align sample scope** — Why: S05 must make the existing S04 flow feel credible for a construction-estimator demo and remove the mismatch between the milestone's accepted sample phrase and the current richer 12x16 fixture. Expected executor skills: frontend-design, make-interfaces-feel-better, react-best-practices.

Do:
1. Update `SAMPLE_DECK_SCOPE` to the exact acceptance phrase and update the mock extraction/summary fixture copy so tests and fallback/demo docs do not describe a 12x16 stair/deck scenario.
2. Refine `src/app/page.tsx` copy and visual hierarchy for an estimator audience: emphasize Claude extraction, local deterministic TypeScript optimization, and Claude estimator summary as proof points.
3. Preserve the existing `runCutSheetStages` seam; do not import server-only Claude modules into client code and do not move optimizer logic into API routes.
4. Fix responsive clipping in the extraction/cut table areas by using horizontal overflow or responsive cards, while keeping board layouts, purchase list, total cost, waste values, assumptions, warnings, double-checks, and unplaced-cut/manual-review panels visible.
5. Update `src/app/layout.tsx` metadata to remove stale mock/prototype language.
6. Add a focused Vitest contract test that pins the default sample phrase and verifies mock/demo optimizer surfaces still include placed board layouts plus visible diagnostics-relevant totals/unplaced-cut fields after the fixture change.

Done when: the UI copy is demo-ready, the default sample matches acceptance, metadata is accurate, responsive table overflow is fixed, and the new test plus existing tests prove the demo contract did not regress.

Threat Surface (Q3): user-provided scope text still goes only through existing validated staged flow; no new secret exposure should be introduced. Requirement Impact (Q4): directly supports R007 and re-verifies R003/R004/R005/R010 by keeping optimizer output surfaces visible. Failure Modes (Q5): if Claude endpoints fail, UI must still show sanitized stage errors and preserve upstream outputs as S04 established. Load Profile (Q6): no new shared resources; client rendering cost remains proportional to cuts/layout count. Negative Tests (Q7): empty scope remains locally blocked, and unplaced-cut/manual-review UI remains present even when the sample has no unplaced cuts.
  - Estimate: 2h
  - Files: src/app/page.tsx, src/app/layout.tsx, src/app/globals.css, src/lib/cutsheet/mock.ts, src/lib/cutsheet/mock.test.ts
  - Verify: npm run test
- [ ] **T02: Document architecture and deployment hygiene** — Why: The final demo needs interviewer-readable documentation and safe repo hygiene before secrets, Vercel linkage, or local dotenv files are introduced. Expected executor skills: write-docs.

Do:
1. Create a project `.gitignore` that excludes at minimum `node_modules/`, `.next/`, `out/`, coverage artifacts, `.env*`, `.vercel/`, logs, and local editor/OS noise while keeping template/example docs trackable.
2. Restructure the top of `README.md` around: what the demo is, quick local run, `Architecture in 60 seconds`, why Claude vs deterministic TypeScript is split this way, scripts, API contracts, deployment to Vercel, and a production verification checklist.
3. Replace stale 12x16 examples with the accepted 10x12 sample where relevant, or explicitly label any remaining richer fixtures as test fixtures.
4. Document required environment variables by name only (`ANTHROPIC_API_KEY`, optional token-backed Vercel CLI auth) and avoid asking readers to paste secrets into tracked files.
5. Add a production URL/evidence placeholder that T04 must update after successful Vercel UAT, or a clear blocker section if auth/secrets prevent deployment.

Done when: README can orient an interviewer in under a minute, deployment steps are reproducible, and git ignores secret/build/deployment-local files.

Threat Surface (Q3): docs must not include real secrets, provider responses, or local `.vercel` linkage. Requirement Impact (Q4): directly supports R008 and prepares R009. Failure Modes (Q5): if deployment auth is missing later, README should already have a place to record a blocker rather than overstating production readiness. Negative Tests (Q7): verify docs do not introduce committed-secret instructions or stale production claims.
  - Estimate: 1.5h
  - Files: README.md, .gitignore
  - Verify: npm run lint
- [ ] **T03: Run local closeout verification and staged UI smoke check** — Why: Before deploying, S05 needs fresh proof that polish/docs did not regress the tested optimizer, staged-flow contracts, lint, or production build. Expected executor skills: test, verify-before-complete.

Do:
1. Run the full local closeout commands: `npm run test`, `npm run lint`, and `npm run build`.
2. Start the local Next.js app with `npm run dev` using background process tooling.
3. In the browser, load the local app and verify the default sample text is the exact 10x12 acceptance phrase.
4. If `ANTHROPIC_API_KEY` is configured, run the full local staged flow and verify visible extraction, optimization, summary, cost, waste, board layouts, assumptions/warnings, double-checks, and unplaced/manual-review diagnostics.
5. If `ANTHROPIC_API_KEY` is not configured, do not collect secrets in this planning lane; verify the local validation/setup-error path is sanitized and document that full live-provider UAT is deferred to production deployment.
6. Fix any regressions discovered in T01/T02-owned files before proceeding.

Done when: all local commands pass, the production build includes dynamic extract/summarize routes, and local browser smoke evidence confirms either full staged output with credentials or a safe sanitized setup-error without credentials.

Threat Surface (Q3): local browser test exercises untrusted text input and API error display; ensure no secrets appear in UI or logs. Requirement Impact (Q4): re-verifies R003, R004, R005, R010 and supports R007/R009. Failure Modes (Q5): missing Anthropic setup should be visible as a stable sanitized API/UI error; summary failure must preserve extraction/optimization. Load Profile (Q6): single-user smoke, no scale concern. Negative Tests (Q7): empty input remains locally rejected and missing setup does not crash or leak internals.
  - Estimate: 1.5h
  - Files: src/app/page.tsx, src/app/layout.tsx, src/app/globals.css, src/lib/cutsheet/mock.ts, src/lib/cutsheet/mock.test.ts, README.md
  - Verify: npm run build
- [ ] **T04: Deploy to Vercel and verify production demo** — Why: M001 is not complete until the staged CutSheet demo is verified on a production Vercel URL with the exact sample input. Expected executor skills: verify-before-complete, agent-browser.

Do:
1. Confirm `.gitignore` exists before any Vercel link/deploy step and keep `.vercel/`, `.env*`, and tokens untracked.
2. Probe Vercel auth with CLI (`npx --yes vercel whoami` or token-backed equivalent). If auth is unavailable, follow secure credential collection policy in execution contexts that allow it; if no auth can be obtained, stop with an explicit deployment handoff and do not mark production acceptance complete.
3. Ensure the Vercel project has `ANTHROPIC_API_KEY` configured for production without exposing the value in logs, README, or chat.
4. Deploy the app with Vercel CLI, watching for Node engine/runtime warnings from the local Node 25 environment; if the CLI fails for engine reasons, retry from a supported Node 20/22/24 environment or document the blocker.
5. Navigate to the final production URL in the browser, run `Build a 10×12 pressure-treated deck with 16-inch joist spacing, 4×4 posts, single level`, and assert the complete staged flow: extraction first, browser optimization second, summary third.
6. Verify production UI visibly includes extracted cuts, assumptions/warnings, material cost, waste percent/value, board layouts, purchase list, manual-review/unplaced-cut diagnostics, estimator summary, and double-check list.
7. Update `README.md` with the verified production URL and concise verification date/evidence. If deployment cannot complete because auth/secrets are unavailable, update `README.md` with the blocker/handoff instead of a false URL.

Done when: the README records a verified production URL and UAT evidence, or it records an honest deployment blocker; production acceptance can only be claimed in the former case.

Threat Surface (Q3): Vercel token and Anthropic key are secrets; never print, commit, or include them in docs. User text reaches production APIs and provider calls through existing validation. Requirement Impact (Q4): directly validates R009 and re-verifies R003/R004/R005/R010 in production while closing R007/R008. Failure Modes (Q5): Vercel auth missing, Anthropic key missing, provider 5xx/invalid output, deploy engine mismatch, or browser summary failure must be recorded as blockers with sanitized evidence. Load Profile (Q6): demo is low concurrency, but provider rate limits and Vercel cold starts are the likely first bottlenecks at 10x. Negative Tests (Q7): production setup-error/auth/provider failures must not leak secrets; unplaced-cut diagnostics must remain visible rather than crashing or disappearing.
  - Estimate: 2h
  - Files: README.md
  - Verify: npm run build
