import { describe, expect, it, vi } from "vitest";
import { MOCK_ESTIMATOR_SUMMARY, MOCK_EXTRACTION_RESULT } from "./mock";
import { optimizeCuts } from "./optimizer";
import { CutSheetFlowError, runCutSheetStages, validateScopeText } from "./staged-flow";
import type { EstimatorSummary, ExtractionResult, OptimizationResult } from "./types";

const jsonResponse = (body: unknown, init?: ResponseInit) =>
  new Response(JSON.stringify(body), {
    status: init?.status ?? 200,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
  });

describe("validateScopeText", () => {
  it("blocks empty scope text locally", () => {
    expect(validateScopeText("   ")).toBe("Enter a deck scope before running the CutSheet flow.");
    expect(validateScopeText("build a deck")).toBeNull();
  });
});

describe("runCutSheetStages", () => {
  it("runs extract, browser optimize, then summarize in order with exactly two API requests", async () => {
    const calls: string[] = [];
    const fetcher = vi.fn(async (url: string | URL | Request) => {
      calls.push(String(url));
      if (String(url) === "/api/extract") {
        return jsonResponse(MOCK_EXTRACTION_RESULT);
      }

      return jsonResponse(MOCK_ESTIMATOR_SUMMARY);
    }) as unknown as typeof fetch;

    const phases: string[] = [];
    const result = await runCutSheetStages("  Build a sample deck  ", {
      fetcher,
      onPhaseChange: (phase) => phases.push(phase),
    });

    expect(calls).toEqual(["/api/extract", "/api/summarize"]);
    expect(fetcher).toHaveBeenCalledTimes(2);
    expect(phases).toEqual(["extracting", "optimizing", "summarizing", "complete"]);
    expect(result.extraction).toEqual(MOCK_EXTRACTION_RESULT);
    expect(result.optimization.totals.requiredCuts).toBeGreaterThan(0);
    expect(result.summary).toEqual(MOCK_ESTIMATOR_SUMMARY);
  });

  it("halts before optimization and summary when extraction returns a sanitized API error", async () => {
    const fetcher = vi.fn(async () =>
      jsonResponse({ error: { code: "EXTRACTION_UPSTREAM_FAILED", message: "Extraction provider request failed." } }, { status: 502 }),
    ) as unknown as typeof fetch;
    const optimize = vi.fn(() => optimizeCuts(MOCK_EXTRACTION_RESULT.cuts));

    await expect(runCutSheetStages("deck", { fetcher, optimizeCuts: optimize })).rejects.toMatchObject({
      phase: "extracting",
      code: "EXTRACTION_UPSTREAM_FAILED",
      message: "Extraction provider request failed.",
    });
    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(optimize).not.toHaveBeenCalled();
  });

  it("surfaces malformed extraction success payloads before optimization", async () => {
    const fetcher = vi.fn(async () => jsonResponse({ cuts: "not-an-array" })) as unknown as typeof fetch;
    const optimize = vi.fn(() => optimizeCuts(MOCK_EXTRACTION_RESULT.cuts));

    await expect(runCutSheetStages("deck", { fetcher, optimizeCuts: optimize })).rejects.toMatchObject({
      phase: "extracting",
      code: "MALFORMED_EXTRACTION_RESPONSE",
    });
    expect(optimize).not.toHaveBeenCalled();
  });

  it("surfaces optimization exceptions without making a summary request", async () => {
    const fetcher = vi.fn(async () => jsonResponse(MOCK_EXTRACTION_RESULT)) as unknown as typeof fetch;
    const optimize = vi.fn(() => {
      throw new Error("boom");
    });
    const extractionSnapshots: ExtractionResult[] = [];

    await expect(
      runCutSheetStages("deck", {
        fetcher,
        optimizeCuts: optimize,
        onExtraction: (extraction) => extractionSnapshots.push(extraction),
      }),
    ).rejects.toMatchObject({ phase: "optimizing", code: "OPTIMIZATION_FAILED" });

    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(extractionSnapshots).toEqual([MOCK_EXTRACTION_RESULT]);
  });

  it("preserves extraction and optimization callbacks when summary fails", async () => {
    const fetcher = vi.fn(async (url: string | URL | Request) => {
      if (String(url) === "/api/extract") {
        return jsonResponse(MOCK_EXTRACTION_RESULT);
      }

      return jsonResponse({ error: { code: "SUMMARY_UPSTREAM_FAILED", message: "Summary provider request failed." } }, { status: 502 });
    }) as unknown as typeof fetch;
    const extractionSnapshots: ExtractionResult[] = [];
    const optimizationSnapshots: OptimizationResult[] = [];
    const summarySnapshots: EstimatorSummary[] = [];

    await expect(
      runCutSheetStages("deck", {
        fetcher,
        onExtraction: (extraction) => extractionSnapshots.push(extraction),
        onOptimization: (optimization) => optimizationSnapshots.push(optimization),
        onSummary: (summary) => summarySnapshots.push(summary),
      }),
    ).rejects.toMatchObject({
      phase: "summarizing",
      code: "SUMMARY_UPSTREAM_FAILED",
      message: "Summary provider request failed.",
    });

    expect(fetcher).toHaveBeenCalledTimes(2);
    expect(extractionSnapshots).toEqual([MOCK_EXTRACTION_RESULT]);
    expect(optimizationSnapshots).toHaveLength(1);
    expect(optimizationSnapshots[0].totals.requiredCuts).toBeGreaterThan(0);
    expect(summarySnapshots).toEqual([]);
  });

  it("normalizes network failures without exposing raw errors", async () => {
    const fetcher = vi.fn(async () => {
      throw new Error("contains stack details");
    }) as unknown as typeof fetch;

    try {
      await runCutSheetStages("deck", { fetcher });
      throw new Error("expected runCutSheetStages to fail");
    } catch (error) {
      expect(error).toBeInstanceOf(CutSheetFlowError);
      expect(error).toMatchObject({ phase: "extracting", code: "NETWORK_ERROR" });
      expect((error as Error).message).not.toContain("stack");
    }
  });
});
