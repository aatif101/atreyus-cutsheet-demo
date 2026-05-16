import { describe, expect, it } from "vitest";

import { SummaryValidationError } from "./summary-schema";
import {
  SUMMARY_ERROR_CODES,
  SummarySetupError,
  SummaryUpstreamError,
  handleSummarizeRequest,
  type SummarizeService,
} from "./summarize-handler";
import type { EstimatorSummary, ExtractionResult, OptimizationResult } from "./types";

const validExtraction: ExtractionResult = {
  scopeText: "Build a 12 ft by 16 ft pressure-treated deck with 2x8 beams and 2x6 joists.",
  cuts: [
    {
      id: "front-beam",
      label: "Front beam member",
      material: "pressure-treated",
      nominalSize: "2x8",
      lengthInches: 192,
      quantity: 2,
      source: "beam",
    },
  ],
  assumptions: [
    {
      id: "joist-spacing",
      label: "Joist spacing",
      detail: "Joists are assumed at 16 inches on center.",
    },
  ],
  warnings: ["Field verify final post heights."],
};

const validOptimization: OptimizationResult = {
  layouts: [
    {
      id: "pt-2x8-16-board-1",
      stock: {
        id: "pt-2x8-16",
        material: "pressure-treated",
        nominalSize: "2x8",
        lengthInches: 192,
        unitCost: 22.5,
        label: "2x8x16 pressure-treated board",
      },
      placedCuts: [
        {
          requiredCutId: "front-beam",
          label: "Front beam member",
          lengthInches: 192,
          source: "beam",
          instance: 1,
        },
      ],
      usedInches: 192,
      wasteInches: 0,
      cost: 22.5,
    },
  ],
  purchaseList: [
    {
      stockId: "pt-2x8-16",
      label: "2x8x16 pressure-treated board",
      material: "pressure-treated",
      nominalSize: "2x8",
      lengthInches: 192,
      quantity: 2,
      unitCost: 22.5,
      totalCost: 45,
    },
  ],
  unplacedCuts: [],
  totals: {
    boards: 2,
    placedCuts: 2,
    requiredCuts: 2,
    materialCost: 45,
    purchasedInches: 384,
    usedInches: 384,
    wasteInches: 0,
    wastePercent: 0,
  },
};

const validSummary: EstimatorSummary = {
  title: "Deck material estimate",
  overview: "Pressure-treated framing lumber estimate based on validated extraction and deterministic optimization.",
  materialLines: [
    {
      id: "pt-2x8-16",
      label: "2x8x16 pressure-treated board",
      quantity: 2,
      unit: "boards",
      unitCost: 22.5,
      totalCost: 45,
    },
  ],
  laborNotes: ["Field verify dimensions before cutting."],
  doubleChecks: [
    {
      id: "joist-spacing",
      severity: "review",
      title: "Verify joist spacing",
      detail: "Confirm assumed joist spacing before ordering material.",
    },
  ],
  disclaimer: "Planning estimate only; not an engineered design or final bid.",
};

const validBody = () => ({
  extraction: validExtraction,
  optimization: validOptimization,
});

const jsonRequest = (body: unknown): Request =>
  new Request("http://localhost/api/summarize", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });

const rawRequest = (body: string): Request =>
  new Request("http://localhost/api/summarize", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body,
  });

async function readJson(response: Response): Promise<unknown> {
  return response.json();
}

describe("handleSummarizeRequest", () => {
  it("returns estimator summary JSON for a valid request", async () => {
    const calls: unknown[] = [];
    const summarizeService: SummarizeService = async (input) => {
      calls.push(input);
      return validSummary;
    };

    const response = await handleSummarizeRequest(jsonRequest(validBody()), summarizeService);

    expect(response.status).toBe(200);
    expect(calls).toEqual([validBody()]);
    expect(await readJson(response)).toEqual(validSummary);
  });

  it("rejects invalid JSON with a 400 safe error shape", async () => {
    const response = await handleSummarizeRequest(rawRequest("{"), async () => validSummary);

    expect(response.status).toBe(400);
    expect(await readJson(response)).toEqual({
      error: {
        code: SUMMARY_ERROR_CODES.invalidJson,
        message: "Request body must be valid JSON.",
      },
    });
  });

  it.each([
    ["missing extraction", { optimization: validOptimization }, "extraction must be an object."],
    ["missing optimization", { extraction: validExtraction }, "optimization must be an object."],
    [
      "malformed extraction cut length",
      { ...validBody(), extraction: { ...validExtraction, cuts: [{ ...validExtraction.cuts[0], lengthInches: 0 }] } },
      "extraction.cuts[0].lengthInches must be a positive finite number.",
    ],
    [
      "malformed totals",
      { ...validBody(), optimization: { ...validOptimization, totals: { ...validOptimization.totals, materialCost: Number.NaN } } },
      "optimization.totals.materialCost must be a non-negative finite number.",
    ],
    [
      "malformed purchase line",
      { ...validBody(), optimization: { ...validOptimization, purchaseList: [{ ...validOptimization.purchaseList[0], quantity: 0 }] } },
      "optimization.purchaseList[0].quantity must be a positive integer.",
    ],
    [
      "missing layout and purchase data",
      {
        ...validBody(),
        optimization: {
          ...validOptimization,
          layouts: [],
          purchaseList: [],
          totals: { ...validOptimization.totals, requiredCuts: 2 },
        },
      },
      "optimization must include layouts or purchaseList for required cuts.",
    ],
    [
      "oversized payload",
      { ...validBody(), extraction: { ...validExtraction, scopeText: "x".repeat(61_000) } },
      "Request body must be 60000 characters or fewer.",
    ],
  ])("rejects %s with 400 before calling the summary service", async (_label, body, message) => {
    let calls = 0;
    const response = await handleSummarizeRequest(jsonRequest(body), async () => {
      calls += 1;
      return validSummary;
    });

    expect(calls).toBe(0);
    expect(response.status).toBe(400);
    expect(await readJson(response)).toEqual({
      error: {
        code: SUMMARY_ERROR_CODES.invalidInput,
        message,
      },
    });
  });

  it("maps missing setup to 503 without exposing setup error details", async () => {
    const response = await handleSummarizeRequest(jsonRequest(validBody()), async () => {
      throw new SummarySetupError("ANTHROPIC_API_KEY is missing");
    });

    expect(response.status).toBe(503);
    expect(await readJson(response)).toEqual({
      error: {
        code: SUMMARY_ERROR_CODES.setupMissing,
        message: "Summary service is not configured.",
      },
    });
  });

  it("maps upstream provider failure to 502 without exposing raw provider details", async () => {
    const response = await handleSummarizeRequest(jsonRequest(validBody()), async () => {
      throw new SummaryUpstreamError("provider stack trace and request payload details");
    });

    expect(response.status).toBe(502);
    expect(await readJson(response)).toEqual({
      error: {
        code: SUMMARY_ERROR_CODES.upstreamFailed,
        message: "Summary provider request failed.",
      },
    });
  });

  it("maps malformed model output validation failure to 502 without exposing validator internals", async () => {
    const response = await handleSummarizeRequest(jsonRequest(validBody()), async () => {
      throw new SummaryValidationError(["materialLines[0].quantity must be a positive finite number"]);
    });

    expect(response.status).toBe(502);
    expect(await readJson(response)).toEqual({
      error: {
        code: SUMMARY_ERROR_CODES.validationFailed,
        message: "Summary provider returned invalid structured output.",
      },
    });
  });

  it("maps unexpected summary failures to the sanitized upstream 502 shape", async () => {
    const response = await handleSummarizeRequest(jsonRequest(validBody()), async () => {
      throw new Error("unexpected implementation detail");
    });

    expect(response.status).toBe(502);
    expect(await readJson(response)).toEqual({
      error: {
        code: SUMMARY_ERROR_CODES.upstreamFailed,
        message: "Summary provider request failed.",
      },
    });
  });
});
