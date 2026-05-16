---
estimated_steps: 7
estimated_files: 5
skills_used: []
---

# T02: Implement the Claude summary API endpoint with sanitized failures

Expected executor skills: api-design, tdd, observability.

Why: S04 needs the second server-side Claude boundary promised by D001: `/api/summarize` must turn validated extraction plus deterministic optimization results into estimator-facing summary/double-check guidance while keeping secrets and provider details server-only.

Do: Create `src/lib/cutsheet/summarize-handler.ts` mirroring the extraction handler style with dependency injection. Accept a JSON object containing `extraction` and `optimization`; validate enough of the request shape before calling the summary service, including required extraction fields, optimization totals/layout or purchase data needed for the prompt, and a reasonable serialized payload length cap. Define stable error codes for invalid JSON, invalid summary input, setup missing, upstream failed, and validation failed. Create `src/lib/cutsheet/claude-summarize.ts` with `import "server-only"`, lazy Anthropic use, `ANTHROPIC_API_KEY` setup check, a prompt that demands JSON-only `EstimatorSummary`, and local validation via T01. Create `src/app/api/summarize/route.ts` delegating to the handler. Add `src/lib/cutsheet/summarize-handler.test.ts` proving success with an injected service and sanitized 400/502/503 responses for invalid JSON, malformed inputs, setup errors, upstream errors, `SummaryValidationError`, and unexpected errors. Update README with the summary API contract and architecture boundary.

Failure Modes (Q5): missing API key -> 503 `SUMMARY_SETUP_MISSING`; Anthropic/network/provider error -> 502 `SUMMARY_UPSTREAM_FAILED`; invalid model JSON or schema failure -> 502 `SUMMARY_VALIDATION_FAILED`; malformed user/client payload -> 400 before service call.
Load Profile (Q6): each successful request performs one Anthropic call and linear local validation; the 10x breakpoint is provider rate limits/latency, so no client retry loop should be introduced in this slice.
Negative Tests (Q7): invalid JSON, missing `extraction`, missing `optimization`, malformed totals/purchase lines, oversized payload, setup failure, upstream failure, malformed provider output, and unexpected thrown error.

Done when: `/api/summarize` has a real route, default handler lazy-loads only server-side Claude code, tests prove the contract without a live key, and docs describe request/response/error shapes.

## Inputs

- `src/lib/cutsheet/summary-schema.ts`
- `src/lib/cutsheet/types.ts`
- `src/lib/cutsheet/extract-handler.ts`
- `src/lib/cutsheet/claude-extract.ts`
- `src/app/api/extract/route.ts`
- `README.md`

## Expected Output

- `src/lib/cutsheet/summarize-handler.ts`
- `src/lib/cutsheet/summarize-handler.test.ts`
- `src/lib/cutsheet/claude-summarize.ts`
- `src/app/api/summarize/route.ts`
- `README.md`

## Verification

npm run test -- src/lib/cutsheet/summarize-handler.test.ts

## Observability Impact

Introduces summary-specific stable error codes and sanitized messages that browser/network inspection can use to localize setup, input, upstream, and malformed-output failures without exposing secrets or provider details.
