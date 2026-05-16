# S05 Research: Demo polish, README, and Vercel deployment

## Scope and active requirements

S05 owns the final demo closeout requirements:

- **R007**: credible construction-software UI.
- **R008**: interviewer-readable architecture explanation.
- **R009**: local and production deployability.

It also re-supports previously validated optimizer/UI requirements during closeout: **R003** browser-callable deterministic optimizer, **R004** visible board layouts, **R005** visible cost/waste, and **R010** visible unplaced-cut diagnostics.

## Summary

The app already has the core staged flow from S04: `src/app/page.tsx` calls `runCutSheetStages`, which performs `/api/extract` -> browser `optimizeCuts` -> `/api/summarize`, preserving extraction/optimization output if summary fails. S05 should not redesign the architecture; it should polish the existing page, update stale copy/docs, and perform deployment closeout.

Big findings for planning:

1. **Production deployment is not currently linked/authenticated.** No `.vercel/` directory exists, global `vercel` is not installed, and `npx --yes vercel whoami` returns `No existing credentials found. Please run vercel login or pass "--token"`.
2. **README lacks Vercel/deployment instructions and production URL evidence.** It documents local setup and API contracts well, but not deployment/env setup or the final verified URL.
3. **Demo input is inconsistent with milestone acceptance.** Milestone acceptance names `Build a 10×12 pressure-treated deck with 16-inch joist spacing, 4×4 posts, single level`; current `SAMPLE_DECK_SCOPE` is a more complex 12 ft x 16 ft deck with stairs. S05 should align the sample chip/text with the acceptance sample or explicitly document why a richer sample is used.
4. **UI is functional but still generic/styled as an app shell rather than a construction estimator tool.** It has strong stage visibility, totals, board layouts, assumptions, warnings, and double-checks, but could use trade-specific framing, cleaner density, and more production-demo copy.
5. **There is no project `.gitignore`.** Only local `.git/info/exclude` ignores `node_modules/` and `.next/`; `.env*` and `.vercel/` are not project-ignored. Add a repo `.gitignore` before collecting secrets or linking Vercel.
6. **Metadata is stale.** `src/app/layout.tsx` description still says `A mocked CutSheet flow...`, which contradicts the live staged flow.
7. **Potential mobile polish issue.** Stage 01 table uses `min-w-[720px]` inside `overflow-hidden`, likely clipping on narrow screens. S05 should use horizontal overflow (`overflow-x-auto`) or responsive cards.

## Recommendation

Plan S05 as three vertical tasks plus final closeout:

1. **Demo polish and copy alignment**
   - Target: `src/app/page.tsx`, `src/app/layout.tsx`, `src/app/globals.css`, maybe `src/lib/cutsheet/mock.ts`.
   - Keep the existing staged-flow seam and domain modules untouched unless sample text changes require fixture updates.
   - Update stale metadata and visible copy from prototype/mock language to credible estimator language.
   - Add small proof points in the UI: “Claude parses scope”, “TypeScript optimizer runs locally”, “Claude summarizes estimate”, “illustrative pricing”.
   - Fix responsive table overflow.
   - Preserve required surfaces: cost, waste, board layouts, assumptions, warnings, double-checks, and unplaced cuts.

2. **README/deployment documentation**
   - Target: `README.md`, new `.gitignore`.
   - Add a concise “Architecture in 60 seconds” section for the interview audience.
   - Add local setup with `ANTHROPIC_API_KEY` without telling the user to paste secrets into tracked files.
   - Add Vercel deployment notes: project link/deploy, required `ANTHROPIC_API_KEY`, and production verification checklist.
   - Add final production URL field once deployment succeeds; if auth is unavailable, document handoff instead of claiming production verification.

3. **Vercel deployment and production UAT**
   - First create `.gitignore` for `.env*`, `.vercel`, `.next`, `node_modules`, coverage, etc.
   - Current auth state requires either secure collection of Vercel credentials/token or user-authenticated Vercel session. Use secure env tooling if a `VERCEL_TOKEN` or `ANTHROPIC_API_KEY` is missing; do not ask the user to paste secrets in chat or edit `.env` manually.
   - Link/deploy through Vercel CLI only after auth is available. Since `.vercel/` is usually local machine linkage and can contain project metadata, keep it ignored unless the team intentionally wants committed linkage.
   - Production UAT must run the sample input in the browser against the Vercel URL and verify visible staged output, cost/waste/board layouts, assumptions/double-checks, and no hidden crash on unplaced diagnostics.

4. **Closeout verification**
   - Fresh `npm run test`, `npm run lint`, `npm run build`.
   - Local browser verification with `npm run dev` if credentials are configured.
   - Production browser verification on the Vercel URL. If Vercel auth/secrets cannot be obtained, stop at a deployment handoff; do not mark production acceptance complete.

## Implementation landscape

### Existing app/UI files

- `src/app/page.tsx`
  - Client component containing all current UI and staging state.
  - Imports `SAMPLE_DECK_SCOPE`, `runCutSheetStages`, display formatters, and CutSheet types.
  - Current strengths: explicit stage cards, status badge, extraction table, assumptions/warnings, metric cards, purchase list, board layouts, unplaced-cut panel, summary material lines/labor notes/double-checks.
  - Current polish targets:
    - Header copy can be more Atreyus/construction-specific and less generic.
    - `overflow-hidden` around min-width extraction table likely clips on mobile.
    - The board layout is chip-based; acceptable for Loom, but could be improved with proportional bars if time allows.
    - There is no persistent “architecture boundary” mini-panel beyond stage copy.

- `src/app/layout.tsx`
  - Metadata title is good.
  - Description is stale: `A mocked CutSheet flow for the Atreyus AI internship application.` Update to live staged architecture.

- `src/app/globals.css`
  - Minimal global setup. Safe place for font smoothing/focus improvements only; most styling is Tailwind inline.

- `src/lib/cutsheet/mock.ts`
  - Defines `SAMPLE_DECK_SCOPE` as a 12x16 richer deck, not milestone’s 10x12 sample.
  - Also contains mock extraction/summary fixtures that may still be used in tests or older docs. If sample changes, update tests/snapshots that assume the old scope.

### Flow and domain seams

- `src/lib/cutsheet/staged-flow.ts`
  - Browser-safe seam. `runCutSheetStages` validates input, posts extract JSON, calls injected/default `optimizeCuts`, posts summarize JSON, and emits phase callbacks.
  - Tests already prove phase order and failure preservation; avoid moving this logic into page code.

- `src/lib/cutsheet/optimizer.ts`
  - Pure deterministic optimizer. Leave algorithm alone for S05 unless UI polish reveals display-only issues.

- `src/lib/cutsheet/format.ts`
  - Display-only formatting for currency, percent, feet/inches. Use this for any new UI, do not hand-roll formatting in JSX.

- `src/app/api/extract/route.ts`, `src/app/api/summarize/route.ts`
  - Route wrappers around validated handlers. S05 should not need API contract changes.

### Docs/config/deployment

- `README.md`
  - Already documents local setup, extract/summarize API contracts, error shapes, and architecture boundary.
  - Missing deployment instructions, production URL, Loom/demo checklist, and a crisp interviewer-facing architecture summary near the top.

- `.gitignore`
  - Missing from worktree. Add it before deployment/secrets work.

- `next.config.ts`
  - Empty config, no known blocker.

- Vercel state
  - No `.vercel` directory.
  - `vercel` is not installed globally.
  - `npx --yes vercel whoami` reports no credentials.
  - `npx --yes vercel --version` works enough to download/launch CLI, but emitted npm `EBADENGINE` warnings because local Node is `v25.2.1`; Vercel packages expect Node `^20.9.0 || ^22.11.0 || ^24` for one transient package. This warning did not prevent `whoami`, but deploy executors should watch for build/runtime engine issues.

## Natural seams for planner

### Seam A: UI credibility polish

Can be done mostly independently from README/deploy.

Suggested work:

- Update `src/app/layout.tsx` metadata.
- Refine header/status/input copy in `src/app/page.tsx`.
- Add a compact architecture/credibility panel if it helps the Loom: “LLM extraction”, “TypeScript optimizer”, “LLM summary”.
- Fix responsive overflow for extraction table.
- Keep all existing stage/test contract labels or update tests if labels are asserted.
- Optional but valuable: add proportional board bars or grouped layout headings to make board layouts more visually obvious in screenshots.

### Seam B: Sample input alignment

This may touch `src/lib/cutsheet/mock.ts`, README examples, and possibly tests. Decide before polish copy.

Options:

- **Recommended for acceptance:** Set `SAMPLE_DECK_SCOPE` to the milestone sample (`Build a 10×12 pressure-treated deck with 16-inch joist spacing, 4×4 posts, single level`) and update README examples.
- **Alternative:** Keep richer 12x16 sample for better visual output, but add a README/demo note that the acceptance phrase also works and use it during UAT. This is weaker because the acceptance criterion explicitly names the 10x12 phrase.

Risk: real Claude extraction prompt quality for the shorter 10x12 phrase must produce enough cuts for a compelling board layout. UAT should verify the exact acceptance phrase.

### Seam C: README and repo hygiene

Can proceed after deciding sample wording.

Suggested work:

- Add `.gitignore`.
- Restructure README top:
  - What it is.
  - Run locally.
  - Architecture: Claude extraction -> deterministic browser optimizer -> Claude summary.
  - Why this division is defensible.
  - Deploy to Vercel and required env var.
  - Verification checklist.
- Avoid instructions that ask users to paste secrets into tracked files. Mention environment variables generically; execution agents must use secure env tooling for actual secret collection.

### Seam D: Deployment/UAT

Depends on repo hygiene and likely on secret collection/auth.

Suggested work:

- Probe auth again before deploying.
- If `ANTHROPIC_API_KEY` missing for local/prod, collect securely.
- If Vercel auth missing, collect/use `VERCEL_TOKEN` securely or stop with handoff if unavailable.
- Deploy production and record URL in README/S05 summary only after browser verification succeeds.

## First proof

Highest-risk unblocker is **deployment auth and env availability**, not code. The app has passed S04 test/lint/build, but production acceptance cannot be claimed without Vercel auth and `ANTHROPIC_API_KEY` in the deployed environment.

For execution, first proof should be:

1. Add `.gitignore` so secrets/linkage are safe.
2. Verify local `npm run build` still passes after any UI/docs changes.
3. Confirm Vercel auth path (`vercel whoami` or token-backed equivalent) and project linkage.
4. Configure `ANTHROPIC_API_KEY` in Vercel through secure tooling/CLI.
5. Deploy and browser-test exact acceptance sample on production URL.

## Verification plan

Required commands/checks for S05 closeout:

```bash
npm run test
npm run lint
npm run build
```

Browser/local checks:

- Start `npm run dev`.
- Run the exact acceptance sample: `Build a 10×12 pressure-treated deck with 16-inch joist spacing, 4×4 posts, single level`.
- Assert visible stage order and final complete state.
- Assert visible:
  - extracted cuts/assumptions/warnings,
  - material cost,
  - waste percent/value,
  - board layouts,
  - purchase list,
  - manual review/unplaced cuts panel,
  - estimator summary and double-check list.

Production checks:

- Navigate to final Vercel URL.
- Repeat sample UAT in browser.
- Record URL and evidence in S05 completion artifacts.
- If summary fails due provider issues, check that extraction/optimization remain visible, but this is not sufficient for final production acceptance unless the successful full flow is later verified.

## Skill discovery

Installed skills directly relevant from the prompt:

- `frontend-design` / `make-interfaces-feel-better`: useful for UI polish, restrained visual hierarchy, hover/focus details.
- `react-best-practices`: relevant because this is a React/Next.js client component; avoid unnecessary client/server boundary regressions.
- `write-docs`: relevant for README/architecture explanation.
- `verify-before-complete`: should be used before claiming production deployment or slice completion.

External skill discovery for Vercel:

- `npx skills find "Vercel deployment"` found a highly relevant skill: `vercel-labs/agent-skills@deploy-to-vercel` with ~51.2K installs. Install command would be:

```bash
npx skills add vercel-labs/agent-skills@deploy-to-vercel
```

Do not install automatically; user/runner should decide.

## Constraints and gotchas

- Stay inside the worktree; do not depend on parent repo files for `.gitignore` or deployment state.
- Keep `@anthropic-ai/sdk` server-only. Do not import Claude adapters into client code.
- Keep optimizer deterministic/browser-side and pure TypeScript.
- Use `format.ts` helpers for new display values.
- Do not hide unplaced-cut diagnostics just because the sample has none.
- Do not claim production verification if Vercel auth or provider secrets are unavailable.
- Vercel CLI auth is currently unavailable; plan for secure token collection or deployment handoff.
- Node `v25.2.1` generated `EBADENGINE` warnings from Vercel CLI transitive deps; if deploy fails strangely, retry on supported Node 20/22/24 or configure Vercel project runtime as needed.

## Research sources

- Memory query: CutSheet conventions and architecture memories (`MEM010`, `MEM007`, `MEM002`).
- Exec `a24639f7-01a9-4f2a-ad08-c977a8ba3bec`: project inventory and package scripts/deps.
- Exec `a2d17210-1665-4045-94e1-d89e9365dc84`: config/deploy files, tests, API routes, README/UI references.
- Exec `da6c3339-dc35-4125-9a22-96a06e625634`: staged-flow exports, metadata, git status scan.
- Exec `2e29c2fc-7091-4487-a4d8-d59bb34e6aa3`: Vercel CLI availability and local env file probe.
- Exec `b6f995d9-820b-4190-9313-9cbe63b81e3e`: Vercel auth status (`No existing credentials found`).
- Exec `85179e36-82ac-46f9-a21b-72de0da10727`: Node/npm versions, lockfile, ignore status.
