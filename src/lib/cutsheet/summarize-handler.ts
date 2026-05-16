import { SUMMARY_VALIDATION_ERROR_CODE, SummaryValidationError } from "./summary-schema";
import type { EstimatorSummary, ExtractionResult, OptimizationResult } from "./types";

export const SUMMARY_ERROR_CODES = {
  invalidJson: "INVALID_JSON",
  invalidInput: "INVALID_SUMMARY_INPUT",
  setupMissing: "SUMMARY_SETUP_MISSING",
  upstreamFailed: "SUMMARY_UPSTREAM_FAILED",
  validationFailed: SUMMARY_VALIDATION_ERROR_CODE,
} as const;

export type SummaryErrorCode = (typeof SUMMARY_ERROR_CODES)[keyof typeof SUMMARY_ERROR_CODES];

export interface SummaryErrorResponse {
  error: {
    code: SummaryErrorCode;
    message: string;
  };
}

export interface SummaryInput {
  extraction: ExtractionResult;
  optimization: OptimizationResult;
}

export type SummarizeService = (input: SummaryInput) => Promise<EstimatorSummary>;

const MAX_SUMMARY_PAYLOAD_LENGTH = 60_000;

export class SummarySetupError extends Error {
  readonly code = SUMMARY_ERROR_CODES.setupMissing;

  constructor(message = "Summary service is not configured.") {
    super(message);
    this.name = "SummarySetupError";
  }
}

export class SummaryUpstreamError extends Error {
  readonly code = SUMMARY_ERROR_CODES.upstreamFailed;

  constructor(message = "Summary provider request failed.") {
    super(message);
    this.name = "SummaryUpstreamError";
  }
}

export async function POST(request: Request): Promise<Response> {
  return handleSummarizeRequest(request);
}

export async function handleSummarizeRequest(
  request: Request,
  summarizeService: SummarizeService = defaultSummarizeService,
): Promise<Response> {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return jsonError(SUMMARY_ERROR_CODES.invalidJson, "Request body must be valid JSON.", 400);
  }

  const inputResult = readSummaryInput(body);
  if (!inputResult.ok) {
    return jsonError(SUMMARY_ERROR_CODES.invalidInput, inputResult.message, 400);
  }

  try {
    const summary = await summarizeService(inputResult.input);
    return Response.json(summary, { status: 200 });
  } catch (error) {
    if (error instanceof SummarySetupError) {
      return jsonError(SUMMARY_ERROR_CODES.setupMissing, "Summary service is not configured.", 503);
    }

    if (error instanceof SummaryValidationError) {
      return jsonError(SUMMARY_ERROR_CODES.validationFailed, "Summary provider returned invalid structured output.", 502);
    }

    if (error instanceof SummaryUpstreamError) {
      return jsonError(SUMMARY_ERROR_CODES.upstreamFailed, "Summary provider request failed.", 502);
    }

    return jsonError(SUMMARY_ERROR_CODES.upstreamFailed, "Summary provider request failed.", 502);
  }
}

async function defaultSummarizeService(input: SummaryInput): Promise<EstimatorSummary> {
  const { summarizeCutsWithClaude } = await import("./claude-summarize");
  return summarizeCutsWithClaude(input);
}

function readSummaryInput(body: unknown): { ok: true; input: SummaryInput } | { ok: false; message: string } {
  const serializedLength = serializedPayloadLength(body);
  if (serializedLength === null) {
    return { ok: false, message: "Request body must be JSON serializable." };
  }

  if (serializedLength > MAX_SUMMARY_PAYLOAD_LENGTH) {
    return { ok: false, message: `Request body must be ${MAX_SUMMARY_PAYLOAD_LENGTH} characters or fewer.` };
  }

  if (!isRecord(body)) {
    return { ok: false, message: "Request body must be an object with extraction and optimization objects." };
  }

  const extractionResult = readExtraction(body.extraction);
  if (!extractionResult.ok) {
    return extractionResult;
  }

  const optimizationResult = readOptimization(body.optimization);
  if (!optimizationResult.ok) {
    return optimizationResult;
  }

  return {
    ok: true,
    input: {
      extraction: extractionResult.extraction,
      optimization: optimizationResult.optimization,
    },
  };
}

function readExtraction(value: unknown): { ok: true; extraction: ExtractionResult } | { ok: false; message: string } {
  if (!isRecord(value)) {
    return { ok: false, message: "extraction must be an object." };
  }

  if (!isNonEmptyString(value.scopeText)) {
    return { ok: false, message: "extraction.scopeText must be a non-empty string." };
  }

  if (!Array.isArray(value.cuts)) {
    return { ok: false, message: "extraction.cuts must be an array." };
  }

  if (!Array.isArray(value.assumptions)) {
    return { ok: false, message: "extraction.assumptions must be an array." };
  }

  if (!Array.isArray(value.warnings)) {
    return { ok: false, message: "extraction.warnings must be an array." };
  }

  for (const [index, cut] of value.cuts.entries()) {
    if (!isRecord(cut)) {
      return { ok: false, message: `extraction.cuts[${index}] must be an object.` };
    }

    if (!isNonEmptyString(cut.id) || !isNonEmptyString(cut.label) || !isNonEmptyString(cut.material) || !isNonEmptyString(cut.nominalSize)) {
      return { ok: false, message: `extraction.cuts[${index}] must include id, label, material, and nominalSize strings.` };
    }

    if (!isPositiveFiniteNumber(cut.lengthInches)) {
      return { ok: false, message: `extraction.cuts[${index}].lengthInches must be a positive finite number.` };
    }

    if (!isPositiveInteger(cut.quantity)) {
      return { ok: false, message: `extraction.cuts[${index}].quantity must be a positive integer.` };
    }
  }

  return { ok: true, extraction: value as unknown as ExtractionResult };
}

function readOptimization(value: unknown): { ok: true; optimization: OptimizationResult } | { ok: false; message: string } {
  if (!isRecord(value)) {
    return { ok: false, message: "optimization must be an object." };
  }

  if (!Array.isArray(value.layouts)) {
    return { ok: false, message: "optimization.layouts must be an array." };
  }

  if (!Array.isArray(value.purchaseList)) {
    return { ok: false, message: "optimization.purchaseList must be an array." };
  }

  if (!Array.isArray(value.unplacedCuts)) {
    return { ok: false, message: "optimization.unplacedCuts must be an array." };
  }

  if (!isRecord(value.totals)) {
    return { ok: false, message: "optimization.totals must be an object." };
  }

  const totals = value.totals;
  const totalFields = ["boards", "placedCuts", "requiredCuts", "materialCost", "purchasedInches", "usedInches", "wasteInches", "wastePercent"] as const;
  for (const field of totalFields) {
    if (!isNonNegativeFiniteNumber(totals[field])) {
      return { ok: false, message: `optimization.totals.${field} must be a non-negative finite number.` };
    }
  }

  const requiredCuts = totals.requiredCuts;
  if (typeof requiredCuts !== "number" || !Number.isFinite(requiredCuts) || requiredCuts < 0) {
    return { ok: false, message: "optimization.totals.requiredCuts must be a non-negative finite number." };
  }

  if (value.layouts.length === 0 && value.purchaseList.length === 0 && requiredCuts > 0) {
    return { ok: false, message: "optimization must include layouts or purchaseList for required cuts." };
  }

  for (const [index, line] of value.purchaseList.entries()) {
    if (!isRecord(line)) {
      return { ok: false, message: `optimization.purchaseList[${index}] must be an object.` };
    }

    if (!isNonEmptyString(line.stockId) || !isNonEmptyString(line.label) || !isNonEmptyString(line.nominalSize)) {
      return { ok: false, message: `optimization.purchaseList[${index}] must include stockId, label, and nominalSize strings.` };
    }

    if (!isPositiveInteger(line.quantity)) {
      return { ok: false, message: `optimization.purchaseList[${index}].quantity must be a positive integer.` };
    }

    if (!isPositiveFiniteNumber(line.unitCost) || !isPositiveFiniteNumber(line.totalCost)) {
      return { ok: false, message: `optimization.purchaseList[${index}] must include positive unitCost and totalCost numbers.` };
    }
  }

  return { ok: true, optimization: value as unknown as OptimizationResult };
}

function serializedPayloadLength(value: unknown): number | null {
  try {
    return JSON.stringify(value).length;
  } catch {
    return null;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isPositiveFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value > 0;
}

function isNonNegativeFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0;
}

function isPositiveInteger(value: unknown): value is number {
  return Number.isInteger(value) && typeof value === "number" && value > 0;
}

function jsonError(code: SummaryErrorCode, message: string, status: number): Response {
  return Response.json({ error: { code, message } } satisfies SummaryErrorResponse, { status });
}
