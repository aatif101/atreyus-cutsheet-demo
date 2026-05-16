---
estimated_steps: 7
estimated_files: 3
skills_used: []
---

# T01: Define and test the summary validation boundary

Expected executor skills: tdd, api-design.

Why: D008 requires the summary endpoint to fail closed with a small local TypeScript validator, matching the extraction boundary pattern and preventing malformed Claude output from entering the UI.

Do: Add `src/lib/cutsheet/summary-schema.ts` with a `SummaryValidationError`, stable validation error code, and `validateEstimatorSummary(modelOutput: unknown): EstimatorSummary`. Validate the existing `EstimatorSummary` shape from `src/lib/cutsheet/types.ts`: required non-empty `title`, `overview`, and `disclaimer`; `materialLines` with non-empty id/label/unit, positive finite quantity/unitCost/totalCost; `laborNotes` as non-empty strings; `doubleChecks` with non-empty id/title/detail and severity limited to `info`, `warning`, or `review`. Trim strings and collect issues before throwing, as `extraction-schema.ts` does. Add focused Vitest coverage in `src/lib/cutsheet/summary-schema.test.ts` for valid output, trimming, missing arrays, invalid severity, invalid numeric cost fields, empty labor notes, and malformed double-check entries.

Failure Modes (Q5): malformed Claude JSON objects must throw `SummaryValidationError`; wrong enum/numeric/string values must not be silently coerced into user-visible summary content.
Load Profile (Q6): validation is in-memory and linear over summary lines/checks; the first 10x breakpoint is oversized request/model payloads handled in the later API task.
Negative Tests (Q7): cover wrong root type, missing required arrays, invalid severity, non-finite/negative costs, empty strings, and nested malformed records.

Done when: the validator returns typed `EstimatorSummary` for valid data, rejects malformed model output with issue aggregation, and tests prove the boundary without importing `server-only` or Anthropic.

## Inputs

- `src/lib/cutsheet/types.ts`
- `src/lib/cutsheet/extraction-schema.ts`
- `src/lib/cutsheet/extraction-schema.test.ts`

## Expected Output

- `src/lib/cutsheet/summary-schema.ts`
- `src/lib/cutsheet/summary-schema.test.ts`

## Verification

npm run test -- src/lib/cutsheet/summary-schema.test.ts

## Observability Impact

Adds a stable validation error class/code so malformed provider output can be mapped to a sanitized API response and diagnosed in handler tests without leaking validator internals.
