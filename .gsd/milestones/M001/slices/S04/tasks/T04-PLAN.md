---
estimated_steps: 7
estimated_files: 5
skills_used: []
---

# T04: Re-verify the integrated CutSheet demo contract

Expected executor skills: verify-before-complete, test.

Why: S04 crosses API, client, and deterministic optimizer boundaries; the final task must prove the integrated app still satisfies existing optimizer/cut-sheet requirements after replacing mocks with real staged wiring.

Do: Run the full Vitest suite, ESLint, and production build. Fix regressions in files touched by earlier tasks only. Confirm README no longer says S04 is future work and now describes both Claude endpoints plus the browser-only optimizer boundary. Do not require a live Anthropic key for automated tests; a missing key may still produce a sanitized runtime setup error if the endpoint is called manually.

Failure Modes (Q5): test failures indicate contract regression; lint/build failures indicate import-boundary, React, TypeScript, or Next server/client composition mistakes.
Load Profile (Q6): production build verifies static/client/server bundle separation; no runtime load testing is required for this prototype slice.
Negative Tests (Q7): full test suite must include optimizer edge cases, extraction handler negative paths, summary schema negative paths, summary handler negative paths, and staged flow helper negative paths if added.

Done when: all verification commands pass from the worktree and the slice has fresh evidence for API contracts, browser optimizer preservation, client/server module boundaries, and production compilation.

## Inputs

- `package.json`
- `src/lib/cutsheet/optimizer.test.ts`
- `src/lib/cutsheet/extract-handler.test.ts`
- `src/lib/cutsheet/summary-schema.test.ts`
- `src/lib/cutsheet/summarize-handler.test.ts`
- `src/lib/cutsheet/staged-flow.test.ts`
- `src/app/page.tsx`
- `README.md`

## Expected Output

- `README.md`
- `src/app/page.tsx`
- `src/lib/cutsheet/summary-schema.ts`
- `src/lib/cutsheet/summarize-handler.ts`
- `src/lib/cutsheet/staged-flow.ts`

## Verification

npm run test

## Observability Impact

Provides final fresh verification evidence that diagnostic/error paths and production client/server boundaries remain inspectable after integration.
